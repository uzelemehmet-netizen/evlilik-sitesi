import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function asBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  const s = String(v ?? '').trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'off', ''].includes(s)) return false;
  return null;
}

async function commitBatches(db, docs, buildWrite) {
  const chunks = [];
  const size = 450; // güvenli limit (500'ün altında)
  for (let i = 0; i < docs.length; i += size) chunks.push(docs.slice(i, i + size));

  for (const chunk of chunks) {
    const batch = db.batch();
    for (const d of chunk) buildWrite(batch, d);
    await batch.commit();
  }
}

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const decoded = await requireIdToken(req);
  const uid = String(decoded?.uid || '').trim();
  if (!uid) {
    res.statusCode = 401;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'unauthenticated' }));
    return;
  }

  const body = normalizeBody(req);
  const blur = asBool(body?.blur);
  if (blur === null) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'invalid_blur' }));
    return;
  }

  const { db, FieldValue } = getAdmin();
  const nowMs = Date.now();

  // Kullanıcının privacy tercihini yaz
  const userRef = db.collection('matchmakingUsers').doc(uid);
  await userRef.set(
    {
      photosBlurred: blur,
      publicProfile: {
        photosBlurred: blur,
      },
      updatedAt: FieldValue.serverTimestamp(),
      updatedAtMs: nowMs,
    },
    { merge: true }
  );

  // Bu kullanıcı ile ilgili tüm match dokümanlarına da yansıt (UI match dokümanından okuyor)
  const matchSnap = await db
    .collection('matchmakingMatches')
    .where('userIds', 'array-contains', uid)
    .limit(400)
    .get();

  const matchDocs = matchSnap.docs || [];
  await commitBatches(db, matchDocs, (batch, d) => {
    const ref = db.collection('matchmakingMatches').doc(d.id);
    batch.set(
      ref,
      {
        photoBlurByUid: {
          [uid]: blur,
        },
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: nowMs,
      },
      { merge: true }
    );
  });

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, blur, updatedMatches: matchDocs.length }));
}
