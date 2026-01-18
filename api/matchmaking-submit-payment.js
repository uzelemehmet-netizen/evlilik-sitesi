import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeCurrency(v) {
  const c = safeStr(v).toUpperCase();
  if (c === 'TRY' || c === 'IDR') return c;
  return '';
}

function safeMethod(v) {
  const m = safeStr(v);
  const allowed = new Set(['eft_fast', 'swift_wise', 'qris', 'other']);
  return allowed.has(m) ? m : '';
}

function safeUrl(v) {
  const s = safeStr(v);
  if (!s) return '';
  if (s.length > 800) return '';
  if (!/^https:\/\//i.test(s)) return '';
  return s;
}

function expectedAmountFor(currency) {
  if (currency === 'TRY') {
    const n = Number(process.env.MATCHMAKING_PRICE_TRY || 750);
    return Number.isFinite(n) && n > 0 ? n : 750;
  }
  if (currency === 'IDR') {
    const n = Number(process.env.MATCHMAKING_PRICE_IDR || 250000);
    return Number.isFinite(n) && n > 0 ? n : 250000;
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
    const currency = safeCurrency(body?.currency); // TRY | IDR
    const reference = safeStr(body?.reference);
    const note = safeStr(body?.note);
    const receiptUrl = safeUrl(body?.receiptUrl);

    if (!matchId || !method || !amount || !currency) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const expectedAmount = expectedAmountFor(currency);
    const amountMatches = expectedAmount ? amount === expectedAmount : true;

    const { db, FieldValue } = getAdmin();

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

    await paymentRef.set({
      userId: uid,
      matchId,
      method,
      amount,
      currency,
      reference,
      note,
      receiptUrl: receiptUrl || null,
      expectedAmount,
      amountMatches,
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
