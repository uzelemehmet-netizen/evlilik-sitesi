import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const admin = await requireAdmin(req);

    const body = normalizeBody(req);
    const matchId = String(body?.matchId || '').trim();
    const reason = String(body?.reason || 'cancelled_after_contact').trim();

    if (!matchId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const ref = db.collection('matchmakingMatches').doc(matchId);
    const snap = await ref.get();

    if (!snap.exists) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'not_found' }));
      return;
    }

    const data = snap.data() || {};
    const aUserId = String(data?.aUserId || '');
    const bUserId = String(data?.bUserId || '');

    await ref.set(
      {
        status: 'cancelled',
        cancelledAt: FieldValue.serverTimestamp(),
        cancelledByAdminId: admin.uid,
        cancelledReason: reason,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // İptal sonrası kilitleri kaldır ki kullanıcılar yeni eşleşme görebilsin.
    const batch = db.batch();
    if (aUserId) {
      batch.set(
        db.collection('matchmakingUsers').doc(aUserId),
        { matchmakingLock: { active: false, matchId }, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
    if (bUserId) {
      batch.set(
        db.collection('matchmakingUsers').doc(bUserId),
        { matchmakingLock: { active: false, matchId }, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
    if (aUserId || bUserId) await batch.commit();

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
