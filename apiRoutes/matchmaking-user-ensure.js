import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { normalizeGender } from './_matchmakingEligibility.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeAge(v) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  if (n < 18 || n > 99) return null;
  return n;
}

function normalizeLookingForGender(v) {
  return normalizeGender(v);
}

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireIdToken(req);
    const uid = safeStr(decoded?.uid);
    if (!uid) {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'unauthenticated' }));
      return;
    }

    const body = normalizeBody(req);
    const age = normalizeAge(body?.age);
    const gender = normalizeGender(body?.gender);
    const lookingForGender = normalizeLookingForGender(body?.lookingForGender);

    const { db, FieldValue } = getAdmin();

    const ref = db.collection('matchmakingUsers').doc(uid);

    let ensured = false;
    let created = false;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() || {} : {};
      const existingAge = typeof data?.age === 'number' && Number.isFinite(data.age) ? data.age : null;

      const existingGender = normalizeGender(data?.gender);
      const existingLookingFor = normalizeLookingForGender(data?.lookingForGender);

      const patch = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (existingAge === null && typeof age === 'number') patch.age = age;
      if (!existingGender && gender) patch.gender = gender;
      if (!existingLookingFor && lookingForGender) patch.lookingForGender = lookingForGender;

      const willCreate = !snap.exists;
      if (willCreate) {
        patch.createdAt = FieldValue.serverTimestamp();
      }

      // Eğer hiçbir alan güncellenmeyecekse ve doküman zaten varsa write yapma.
      const hasMeaningfulPatch =
        Object.prototype.hasOwnProperty.call(patch, 'age') ||
        Object.prototype.hasOwnProperty.call(patch, 'gender') ||
        Object.prototype.hasOwnProperty.call(patch, 'lookingForGender') ||
        willCreate;

      if (!hasMeaningfulPatch) {
        ensured = true;
        created = false;
        return;
      }

      tx.set(ref, patch, { merge: true });
      ensured = true;
      created = willCreate;
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ ok: true, ensured, created }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
