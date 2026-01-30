import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { ensureEligibleOrThrow } from './_matchmakingEligibility.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeLangHint(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'tr' || s === 'id' || s === 'en') return s;
  return '';
}

function nowMs() {
  return Date.now();
}

function dayKeyUtc(ts) {
  try {
    return new Date(typeof ts === 'number' ? ts : Date.now()).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

const PROPOSED_CHAT_LIMIT_PER_UID = 5;
const PROPOSED_CHAT_LIMIT_TOTAL = PROPOSED_CHAT_LIMIT_PER_UID * 2;
const LIMITED_CHAT_LIMIT_PER_UID = 5;
const LIMITED_CHAT_TEXT_MAX = 240;

// Eligibility kontrolü artık ortak helper üzerinden.

function containsContactLikeText(text) {
  const s = String(text || '').toLowerCase();

  // Links / domains
  if (/https?:\/\//i.test(s) || /www\./i.test(s) || /\b[a-z0-9-]+\.(com|net|org|id|tr|me)\b/i.test(s)) return true;

  // Social keywords
  if (/(instagram|insta|\big\b|facebook|\bfb\b|telegram|\bt\.me\b|whatsapp|\bwa\.me\b|line\b|tiktok|discord)/i.test(s)) return true;

  // Handle-like
  if (/@[a-z0-9_\.]{2,}/i.test(s)) return true;

  // Phone-like: long digit sequences (avoid false positives like 170 cm)
  const digitsOnly = s.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 8) {
    // require either +, or multiple separators, or very long number
    if (/\+\s*\d{8,}/.test(s)) return true;
    if (digitsOnly.length >= 10) return true;
    if (/(\d[\s\-\.\(\)]*){8,}/.test(s)) return true;
  }

  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireIdToken(req);
    const uid = decoded.uid;

    const body = normalizeBody(req);
    const matchId = safeStr(body?.matchId);
    const text = safeStr(body?.text);
    const langHint = normalizeLangHint(body?.langHint);

    if (!matchId || !text) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    if (text.length > 600) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'message_too_long' }));
      return;
    }

    if (containsContactLikeText(text)) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'filtered' }));
      return;
    }

    // Yeni model: Kullanıcı kendi dilinde yazar; çeviri sadece gelen mesajlarda manuel yapılır.

    const { db, FieldValue } = getAdmin();

    const matchRef = db.collection('matchmakingMatches').doc(matchId);
    const meRef = db.collection('matchmakingUsers').doc(uid);
    const matchNoCounterRef = db.collection('counters').doc('matchmakingMatchNo');

    const ts = nowMs();
    let messageId = '';

    await db.runTransaction(async (tx) => {
      const [matchSnap, meSnap] = await Promise.all([tx.get(matchRef), tx.get(meRef)]);
      if (!matchSnap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }

      const me = meSnap.exists ? (meSnap.data() || {}) : {};

      const match = matchSnap.data() || {};
      const status = String(match.status || '');

      const proposedChatPause = match?.proposedChatPause && typeof match.proposedChatPause === 'object' ? match.proposedChatPause : null;
      const proposedChatPaused = status === 'proposed' && !!proposedChatPause?.active;
      const proposedChatFocusUid = proposedChatPaused ? safeStr(proposedChatPause?.focusUid) : '';

      if (status !== 'mutual_accepted' && status !== 'proposed' && status !== 'contact_unlocked' && status !== 'mutual_interest') {
        const err = new Error('chat_not_available');
        err.statusCode = 400;
        throw err;
      }

      const userIds = Array.isArray(match.userIds) ? match.userIds.map(String).filter(Boolean) : [];
      if (userIds.length !== 2 || !userIds.includes(uid)) {
        const err = new Error('forbidden');
        err.statusCode = 403;
        throw err;
      }

      const otherUid = userIds.find((x) => x !== uid) || '';
      if (!otherUid) {
        const err = new Error('server_error');
        err.statusCode = 500;
        throw err;
      }

      const lock = me?.matchmakingLock && typeof me.matchmakingLock === 'object' ? me.matchmakingLock : null;
      const lockActive = !!lock?.active;
      const lockMatchId = safeStr(lock?.matchId);
      const longChatAllowed = (status === 'mutual_accepted' || status === 'contact_unlocked') && lockActive && lockMatchId === matchId;

      // Yeni ürün kuralı: Aktif eşleşme varken diğer profillerle etkileşim yok.
      // Bu yüzden, aktif lock başka bir match'e aitse kısa mesaj da engellenir.
      if (!longChatAllowed && lockActive && lockMatchId && lockMatchId !== matchId) {
        const err = new Error('active_match_locked');
        err.statusCode = 409;
        throw err;
      }

      // Kural: Reject alan kullanıcı, reject edene mesaj atamaz.
      // rejectBlockByUid = reject eden kullanıcı.
      const rejectBlockByUid = safeStr(match?.rejectBlockByUid);
      if (rejectBlockByUid && rejectBlockByUid === otherUid) {
        const err = new Error('dm_blocked_by_dislike');
        err.statusCode = 403;
        throw err;
      }

      // Cinsiyet bazlı eligibility (match application doc'larından okunur)
      // Firestore transaction kuralı: tüm okumalar yazmalardan önce olmalı.
      const aUid = safeStr(match?.aUserId);
      const bUid = safeStr(match?.bUserId);
      const aAppId = safeStr(match?.aApplicationId);
      const bAppId = safeStr(match?.bApplicationId);
      const [aAppSnap, bAppSnap] = await Promise.all([
        aAppId ? tx.get(db.collection('matchmakingApplications').doc(aAppId)) : Promise.resolve(null),
        bAppId ? tx.get(db.collection('matchmakingApplications').doc(bAppId)) : Promise.resolve(null),
      ]);
      const aGender = aAppSnap && aAppSnap.exists ? safeStr((aAppSnap.data() || {})?.gender) : '';
      const bGender = bAppSnap && bAppSnap.exists ? safeStr((bAppSnap.data() || {})?.gender) : '';
      const myGender = uid === aUid ? aGender : bGender;

      // Etkileşim kuralı: (env ile) mesaj göndermek için üyelik gerekebilir.
      // Not: Alıcı taraf için eligibility zorlamıyoruz.
      ensureEligibleOrThrow(me, myGender);

      // Uzun chat kapalıysa: kısa mesaj + limit + daha kısa uzunluk.
      if (!longChatAllowed) {
        if (text.length > LIMITED_CHAT_TEXT_MAX) {
          const err = new Error('short_message_too_long');
          err.statusCode = 400;
          throw err;
        }

        // Günlük kısa mesaj limiti (tüm eşleşmeler toplamı)
        const dailyLimitRaw = Number(process.env.SHORT_MESSAGE_DAILY_LIMIT || 5);
        const dailyLimit = Number.isFinite(dailyLimitRaw) ? Math.max(0, Math.min(50, Math.floor(dailyLimitRaw))) : 5;
        if (dailyLimit > 0) {
          const key = dayKeyUtc(ts);
          const prevMap = me?.shortMessageUsageDaily && typeof me.shortMessageUsageDaily === 'object' ? me.shortMessageUsageDaily : {};
          const usedPrev = key && typeof prevMap?.[key] === 'number' && Number.isFinite(prevMap[key]) ? prevMap[key] : 0;

          if (key && usedPrev >= dailyLimit) {
            const err = new Error('short_message_daily_limit');
            err.statusCode = 409;
            throw err;
          }

          if (key) {
            const next = { ...prevMap, [key]: usedPrev + 1 };
            const keys = Object.keys(next).sort();
            if (keys.length > 20) {
              for (const k of keys.slice(0, keys.length - 14)) delete next[k];
            }
            tx.set(
              meRef,
              {
                shortMessageUsageDaily: next,
                shortMessageUsageDailyUpdatedAtMs: ts,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
        }
      }

      // Kota/üyelik kısıtı yok: mesaj göndermede üyelik şartı ve lock şartı kaldırıldı.
      // Not: Mesaj göndermek için alıcının eligibility şartlarını zorlamıyoruz.
      // Amaç: Diğer taraf offline/uygunsuz durumda olsa bile mesaj kuyruk gibi düşsün,
      // karşı taraf panele girince unread/bildirim görsün.
      // (Aksiyonlar / contact unlock gibi adımlar kendi kurallarıyla ayrıca korunur.)

      // Not: Bu akışta chat süre sınırı yok; iptal/evlilik kararı ile kapanır.

      // proposed aşamasında kontrollü sohbet: mesaj limiti dolunca karar aşamasına geç.
      // Not: sohbet beklemede ise (pause) limit uygulanmaz; mesajlar bekletilir.
      if (status === 'proposed' && !proposedChatPaused) {
        const reachedAt = typeof match?.proposedChatLimitReachedAtMs === 'number' ? match.proposedChatLimitReachedAtMs : 0;
        if (reachedAt > 0) {
          const err = new Error('chat_limit_reached');
          err.statusCode = 409;
          throw err;
        }
      }

      const last = match?.chatLastMessageAtMs && typeof match.chatLastMessageAtMs[uid] === 'number' ? match.chatLastMessageAtMs[uid] : 0;
      if (last && ts - last < 1500) {
        const err = new Error('rate_limited');
        err.statusCode = 429;
        throw err;
      }

      const msgRef = matchRef.collection('messages').doc();
      messageId = msgRef.id;

      if (proposedChatPaused) {
        // Odak kullanıcı bu sohbeti kullanamaz.
        if (proposedChatFocusUid && proposedChatFocusUid === uid) {
          const err = new Error('chat_paused');
          err.statusCode = 409;
          throw err;
        }

        // Diğer taraf mesaj atabilir ama mesaj teslim edilmez (bekletilir).
        tx.set(msgRef, {
          matchId,
          userId: uid,
          text,
          ...(langHint ? { langHint } : {}),
          ...(longChatAllowed ? {} : { chatMode: 'short' }),
          createdAt: FieldValue.serverTimestamp(),
          createdAtMs: ts,
          delivery: {
            state: 'held',
            heldForUid: proposedChatFocusUid,
            reason: 'focus_active',
          },
        });
      } else {
        tx.set(msgRef, {
          matchId,
          userId: uid,
          text,
          ...(langHint ? { langHint } : {}),
          ...(longChatAllowed ? {} : { chatMode: 'short' }),
          createdAt: FieldValue.serverTimestamp(),
          createdAtMs: ts,
        });
      }


      const patch = {
        chatLastMessageAtMs: {
          ...(match.chatLastMessageAtMs || {}),
          [uid]: ts,
        },
        chatLastMessageAtMsAny: ts,
        chatLastMessageByUid: uid,
        chatLastMessageId: messageId,
        chatLastMessagePreview: text.slice(0, 120),
        chatUnreadByUid: {
          ...(match.chatUnreadByUid || {}),
          [uid]: 0,
          [otherUid]: (typeof (match.chatUnreadByUid || {})?.[otherUid] === 'number' ? (match.chatUnreadByUid || {})[otherUid] : 0) + 1,
        },
        updatedAt: FieldValue.serverTimestamp(),
      };

      // proposed aşamasında: limit sayacı (beklemede değilse)
      if (status === 'proposed' && !proposedChatPaused) {
        const counts = match?.proposedChatCountByUid && typeof match.proposedChatCountByUid === 'object' ? { ...match.proposedChatCountByUid } : {};
        const myPrev = typeof counts?.[uid] === 'number' && Number.isFinite(counts[uid]) ? counts[uid] : 0;
        if (myPrev >= PROPOSED_CHAT_LIMIT_PER_UID) {
          const err = new Error('short_message_limit');
          err.statusCode = 409;
          throw err;
        }
        counts[uid] = myPrev + 1;

        let total = 0;
        for (const v of Object.values(counts)) {
          const n = typeof v === 'number' && Number.isFinite(v) ? v : 0;
          total += n;
        }

        patch.proposedChatCountByUid = counts;
        patch.proposedChatTotalCount = total;
        patch.proposedChatLimitTotal = PROPOSED_CHAT_LIMIT_TOTAL;
        patch.proposedChatLimitPerUid = PROPOSED_CHAT_LIMIT_PER_UID;

        if (total >= PROPOSED_CHAT_LIMIT_TOTAL || counts[uid] >= PROPOSED_CHAT_LIMIT_PER_UID) {
          patch.proposedChatLimitReachedAtMs = ts;
          patch.proposedChatLimitReachedAt = FieldValue.serverTimestamp();
        }

        const starterUid = safeStr(match?.dmStarterUid);
        if (!starterUid) {
          patch.dmStarterUid = uid;
          patch.dmStartedAtMs = ts;
        }
      } else if (status === 'proposed' && proposedChatPaused) {
        // Beklemede de starter'ı set edelim (first message bilgisi kalsın)
        const starterUid = safeStr(match?.dmStarterUid);
        if (!starterUid) {
          patch.dmStarterUid = uid;
          patch.dmStartedAtMs = ts;
        }
      }

      // mutual_interest her zaman kısa mod; mutual_accepted/contact_unlocked da aktif match değilse kısa moda düşer.
      if ((status === 'mutual_interest' || status === 'mutual_accepted' || status === 'contact_unlocked') && !longChatAllowed) {
        const counts = match?.limitedChatCountByUid && typeof match.limitedChatCountByUid === 'object' ? { ...match.limitedChatCountByUid } : {};
        const myPrev = typeof counts?.[uid] === 'number' && Number.isFinite(counts[uid]) ? counts[uid] : 0;
        if (myPrev >= LIMITED_CHAT_LIMIT_PER_UID) {
          const err = new Error('short_message_limit');
          err.statusCode = 409;
          throw err;
        }
        counts[uid] = myPrev + 1;

        let total = 0;
        for (const v of Object.values(counts)) {
          const n = typeof v === 'number' && Number.isFinite(v) ? v : 0;
          total += n;
        }

        patch.limitedChatCountByUid = counts;
        patch.limitedChatTotalCount = total;
        patch.limitedChatLimitPerUid = LIMITED_CHAT_LIMIT_PER_UID;
        patch.limitedChatTextMax = LIMITED_CHAT_TEXT_MAX;
        if (counts[uid] >= LIMITED_CHAT_LIMIT_PER_UID) {
          patch.limitedChatLimitReachedAtMs = ts;
          patch.limitedChatLimitReachedAt = FieldValue.serverTimestamp();
        }
      } else {
        // mutual_accepted: backward-compat olarak chat mode'u boşsa set et.
        const currentMode = typeof match?.interactionMode === 'string' ? match.interactionMode : '';
        if (currentMode !== 'chat') {
          if (!currentMode) {
            patch.interactionMode = 'chat';
            patch.interactionChosenAt = FieldValue.serverTimestamp();
            patch.chatEnabledAt = FieldValue.serverTimestamp();
            patch.chatEnabledAtMs = ts;
          } else {
            const err = new Error('chat_not_enabled');
            err.statusCode = 400;
            throw err;
          }
        }
      }

      tx.set(matchRef, patch, { merge: true });
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, messageId }));
  } catch (e) {
    // Dev ortamında hata kök nedenini yakalamak için log + stack döndür.
    // Prod’da stack sızdırmayalım.
    // eslint-disable-next-line no-console
    console.error('[matchmaking-chat-send] error:', {
      message: String(e?.message || 'server_error'),
      code: e?.code ? String(e.code) : null,
      statusCode: e?.statusCode || null,
      stack: e?.stack ? String(e.stack) : null,
    });

    const isProd = String(process.env.NODE_ENV || '').toLowerCase().trim() === 'production';

    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: false,
        error: String(e?.message || 'server_error'),
        ...(!isProd && e?.stack ? { stack: String(e.stack) } : {}),
      })
    );
  }
}
