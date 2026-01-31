import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { normalizeChatLang, translateText } from './_translate.js';
import { checkAndRecordGeminiTranslateRpm } from './_geminiTranslateRpm.js';
import {
  computeTranslationBilling,
  getUsageForMonth,
  monthKeyUTC,
  isSponsoredTranslationRevoked,
} from './_translationPolicy.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function nowMs() {
  return Date.now();
}

function normalizeReadyPhrase(v) {
  let s = safeStr(v).toLowerCase();
  if (!s) return '';
  // Strip common prefixes (legacy UI may have sent both lines).
  s = s.replace(/^\s*(tr|id)\s*:\s*/i, '');
  s = s.replace(/[\s\t]+/g, ' ').trim();
  // Remove trailing punctuation that often varies in chat.
  s = s.replace(/[.!?…]+$/g, '').trim();
  return s;
}

function splitReadyCandidates(text) {
  const raw = String(text || '').split(/\r?\n/).map((x) => String(x || '').trim()).filter(Boolean);
  if (!raw.length) return [];
  const out = [];
  for (const line of raw) {
    const n = normalizeReadyPhrase(line);
    if (n) out.push(n);
  }
  // Also try the full text as a single candidate
  const full = normalizeReadyPhrase(String(text || ''));
  if (full) out.push(full);
  return Array.from(new Set(out));
}

let READY_Q_MAP = null;

async function getReadyQuestionMap() {
  if (READY_Q_MAP) return READY_Q_MAP;
  const map = new Map();

  try {
    // Best-effort: deploy paketinde src yoksa endpoint çökmesin.
    const mod = await import('../src/data/geminiReadyContent.js');
    const list = Array.isArray(mod?.COMMON_QUESTIONS_TR_ID) ? mod.COMMON_QUESTIONS_TR_ID : [];
    for (const q of list) {
      const tr = safeStr(q?.tr);
      const id = safeStr(q?.id);
      if (!tr || !id) continue;
      const trKey = normalizeReadyPhrase(tr);
      const idKey = normalizeReadyPhrase(id);
      if (trKey) map.set(`tr:${trKey}`, { tr, id });
      if (idKey) map.set(`id:${idKey}`, { tr, id });
    }
  } catch {
    // ignore (fallback: empty map)
  }

  READY_Q_MAP = map;
  return map;
}

async function tryTranslateFromReadyLibrary({ text, targetLang }) {
  const candidates = splitReadyCandidates(text);
  if (!candidates.length) return '';

  // Only handle TR <-> ID for now.
  if (targetLang !== 'tr' && targetLang !== 'id') return '';

  const map = await getReadyQuestionMap();
  if (!map || map.size === 0) return '';

  for (const c of candidates) {
    const hit = map.get(`tr:${c}`) || map.get(`id:${c}`);
    if (!hit) continue;
    return targetLang === 'tr' ? hit.tr : hit.id;
  }
  return '';
}

function toUsagePercent(usedCount, limit) {
  if (limit === Infinity) return null;
  const used = typeof usedCount === 'number' && Number.isFinite(usedCount) ? usedCount : 0;
  const lim = typeof limit === 'number' && Number.isFinite(limit) && limit > 0 ? limit : 0;
  if (!lim) return null;
  const pct = Math.floor((used / lim) * 100);
  return Math.max(0, Math.min(100, pct));
}

