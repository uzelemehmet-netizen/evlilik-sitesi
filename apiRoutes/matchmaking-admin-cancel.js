import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { buildCancelBehaviourPatch } from './_cancelBehaviour.js';

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
    const prevStatus = String(data?.status || '');

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
    const shouldCountAsContactCancel = prevStatus === 'contact_unlocked';
    const nowMs = Date.now();

    // Opsiyonel: admin hangi kullanıcı iptal ettiyse sadece onu say.
    const blamedUserId = typeof body?.cancelledByUserId === 'string' ? body.cancelledByUserId.trim() : '';
    const countUserIds = shouldCountAsContactCancel
      ? [blamedUserId || aUserId, blamedUserId ? '' : bUserId].filter(Boolean)
      : [];

    if (aUserId) {
      let patch = { matchmakingLock: { active: false, matchId }, updatedAt: FieldValue.serverTimestamp() };
      if (shouldCountAsContactCancel && countUserIds.includes(aUserId)) {
        // user doc okunamıyorsa (yoksa) boş kabul edip yine de alanları set etmekte sakınca yok.
        const aSnap = await db.collection('matchmakingUsers').doc(aUserId).get();
        const aDoc = aSnap.exists ? (aSnap.data() || {}) : {};
        const { patch: cancelPatch } = buildCancelBehaviourPatch(aDoc, [nowMs], nowMs, FieldValue);
        patch = { ...patch, ...cancelPatch };
      }
      batch.set(
        db.collection('matchmakingUsers').doc(aUserId),
        patch,
        { merge: true }
      );
    }
    if (bUserId) {
      let patch = { matchmakingLock: { active: false, matchId }, updatedAt: FieldValue.serverTimestamp() };
      if (shouldCountAsContactCancel && countUserIds.includes(bUserId)) {
        const bSnap = await db.collection('matchmakingUsers').doc(bUserId).get();
        const bDoc = bSnap.exists ? (bSnap.data() || {}) : {};
        const { patch: cancelPatch } = buildCancelBehaviourPatch(bDoc, [nowMs], nowMs, FieldValue);
        patch = { ...patch, ...cancelPatch };
      }
      batch.set(
        db.collection('matchmakingUsers').doc(bUserId),
        patch,
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
