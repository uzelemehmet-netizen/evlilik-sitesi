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

function asNum(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
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

  const LOCK_MS = 48 * 60 * 60 * 1000;

  const userRef = db.collection('matchmakingUsers').doc(uid);

  // 48 saat kuralını enforce etmek için önce mevcut state'i okuyup transaction içinde yaz.
  let changed = false;
  let effectiveBlur = blur;
  let cooldownMinutesLeft = 0;
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const data = snap.exists ? snap.data() || {} : {};
      const current = !!data?.photosBlurred;

      if (current === blur) {
        effectiveBlur = current;
        changed = false;
        return;
      }

      const firstEnabledAtMs = asNum(data?.photosBlurredFirstEnabledAtMs) || 0;
      const lastDisabledAtMs = asNum(data?.photosBlurredLastDisabledAtMs) || 0;

      // Kural 1: İlk kez blur yaptıktan sonra 48 saat boyunca yeniden görünür yapamaz.
      if (current === true && blur === false && firstEnabledAtMs > 0) {
        const remaining = firstEnabledAtMs + LOCK_MS - nowMs;
        if (remaining > 0) {
          cooldownMinutesLeft = Math.max(1, Math.ceil(remaining / 60000));
          const err = new Error(`photo_privacy_cooldown_${cooldownMinutesLeft}m`);
          err.statusCode = 409;
          throw err;
        }
      }

      // Kural 2: Görünürlüğü açtıktan sonra 48 saat boyunca tekrar kapatamaz.
      // (yani blur:false -> blur:true geçişini kilitler)
      if (current === false && blur === true && lastDisabledAtMs > 0) {
        const remaining = lastDisabledAtMs + LOCK_MS - nowMs;
        if (remaining > 0) {
          cooldownMinutesLeft = Math.max(1, Math.ceil(remaining / 60000));
          const err = new Error(`photo_privacy_cooldown_${cooldownMinutesLeft}m`);
          err.statusCode = 409;
          throw err;
        }
      }

      const patch = {
        photosBlurred: blur,
        publicProfile: {
          ...(data?.publicProfile && typeof data.publicProfile === 'object' ? data.publicProfile : {}),
          photosBlurred: blur,
        },
        photosBlurredLastChangedAtMs: nowMs,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: nowMs,
      };

      if (blur === true) {
        patch.photosBlurredLastEnabledAtMs = nowMs;
        if (!firstEnabledAtMs) patch.photosBlurredFirstEnabledAtMs = nowMs;
      } else {
        patch.photosBlurredLastDisabledAtMs = nowMs;
      }

      tx.set(userRef, patch, { merge: true });
      changed = true;
      effectiveBlur = blur;
    });
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
    return;
  }

  // Bu kullanıcı ile ilgili tüm match dokümanlarına da yansıt (UI match dokümanından okuyor)
  let updatedMatches = 0;
  if (changed) {
    const matchSnap = await db
      .collection('matchmakingMatches')
      .where('userIds', 'array-contains', uid)
      .limit(400)
      .get();

    const matchDocs = matchSnap.docs || [];
    updatedMatches = matchDocs.length;
    await commitBatches(db, matchDocs, (batch, d) => {
      const ref = db.collection('matchmakingMatches').doc(d.id);
      batch.set(
        ref,
        {
          photoBlurByUid: {
            [uid]: effectiveBlur,
          },
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: nowMs,
        },
        { merge: true }
      );
    });
  }

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, blur: effectiveBlur, changed, updatedMatches, cooldownMinutesLeft }));
}