const MAX_TRANSLATE_TEXT_LEN = 150;

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
    const messageId = safeStr(body?.messageId);
    const targetLang = normalizeChatLang(body?.targetLang);

    if (!matchId || !messageId || !targetLang) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();

    const matchRef = db.collection('matchmakingMatches').doc(matchId);
    const msgRef = matchRef.collection('messages').doc(messageId);
    const meRef = db.collection('matchmakingUsers').doc(uid);

    const ts = nowMs();
    const mKey = monthKeyUTC(ts);

    let translated = '';
    let billing = null;
    let sponsorUid = '';

    let usageUsedCount = null;
    let usageMonthlyLimit = null;
    let usagePercent = null;
    let usageBillingMode = '';

    await db.runTransaction(async (tx) => {
      const [matchSnap, msgSnap, meSnap] = await Promise.all([tx.get(matchRef), tx.get(msgRef), tx.get(meRef)]);

      if (!matchSnap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }
      if (!msgSnap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }

      const match = matchSnap.data() || {};
      const status = String(match.status || '');
      if (!['mutual_accepted', 'proposed', 'mutual_interest', 'contact_unlocked'].includes(status)) {
        const err = new Error('chat_not_available');
        err.statusCode = 400;
        throw err;
      }

      if (status === 'mutual_accepted') {
        const currentMode = typeof match?.interactionMode === 'string' ? match.interactionMode : '';
        if (currentMode !== 'chat') {
          // Backward-compat: eski match'lerde interactionMode boş kalmış olabilir.
          if (!currentMode) {
            tx.set(
              matchRef,
              {
                interactionMode: 'chat',
                interactionChosenAt: FieldValue.serverTimestamp(),
                chatEnabledAt: FieldValue.serverTimestamp(),
                chatEnabledAtMs: ts,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          } else {
            const err = new Error('chat_not_enabled');
            err.statusCode = 400;
            throw err;
          }
        }
      }

      if (status === 'proposed') {
        const reachedAtMs =
          typeof match?.proposedChatLimitReachedAtMs === 'number' && Number.isFinite(match.proposedChatLimitReachedAtMs)
            ? match.proposedChatLimitReachedAtMs
            : 0;
        if (reachedAtMs > 0) {
          const err = new Error('chat_limit_reached');
          err.statusCode = 409;
          throw err;
        }
      }

      const userIds = Array.isArray(match.userIds) ? match.userIds.map(String).filter(Boolean) : [];
      if (userIds.length !== 2 || !userIds.includes(uid)) {
        const err = new Error('forbidden');
        err.statusCode = 403;
        throw err;
      }

      sponsorUid = userIds.find((x) => x && x !== uid) || '';
      const sponsorRef = sponsorUid ? db.collection('matchmakingUsers').doc(sponsorUid) : null;
      const sponsorSnap = sponsorRef ? await tx.get(sponsorRef) : null;
      const sponsor = sponsorSnap?.exists ? (sponsorSnap.data() || {}) : {};

      const revoke = isSponsoredTranslationRevoked(match, uid);

      const me = meSnap.exists ? (meSnap.data() || {}) : {};

      // Hibrit çeviri politikası:
      // - Herkesin bir “self” günlük mesaj çeviri limiti vardır.
      // - Free/Eko kullanıcı: karşı taraf Standard/Pro ise sponsorlu (maliyet sponsor) olabilir.
      // - Sponsor kapatıldıysa self’e düşer (iletişim kopmaz).
      const computed = computeTranslationBilling({
        requesterUid: uid,
        requesterDoc: me,
        otherUid: sponsorUid,
        otherDoc: sponsor,
        matchDoc: match,
        now: ts,
      });

      // Direkt mesaj (proposed) aşamasında: herkes kendi çeviri kotasından kullanır.
      // Mutual accepted sonrası: hibrit politika geçerli olabilir.
      if (status === 'proposed') {
        billing = { mode: 'self', uid, monthlyLimit: computed.selfMonthlyLimit };
      } else if (computed.mode === 'sponsored' && revoke.revoked) {
        // Revoked ise: sponsorlu akış devre dışı; self’e düş.
        billing = { mode: 'self', uid, monthlyLimit: computed.selfMonthlyLimit };
      } else {
        billing = { mode: computed.mode, uid: computed.billingUid, monthlyLimit: computed.monthlyLimit };
      }

      // Kota bilgisi (UI için): mevcut kullanım ve limit
      {
        const billingUidNow = String(billing?.uid || uid);
        const monthlyLimitNow = billing?.monthlyLimit;
        const billingUser = billingUidNow === sponsorUid && sponsorUid ? sponsor : me;
        const usage = getUsageForMonth(billingUser, mKey);
        usageUsedCount = usage.count;
        usageMonthlyLimit = monthlyLimitNow;
        usagePercent = toUsagePercent(usageUsedCount, usageMonthlyLimit);
        usageBillingMode = String(billing?.mode || '');
      }

      const msg = msgSnap.data() || {};
      const senderUid = safeStr(msg?.userId);
      if (senderUid && senderUid === uid) {
        // Sadece karşı taraftan gelen mesajlar çevrilebilir.
        const err = new Error('only_incoming');
        err.statusCode = 400;
        throw err;
      }

      const text = safeStr(msg?.text);
      if (!text) {
        const err = new Error('bad_request');
        err.statusCode = 400;
        throw err;
      }

      if (text.length > MAX_TRANSLATE_TEXT_LEN) {
        const err = new Error('translate_too_long');
        err.statusCode = 413;
        throw err;
      }

      // Not: Mesaj başına ayrı limit yok; kullanım hesap geneli aylık havuzdan düşer.

      const existing = msg?.translations && typeof msg.translations === 'object' ? safeStr(msg.translations[targetLang]) : '';
      if (existing) {
        translated = existing;
        return;
      }

      // Not: revoke artık “sponsorlu çeviriyi kapat” olarak yorumlanır.
      // Self kotası ile çeviri devam edebilir; iletişim kopmasın.

      // Transaction içinde dış istek yapmamak için: translate'i transaction dışında yapacağız.
      // Burada sadece ön kontrol yapıp, çeviriyi dışarıda yapacağız.
    });

    // Eğer transaction içinde erken döndüysek translated dolu olur.
    if (!translated) {
      // Mesajı tekrar oku (tx dışı)
      const msgSnap = await msgRef.get();
      if (!msgSnap.exists) {
        res.statusCode = 404;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'not_found' }));
        return;
      }
      const msg = msgSnap.data() || {};
      const senderUid = safeStr(msg?.userId);
      if (senderUid && senderUid === uid) {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'only_incoming' }));
        return;
      }

      const text = safeStr(msg?.text);
      if (!text) {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
        return;
      }

      if (text.length > MAX_TRANSLATE_TEXT_LEN) {
        res.statusCode = 413;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'translate_too_long' }));
        return;
      }

      // Kütüphane çevirisi (hazır/sık sorulan sorular): Gemini/harici çeviri çağırma.
      // Not: Bu akış kota tüketmez; sadece mesaj dokümanına çeviri snapshot'ı yazar.
      const readyTranslated = await tryTranslateFromReadyLibrary({ text, targetLang });
      if (readyTranslated) {
        translated = readyTranslated;
        try {
          await msgRef.set(
            {
              translations: {
                ...(msg?.translations && typeof msg.translations === 'object' ? msg.translations : {}),
                [targetLang]: translated,
              },
              translationsUpdatedAtMs: ts,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        } catch {
          // best-effort; translation can still be returned to client
        }
      }

      if (translated) {
        // Kütüphane çevirisi ile tamamlandı.
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            ok: true,
            targetLang,
            text: translated,
            usage: {
              usedCount: usageUsedCount,
              monthlyLimit: usageMonthlyLimit,
              dailyLimit: usageMonthlyLimit,
              usagePercent,
              billingMode: usageBillingMode,
            },
          })
        );
        return;
      }

      const hasGeminiKey = !!String(process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || '').trim();
      const primaryProvider = hasGeminiKey ? 'gemini' : String(process.env.TRANSLATE_PROVIDER || '').toLowerCase();
      const fallbackProvider = String(process.env.TRANSLATE_PROVIDER || '').toLowerCase();

      // Gemini free-tier RPM guard + admin alert (best-effort).
      // If RPM is exceeded, we transparently fall back to configured provider (e.g., DeepL).
      if (primaryProvider === 'gemini') {
        try {
          await checkAndRecordGeminiTranslateRpm({
            limitPerMinute: 15,
            context: {
              route: 'matchmaking-chat-translate',
              uid,
              matchId,
              messageId,
              targetLang,
            },
          });
        } catch (e) {
          if (String(e?.message || '') !== 'translate_rate_limited') throw e;

          // Fallback to DeepL/LibreTranslate/Google if configured.
          if (fallbackProvider && fallbackProvider !== 'gemini') {
            translated = await translateText({ text, targetLang, provider: fallbackProvider });
          } else {
            throw e;
          }
        }
      }

      if (!translated) {
        try {
          translated = await translateText({ text, targetLang, provider: primaryProvider });
        } catch (e) {
          const code = String(e?.message || '');
          // Optional resiliency: if Gemini fails for transient reasons, try fallback provider.
          if (primaryProvider === 'gemini' && fallbackProvider && fallbackProvider !== 'gemini' && code === 'translate_failed') {
            translated = await translateText({ text, targetLang, provider: fallbackProvider });
          } else {
            throw e;
          }
        }
      }

      await db.runTransaction(async (tx) => {
        const sponsorRef = sponsorUid ? db.collection('matchmakingUsers').doc(sponsorUid) : null;
        const reads = [tx.get(msgRef), tx.get(matchRef)];
        if (sponsorRef) reads.push(tx.get(sponsorRef));
        reads.push(tx.get(meRef));

        const all = await Promise.all(reads);
        const msgSnap2 = all[0];
        const matchSnap2 = all[1];
        const sponsorSnap2 = sponsorRef ? all[2] : null;
        const meSnap2 = sponsorRef ? all[3] : all[2];
        if (!msgSnap2.exists) return;

        const match = matchSnap2.exists ? (matchSnap2.data() || {}) : {};
        const revoke = isSponsoredTranslationRevoked(match, uid);

        const me = meSnap2.exists ? (meSnap2.data() || {}) : {};
        const sponsor = sponsorSnap2?.exists ? (sponsorSnap2.data() || {}) : {};

        const userIds = Array.isArray(match.userIds) ? match.userIds.map(String).filter(Boolean) : [];
        if (userIds.length !== 2 || !userIds.includes(uid)) {
          const err = new Error('forbidden');
          err.statusCode = 403;
          throw err;
        }

        // Erişim + faturalama tekrar hesapla (yarış durumlarına karşı).
        const computed = computeTranslationBilling({
          requesterUid: uid,
          requesterDoc: me,
          otherUid: sponsorUid,
          otherDoc: sponsor,
          matchDoc: match,
          now: ts,
        });

        const status2 = String(match?.status || '');
        const effectiveBilling =
          status2 === 'proposed'
            ? { mode: 'self', billingUid: uid, monthlyLimit: computed.selfMonthlyLimit }
            : (computed.mode === 'sponsored' && revoke.revoked
                ? { mode: 'self', billingUid: uid, monthlyLimit: computed.selfMonthlyLimit }
                : computed);

        const cur = msgSnap2.data() || {};
        const existing = cur?.translations && typeof cur.translations === 'object' ? safeStr(cur.translations[targetLang]) : '';
        if (existing) {
          translated = existing;
          return;
        }

        const billingUidNow = String(effectiveBilling.billingUid || uid);
        const billingRef = billingUidNow === sponsorUid && sponsorUid ? db.collection('matchmakingUsers').doc(sponsorUid) : meRef;
        const billingUser = billingUidNow === sponsorUid ? sponsor : me;

        const monthlyLimit = effectiveBilling.monthlyLimit;
        if (!(monthlyLimit > 0) && monthlyLimit !== Infinity) {
          const err = new Error('translation_not_allowed');
          err.statusCode = 402;
          throw err;
        }

        const usage = getUsageForMonth(billingUser, mKey);
        const nextCount = usage.count + 1;
        if (monthlyLimit !== Infinity && nextCount > monthlyLimit) {
          const err = new Error('translate_quota_exceeded');
          err.statusCode = 429;
          err.details = {
            usedCount: usage.count,
            monthlyLimit,
            usagePercent: toUsagePercent(usage.count, monthlyLimit),
            billingMode: String(effectiveBilling?.mode || ''),
          };
          throw err;
        }

        usageUsedCount = nextCount;
        usageMonthlyLimit = monthlyLimit;
        usagePercent = toUsagePercent(nextCount, monthlyLimit);
        usageBillingMode = String(effectiveBilling?.mode || '');

        const nextUsageMonthly = {
          ...(billingUser.translationUsageMonthly && typeof billingUser.translationUsageMonthly === 'object'
            ? billingUser.translationUsageMonthly
            : {}),
          [mKey]: {
            count: nextCount,
            updatedAtMs: ts,
          },
        };

        tx.set(
          msgRef,
          {
            translations: {
              ...(cur.translations || {}),
              [targetLang]: translated,
            },
            translationsUpdatedAtMs: ts,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        if (billingRef) {
          tx.set(
            billingRef,
            {
              translationUsageMonthly: nextUsageMonthly,
              translationUsageMonthlyUpdatedAtMs: ts,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
      });
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        targetLang,
        text: translated,
        usage: {
          usedCount: usageUsedCount,
          monthlyLimit: usageMonthlyLimit,
          // Backward-compat: eski client’lar için
          dailyLimit: usageMonthlyLimit,
          usagePercent,
          billingMode: usageBillingMode,
        },
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    const details = e?.details && typeof e.details === 'object' ? e.details : undefined;
    res.end(
      JSON.stringify({
        ok: false,
        error: String(e?.message || 'server_error'),
        ...(details ? { details } : {}),
      })
    );
  }
}
