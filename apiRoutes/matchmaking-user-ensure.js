import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { normalizeGender, resolveLookingForGender } from './_matchmakingEligibility.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeLower(v) {
  return safeStr(v).toLowerCase();
}

function normalizeAge(v) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  if (n < 18 || n > 99) return null;
  return n;
}

function normalizeLookingForGender(v, gender) {
  return resolveLookingForGender(gender, v);
}

function hasDeletedMarker(data) {
  const doc = data && typeof data === 'object' ? data : null;
  if (!doc) return false;
  if (typeof doc?.deletedAtMs === 'number' && Number.isFinite(doc.deletedAtMs) && doc.deletedAtMs > 0) return true;
  return !!doc?.deletedAt;
}

function hasMeaningfulUserSignals(data) {
  const doc = data && typeof data === 'object' ? data : null;
  if (!doc) return false;
  if (safeStr(doc?.userCode) || safeStr(doc?.fullName) || safeStr(doc?.applicationId)) return true;
  if (doc?.application && typeof doc.application === 'object' && Object.keys(doc.application).length > 0) return true;
  if (doc?.publicProfile && typeof doc.publicProfile === 'object' && Object.keys(doc.publicProfile).length > 0) return true;
  if (doc?.details && typeof doc.details === 'object' && Object.keys(doc.details).length > 0) return true;
  return false;
}

function scoreRecoveryCandidate(data) {
  const doc = data && typeof data === 'object' ? data : null;
  if (!doc) return 0;

  let score = 0;
  if (hasMeaningfulUserSignals(doc)) score += 100;
  if (safeStr(doc?.applicationId)) score += 40;
  if (safeStr(doc?.fullName)) score += 20;
  if (safeStr(doc?.userCode)) score += 20;
  if (safeStr(doc?.whatsapp)) score += 10;
  if (typeof doc?.updatedAtMs === 'number' && Number.isFinite(doc.updatedAtMs)) score += Math.min(9, Math.floor(doc.updatedAtMs / 1e12));
  return score;
}

async function findLegacyUserByEmail(db, currentUid, authEmail) {
  const email = safeLower(authEmail);
  if (!email) return null;

  const fields = ['authEmailLower', 'emailLower', 'authEmail', 'email'];
  const candidates = new Map();

  for (const field of fields) {
    try {
      const snap = await db.collection('matchmakingUsers').where(field, '==', email).limit(5).get();
      for (const doc of snap.docs || []) {
        const uid = safeStr(doc?.id);
        if (!uid || uid === currentUid) continue;
        const userDoc = doc.data() || {};
        if (hasDeletedMarker(userDoc)) continue;
        const prev = candidates.get(uid);
        const score = scoreRecoveryCandidate(userDoc);
        if (!prev || score > prev.score) {
          candidates.set(uid, { uid, userDoc, score });
        }
      }
    } catch {
      // ignore
    }
  }

  const list = Array.from(candidates.values()).sort((a, b) => b.score - a.score);
  return list[0] || null;
}

async function loadLegacyApplications(db, legacyUid, applicationIdHint = '') {
  const uid = safeStr(legacyUid);
  if (!uid) return [];

  const fields = ['userId', 'uid', 'userUid', 'ownerUid'];
  const appMap = new Map();

  for (const field of fields) {
    try {
      const snap = await db.collection('matchmakingApplications').where(field, '==', uid).limit(25).get();
      for (const doc of snap.docs || []) {
        if (!doc?.id || appMap.has(doc.id)) continue;
        appMap.set(doc.id, { id: doc.id, ...(doc.data() || {}) });
      }
    } catch {
      // ignore
    }
  }

  const hintedId = safeStr(applicationIdHint);
  if (hintedId && !appMap.has(hintedId)) {
    try {
      const snap = await db.collection('matchmakingApplications').doc(hintedId).get();
      if (snap.exists) appMap.set(snap.id, { id: snap.id, ...(snap.data() || {}) });
    } catch {
      // ignore
    }
  }

  return Array.from(appMap.values());
}

