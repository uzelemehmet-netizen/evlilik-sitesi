import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { sendPushToUid } from './_push.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : String(v ?? '').trim();
}

function asBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  const s = String(v ?? '').trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'off', ''].includes(s)) return false;
  return null;
}

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const decoded = await requireIdToken(req);
  const uid = safeStr(decoded?.uid);
  if (!uid) {
    res.statusCode = 401;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'unauthenticated' }));
    return;
  }

  const body = normalizeBody(req);
  const matchId = safeStr(body?.matchId);
  const allow = asBool(body?.allow);

  if (!matchId || allow === null) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'invalid_request' }));
    return;
  }

  const { db, FieldValue } = getAdmin();
  const matchRef = db.collection('matchmakingMatches').doc(matchId);
  const snap = await matchRef.get();

  if (!snap.exists) {
    res.statusCode = 404;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'match_not_found' }));
    return;
  }

  const match = snap.data() || {};
  const aId = safeStr(match?.aUserId);
  const bId = safeStr(match?.bUserId);

  if (uid !== aId && uid !== bId) {
    res.statusCode = 403;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'not_participant' }));
    return;
  }

  const nowMs = Date.now();

  // aToB: A'nın fotoğrafları B'ye açık mı?
  // bToA: B'nin fotoğrafları A'ya açık mı?
  const photoAccessPatch = {};
  if (uid === aId && bId) photoAccessPatch.aToB = allow;
  if (uid === bId && aId) photoAccessPatch.bToA = allow;

  await matchRef.set(
    {
      photoAccess: photoAccessPatch,
      updatedAt: FieldValue.serverTimestamp(),
      updatedAtMs: nowMs,
    },
    { merge: true }
  );

  // allow=true => karşı tarafa bilgilendirme (best-effort)
  if (allow === true) {
    const otherUid = uid === aId ? bId : uid === bId ? aId : '';
    if (otherUid) {
      await sendPushToUid({
        uid: otherUid,
        title: 'Fotoğraflar açıldı',
        body: 'Karşı taraf fotoğraflarını sizin için açtı.',
        url: matchId ? `/app/match/${matchId}` : '/app/matches',
        type: 'photo_access_granted',
        data: { matchId, fromUid: uid },
      }).catch(() => null);
    }
  }

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, matchId, allow }));
}
