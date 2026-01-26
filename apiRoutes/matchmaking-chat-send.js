import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { ensureEligibleOrThrow, isMembershipActive } from './_matchmakingEligibility.js';

function isDevBypassEnabled() {
  const raw = String(process.env.MATCHMAKING_DEV_BYPASS || '').toLowerCase().trim();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

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

const PROPOSED_CHAT_LIMIT_TOTAL = 20;

function hasActiveLock(userDoc, exceptMatchId) {
  const lock = userDoc?.matchmakingLock || null;
  const active = !!lock?.active;
  const matchId = typeof lock?.matchId === 'string' ? lock.matchId : '';
  if (!active) return false;
  if (!matchId) return true;
  return matchId !== String(exceptMatchId || '');
}

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

      if (status !== 'mutual_accepted' && status !== 'proposed') {
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

      // Cinsiyet bazlı eligibility (match application doc'larından okunur)
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

      ensureEligibleOrThrow(me, myGender);

      // Bu projede “ücretsiz üyelikte mesaj yok” kuralı: mesaj göndermek için ücretli üyelik şart.
      // Local dev/testte MATCHMAKING_DEV_BYPASS=1 iken bu kapıyı bypass edebiliriz.
      if (!isDevBypassEnabled() && !isMembershipActive(me, ts)) {
        const err = new Error('membership_required');
        err.statusCode = 402;
        throw err;
      }

      // Başka bir match'e aktif kilit varsa, diğer match'lere mesaj engeli.
      if (hasActiveLock(me, matchId)) {
        const err = new Error('user_locked');
        err.statusCode = 409;
        throw err;
      }
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
        counts[uid] = myPrev + 1;

        let total = 0;
        for (const v of Object.values(counts)) {
          const n = typeof v === 'number' && Number.isFinite(v) ? v : 0;
          total += n;
        }

        patch.proposedChatCountByUid = counts;
        patch.proposedChatTotalCount = total;
        patch.proposedChatLimitTotal = PROPOSED_CHAT_LIMIT_TOTAL;

        if (total >= PROPOSED_CHAT_LIMIT_TOTAL) {
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
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