async function recoverLegacyUserByEmail({ db, FieldValue, uid, authEmail, displayName, authProvider, age, gender, lookingForGender }) {
  const currentUid = safeStr(uid);
  const normalizedEmail = safeLower(authEmail);
  if (!currentUid || !normalizedEmail) return { recovered: false, reason: 'missing_email' };

  const currentRef = db.collection('matchmakingUsers').doc(currentUid);
  const currentSnap = await currentRef.get();
  const currentDoc = currentSnap.exists ? (currentSnap.data() || {}) : {};

  if (hasDeletedMarker(currentDoc)) return { recovered: false, reason: 'current_deleted' };
  if (currentSnap.exists && hasMeaningfulUserSignals(currentDoc)) {
    return { recovered: false, reason: 'current_exists' };
  }

  const legacy = await findLegacyUserByEmail(db, currentUid, normalizedEmail);
  if (!legacy?.uid || !legacy?.userDoc) return { recovered: false, reason: 'legacy_not_found' };

  const legacyUid = safeStr(legacy.uid);
  if (!legacyUid || legacyUid === currentUid) return { recovered: false, reason: 'legacy_same_uid' };

  const legacyUserDoc = legacy.userDoc || {};
  if (hasDeletedMarker(legacyUserDoc)) return { recovered: false, reason: 'legacy_deleted' };

  const legacyApps = await loadLegacyApplications(db, legacyUid, legacyUserDoc?.applicationId);
  const legacyFlagRef = db.collection('adminUserFlags').doc(legacyUid);
  const legacyFlagSnap = await legacyFlagRef.get().catch(() => null);

  const nowMs = Date.now();
  const now = FieldValue.serverTimestamp();
  const nextUserDoc = {
    ...legacyUserDoc,
    ...(safeStr(legacyUserDoc?.applicationId) || !legacyApps[0]?.id ? {} : { applicationId: safeStr(legacyApps[0]?.id) }),
    ...(typeof normalizeAge(legacyUserDoc?.age) === 'number' || typeof age !== 'number' ? {} : { age }),
    ...(normalizeGender(legacyUserDoc?.gender) || !gender ? {} : { gender }),
    ...(
      normalizeLookingForGender(legacyUserDoc?.lookingForGender, normalizeGender(legacyUserDoc?.gender) || gender) || !lookingForGender
        ? {}
        : { lookingForGender }
    ),
    ...(normalizedEmail ? { authEmail: normalizedEmail, authEmailLower: normalizedEmail } : {}),
    ...(displayName ? { displayName } : {}),
    ...(authProvider ? { authProvider } : {}),
    recoveredFromUid: legacyUid,
    authRecoveredAt: now,
    authRecoveredAtMs: nowMs,
    updatedAt: now,
  };

  delete nextUserDoc.deletedAt;
  delete nextUserDoc.deletedAtMs;

  const batch = db.batch();
  batch.set(currentRef, nextUserDoc, { merge: false });

  for (const app of legacyApps) {
    const appRef = db.collection('matchmakingApplications').doc(String(app.id));
    const patch = {
      userId: currentUid,
      ...(safeStr(app?.uid) === legacyUid ? { uid: currentUid } : {}),
      ...(safeStr(app?.userUid) === legacyUid ? { userUid: currentUid } : {}),
      ...(safeStr(app?.ownerUid) === legacyUid ? { ownerUid: currentUid } : {}),
      ...(normalizedEmail ? { authEmail: normalizedEmail, authEmailLower: normalizedEmail } : {}),
      ...(displayName ? { displayName } : {}),
      ...(authProvider ? { authProvider } : {}),
      ...(safeStr(app?.email) ? {} : { email: normalizedEmail }),
      updatedAt: now,
      updatedAtMs: nowMs,
    };
    batch.set(appRef, patch, { merge: true });
  }

  if (legacyFlagSnap?.exists) {
    batch.set(db.collection('adminUserFlags').doc(currentUid), legacyFlagSnap.data() || {}, { merge: false });
    batch.delete(legacyFlagRef);
  }

  batch.delete(db.collection('matchmakingUsers').doc(legacyUid));

  await batch.commit();
  return {
    recovered: true,
    legacyUid,
    applicationIds: legacyApps.map((item) => safeStr(item?.id)).filter(Boolean),
  };
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
    const lookingForGender = normalizeLookingForGender(body?.lookingForGender, gender);
    const authEmail = safeStr(decoded?.email).toLowerCase();
    const displayName = safeStr(decoded?.name);
    const authProvider = safeStr(decoded?.firebase?.sign_in_provider).toLowerCase();

    const { db, FieldValue } = getAdmin();

    const recovery = await recoverLegacyUserByEmail({
      db,
      FieldValue,
      uid,
      authEmail,
      displayName,
      authProvider,
      age,
      gender,
      lookingForGender,
    }).catch(() => ({ recovered: false, reason: 'recovery_failed' }));

    const ref = db.collection('matchmakingUsers').doc(uid);

    let ensured = false;
    let created = false;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() || {} : {};
      const existingAge = typeof data?.age === 'number' && Number.isFinite(data.age) ? data.age : null;

      const existingGender = normalizeGender(data?.gender);
      const existingLookingFor = normalizeLookingForGender(data?.lookingForGender, existingGender || gender);
      const existingAuthEmail = safeStr(data?.authEmail).toLowerCase();
      const existingDisplayName = safeStr(data?.displayName);
      const existingAuthProvider = safeStr(data?.authProvider).toLowerCase();

      const patch = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (existingAge === null && typeof age === 'number') patch.age = age;
      if (!existingGender && gender) patch.gender = gender;
      if (!existingLookingFor && lookingForGender) patch.lookingForGender = lookingForGender;
      if (authEmail && existingAuthEmail !== authEmail) {
        patch.authEmail = authEmail;
        patch.authEmailLower = authEmail;
      }
      if (displayName && existingDisplayName !== displayName) patch.displayName = displayName;
      if (authProvider && existingAuthProvider !== authProvider) patch.authProvider = authProvider;

      const willCreate = !snap.exists;
      if (willCreate) {
        patch.createdAt = FieldValue.serverTimestamp();
      }

      // Eğer hiçbir alan güncellenmeyecekse ve doküman zaten varsa write yapma.
      const hasMeaningfulPatch =
        Object.prototype.hasOwnProperty.call(patch, 'age') ||
        Object.prototype.hasOwnProperty.call(patch, 'gender') ||
        Object.prototype.hasOwnProperty.call(patch, 'lookingForGender') ||
        Object.prototype.hasOwnProperty.call(patch, 'authEmail') ||
        Object.prototype.hasOwnProperty.call(patch, 'authEmailLower') ||
        Object.prototype.hasOwnProperty.call(patch, 'displayName') ||
        Object.prototype.hasOwnProperty.call(patch, 'authProvider') ||
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
    res.end(JSON.stringify({ ok: true, ensured, created, recovered: recovery?.recovered === true, recoveredFromUid: safeStr(recovery?.legacyUid) || null }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
