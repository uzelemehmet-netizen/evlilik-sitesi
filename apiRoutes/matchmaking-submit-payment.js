import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeCurrency(v) {
  const c = safeStr(v).toUpperCase();
  if (c === 'TRY' || c === 'IDR' || c === 'USD') return c;
  return '';
}

function safeMethod(v) {
  const m = safeStr(v);
  const allowed = new Set(['eft_fast', 'swift_wise', 'qris', 'other', 'card']);
  return allowed.has(m) ? m : '';
}

function safeTier(v) {
  const t = safeStr(v).toLowerCase();
  const allowed = new Set(['eco', 'standard', 'pro']);
  return allowed.has(t) ? t : '';
}

function safeUrl(v) {
  const s = safeStr(v);
  if (!s) return '';
  if (s.length > 800) return '';
  if (!/^https:\/\//i.test(s)) return '';
  return s;
}

function safeReceiptVia(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'upload' || s === 'whatsapp') return s;
  return '';
}

function safeContext(v) {
  const s = safeStr(v);
  if (!s) return '';
  if (s.length > 40) return '';
  return s;
}

function readPositiveNumber(raw, fallback) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function expectedAmountFor(currency, tier) {
  // Backward compatible: eski env'ler (MATCHMAKING_PRICE_TRY/IDR) hala geçerli.
  // Yeni: tier bazlı env'ler (MATCHMAKING_PRICE_TRY_ECO/STANDARD/PRO).
  if (currency === 'TRY') {
    const base = readPositiveNumber(process.env.MATCHMAKING_PRICE_TRY, 750);
    if (tier === 'eco') return readPositiveNumber(process.env.MATCHMAKING_PRICE_TRY_ECO, base);
    if (tier === 'standard') return readPositiveNumber(process.env.MATCHMAKING_PRICE_TRY_STANDARD, base);
    if (tier === 'pro') return readPositiveNumber(process.env.MATCHMAKING_PRICE_TRY_PRO, base);
    return base;
  }
  if (currency === 'IDR') {
    const base = readPositiveNumber(process.env.MATCHMAKING_PRICE_IDR, 250000);
    if (tier === 'eco') return readPositiveNumber(process.env.MATCHMAKING_PRICE_IDR_ECO, base);
    if (tier === 'standard') return readPositiveNumber(process.env.MATCHMAKING_PRICE_IDR_STANDARD, base);
    if (tier === 'pro') return readPositiveNumber(process.env.MATCHMAKING_PRICE_IDR_PRO, base);
    return base;
  }
  if (currency === 'USD') {
    // Varsayılan USD fiyatları (aylık): eco=20, standard=40, pro=50
    const base = readPositiveNumber(process.env.MATCHMAKING_PRICE_USD, 50);
    if (tier === 'eco') return readPositiveNumber(process.env.MATCHMAKING_PRICE_USD_ECO, 20);
    if (tier === 'standard') return readPositiveNumber(process.env.MATCHMAKING_PRICE_USD_STANDARD, 40);
    if (tier === 'pro') return readPositiveNumber(process.env.MATCHMAKING_PRICE_USD_PRO, 50);
    return base;
  }
  return 0;
}

function nowMs() {
  return Date.now();
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
    const method = safeMethod(body?.method); // eft_fast | swift_wise | qris | other
    const amount = typeof body?.amount === 'number' && Number.isFinite(body.amount) ? body.amount : null;
    const currency = safeCurrency(body?.currency); // TRY | IDR | USD
    const tier = safeTier(body?.tier) || 'pro'; // eco | standard | pro
    const reference = safeStr(body?.reference);
    const note = safeStr(body?.note);
    const receiptUrl = safeUrl(body?.receiptUrl);
    const receiptVia = safeReceiptVia(body?.receiptVia) || (receiptUrl ? 'upload' : '');
    const context = safeContext(body?.context);

    if (!method || !amount || !currency) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    if (!receiptVia) {
      // upload veya whatsapp belirtmeden dekontsuz bildirim kabul etmeyelim.
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const expectedAmount = expectedAmountFor(currency, tier);
    const amountMatches = expectedAmount ? amount === expectedAmount : true;

    const { db, FieldValue } = getAdmin();

    // matchId verildiyse doğrula; yoksa üyelik aktivasyonu gibi match-dışı ödeme bildirimi kabul et.
    if (matchId) {
      const matchRef = db.collection('matchmakingMatches').doc(matchId);
      const matchSnap = await matchRef.get();
      if (!matchSnap.exists) {
        res.statusCode = 404;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'match_not_found' }));
        return;
      }

      const match = matchSnap.data() || {};
      const userIds = Array.isArray(match.userIds) ? match.userIds.map(String) : [];
      if (!userIds.includes(uid)) {
        res.statusCode = 403;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'forbidden' }));
        return;
      }
    }

    // Not: Artık kullanıcılar arası WhatsApp teyidi yok.
    // Ödeme (üyelik aktivasyonu) bildirimini, match üzerinden referansla ama status'e bağlama.

    // Basit rate-limit: aynı kullanıcı 60sn içinde 2 kez bildirmesin.
    const userRef = db.collection('matchmakingUsers').doc(uid);
    const userSnap = await userRef.get();
    const lastAt = userSnap.exists ? (userSnap.data() || {}).lastPaymentSubmittedAtMs : null;
    if (typeof lastAt === 'number' && nowMs() - lastAt < 60_000) {
      res.statusCode = 429;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'rate_limited' }));
      return;
    }

    const paymentRef = db.collection('matchmakingPayments').doc();

    const userDoc = userSnap.exists ? (userSnap.data() || {}) : {};
    const displayName =
      safeStr(decoded?.name) ||
      safeStr(userDoc?.fullName) ||
      safeStr(userDoc?.displayName) ||
      safeStr(userDoc?.name) ||
      '';

    await paymentRef.set({
      userId: uid,
      userDisplayName: displayName || null,
      matchId: matchId || null,
      method,
      amount,
      currency,
      tier,
      reference,
      note,
      receiptUrl: receiptUrl || null,
      receiptVia,
      expectedAmount,
      amountMatches,
      context: context || null,
      plan: 'monthly',
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await userRef.set(
      {
        lastPaymentSubmittedAtMs: nowMs(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, paymentId: paymentRef.id }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
