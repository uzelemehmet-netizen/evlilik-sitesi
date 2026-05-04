import { isSyntheticTestUserRecord } from './_syntheticTestUser.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeGender(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'male' || s === 'm' || s === 'man' || s === 'erkek') return 'male';
  if (s === 'female' || s === 'f' || s === 'woman' || s === 'kadin' || s === 'kadın') return 'female';
  return '';
}

function parseUcNo(v) {
  const s = safeStr(v).toUpperCase();
  const m = /^UC-(\d{3,})$/.exec(s);
  if (!m) return 0;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function formatUcNo(n) {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v) || v <= 0) return '';
  return `UC-${Math.floor(v)}`;
}

function isSupportedUserCodeNo(no) {
  const numeric = typeof no === 'number' ? no : Number(no);
  return Number.isFinite(numeric) && numeric > 0 && numeric < 100000;
}

function inferUserCodeGenderFromNo(no) {
  const numeric = typeof no === 'number' ? no : Number(no);
  if (!isSupportedUserCodeNo(numeric)) return '';
  if (numeric >= 1001 && numeric < 2000) return 'female';
  if (numeric >= 2001) return 'male';
  return '';
}

function doesUserCodeMatchGender(no, gender) {
  const numeric = typeof no === 'number' ? no : Number(no);
  const genderNorm = normalizeGender(gender);
  if (!Number.isFinite(numeric) || numeric <= 0) return true;
  if (!isSupportedUserCodeNo(numeric)) return false;
  if (genderNorm === 'female') return numeric >= 1001 && numeric < 2000;
  if (genderNorm === 'male') return numeric >= 2001;
  return true;
}

function normalizeReleasedCodeList(values, gender = '') {
  const list = Array.isArray(values) ? values : [];
  const normalized = [];
  const seen = new Set();

  for (const value of list) {
    const numeric = typeof value === 'number' ? Math.floor(value) : Number(String(value || '').trim());
    if (!Number.isFinite(numeric) || numeric <= 0) continue;
    if ((gender === 'female' || gender === 'male') && !doesUserCodeMatchGender(numeric, gender)) continue;
    if (seen.has(numeric)) continue;
    seen.add(numeric);
    normalized.push(numeric);
  }

  normalized.sort((a, b) => a - b);
  return normalized;
}

function addReleasedCode(list, codeNo, gender = '') {
  const numeric = typeof codeNo === 'number' ? Math.floor(codeNo) : Number(codeNo);
  if (!Number.isFinite(numeric) || numeric <= 0) return Array.isArray(list) ? list : [];
  if ((gender === 'female' || gender === 'male') && !doesUserCodeMatchGender(numeric, gender)) {
    return Array.isArray(list) ? list : [];
  }
  return normalizeReleasedCodeList([...(Array.isArray(list) ? list : []), numeric], gender);
}

export async function ensureUserCodeAssigned({ db, FieldValue, uid, gender = '', nowMs = Date.now() } = {}) {
  const userId = safeStr(uid);
  if (!db || !FieldValue || !userId) {
    return { ok: false, assigned: false, userCode: '', userCodeNo: 0, reason: 'missing_uid' };
  }

  let result = { ok: true, assigned: false, userCode: '', userCodeNo: 0, reason: 'missing_gender' };

  await db.runTransaction(async (tx) => {
    const userRef = db.collection('matchmakingUsers').doc(userId);
    const userSnap = await tx.get(userRef);
    const user = userSnap.exists ? userSnap.data() || {} : {};

    const existingUserCode = safeStr(user?.userCode) || safeStr(user?.publicProfile?.userCode);
    const existingUserCodeNo =
      (typeof user?.userCodeNo === 'number' && Number.isFinite(user.userCodeNo) ? user.userCodeNo : 0) ||
      (typeof user?.publicProfile?.userCodeNo === 'number' && Number.isFinite(user.publicProfile.userCodeNo)
        ? user.publicProfile.userCodeNo
        : 0) ||
      parseUcNo(existingUserCode);
    const normalizedNo = existingUserCodeNo || parseUcNo(existingUserCode);
    const normalizedCode = existingUserCode || formatUcNo(normalizedNo);

    if (isSyntheticTestUserRecord({ uid: userId, user })) {
      const releasedGender = inferUserCodeGenderFromNo(normalizedNo);
      if (releasedGender) {
        const countersRef = db.collection('matchmakingMeta').doc('userCodeCounters');
        const countersSnap = await tx.get(countersRef);
        const counters = countersSnap.exists ? countersSnap.data() || {} : {};
        const releasedFemale = normalizeReleasedCodeList(counters?.releasedFemale, 'female');
        const releasedMale = normalizeReleasedCodeList(counters?.releasedMale, 'male');

        tx.set(
          countersRef,
          {
            releasedFemale: releasedGender === 'female' ? addReleasedCode(releasedFemale, normalizedNo, 'female') : releasedFemale,
            releasedMale: releasedGender === 'male' ? addReleasedCode(releasedMale, normalizedNo, 'male') : releasedMale,
            updatedAt: FieldValue.serverTimestamp(),
            updatedAtMs: nowMs,
          },
          { merge: true },
        );
      }

      tx.set(
        userRef,
        {
          isSyntheticTestUser: true,
          testAccount: true,
          ...(normalizedCode ? { previousUserCode: normalizedCode } : {}),
          ...(normalizedNo > 0 ? { previousUserCodeNo: normalizedNo } : {}),
          userCode: FieldValue.delete(),
          userCodeNo: FieldValue.delete(),
          userCodeGender: FieldValue.delete(),
          userCodeAssignedAtMs: FieldValue.delete(),
          userCodeReleasedAtMs: nowMs,
          'application.userCode': FieldValue.delete(),
          'application.userCodeNo': FieldValue.delete(),
          'publicProfile.userCode': FieldValue.delete(),
          'publicProfile.userCodeNo': FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: nowMs,
        },
        { merge: true },
      );

      result = { ok: true, assigned: false, userCode: '', userCodeNo: 0, reason: 'synthetic_test_user' };
      return;
    }

    const genderNorm =
      normalizeGender(gender) ||
      normalizeGender(user?.gender) ||
      normalizeGender(user?.publicProfile?.gender) ||
      normalizeGender(user?.application?.gender);

    const storedUserCodeGender = normalizeGender(user?.userCodeGender);
    const hasBandMismatch =
      !!normalizedCode &&
      normalizedNo > 0 &&
      (genderNorm === 'female' || genderNorm === 'male') &&
      !doesUserCodeMatchGender(normalizedNo, genderNorm);

    if ((existingUserCode || existingUserCodeNo > 0) && !hasBandMismatch) {
      const syncPatch = {
        ...(normalizedCode && !existingUserCode ? { userCode: normalizedCode } : {}),
        ...(normalizedNo > 0 && !(typeof user?.userCodeNo === 'number' && Number.isFinite(user.userCodeNo))
          ? { userCodeNo: normalizedNo }
          : {}),
        ...(normalizedCode && safeStr(user?.application?.userCode) !== normalizedCode ? { 'application.userCode': normalizedCode } : {}),
        ...(normalizedNo > 0 && user?.application?.userCodeNo !== normalizedNo ? { 'application.userCodeNo': normalizedNo } : {}),
        ...(normalizedCode && safeStr(user?.publicProfile?.userCode) !== normalizedCode ? { 'publicProfile.userCode': normalizedCode } : {}),
        ...(normalizedNo > 0 && user?.publicProfile?.userCodeNo !== normalizedNo ? { 'publicProfile.userCodeNo': normalizedNo } : {}),
        ...((genderNorm === 'female' || genderNorm === 'male') && storedUserCodeGender !== genderNorm ? { userCodeGender: genderNorm } : {}),
      };

      if (Object.keys(syncPatch).length) {
        tx.set(
          userRef,
          {
            ...syncPatch,
            updatedAt: FieldValue.serverTimestamp(),
            updatedAtMs: nowMs,
          },
          { merge: true },
        );
      }

      result = {
        ok: true,
        assigned: false,
        userCode: normalizedCode,
        userCodeNo: normalizedNo,
        reason: 'already_exists',
      };
      return;
    }

    if (!(genderNorm === 'female' || genderNorm === 'male')) {
      result = { ok: true, assigned: false, userCode: '', userCodeNo: 0, reason: 'missing_gender' };
      return;
    }

    const countersRef = db.collection('matchmakingMeta').doc('userCodeCounters');
    const countersSnap = await tx.get(countersRef);
    const counters = countersSnap.exists ? countersSnap.data() || {} : {};

    const baseFemale = 1001;
    const baseMale = 2001;

    const nextFemaleRaw = typeof counters?.nextFemale === 'number' ? counters.nextFemale : parseUcNo(counters?.nextFemaleCode);
    const nextMaleRaw = typeof counters?.nextMale === 'number' ? counters.nextMale : parseUcNo(counters?.nextMaleCode);

    const nextFemale = Number.isFinite(nextFemaleRaw) && nextFemaleRaw >= baseFemale ? Math.floor(nextFemaleRaw) : baseFemale;
    const nextMale = Number.isFinite(nextMaleRaw) && nextMaleRaw >= baseMale ? Math.floor(nextMaleRaw) : baseMale;
    let releasedFemale = normalizeReleasedCodeList(counters?.releasedFemale, 'female');
    let releasedMale = normalizeReleasedCodeList(counters?.releasedMale, 'male');

    let assignedNo = 0;
    let usedReleasedCode = false;

    if (genderNorm === 'female' && releasedFemale.length) {
      assignedNo = releasedFemale[0];
      releasedFemale = releasedFemale.slice(1);
      usedReleasedCode = true;
    } else if (genderNorm === 'male' && releasedMale.length) {
      assignedNo = releasedMale[0];
      releasedMale = releasedMale.slice(1);
      usedReleasedCode = true;
    } else {
      assignedNo = genderNorm === 'female' ? nextFemale : nextMale;
    }

    if (hasBandMismatch) {
      const releasedGender = inferUserCodeGenderFromNo(normalizedNo);
      if (releasedGender === 'female') {
        releasedFemale = addReleasedCode(releasedFemale, normalizedNo, 'female');
      }
      if (releasedGender === 'male') {
        releasedMale = addReleasedCode(releasedMale, normalizedNo, 'male');
      }
    }

    const assignedCode = formatUcNo(assignedNo);
    if (!assignedCode) {
      result = { ok: false, assigned: false, userCode: '', userCodeNo: 0, reason: 'assign_failed' };
      return;
    }

    tx.set(
      userRef,
      {
        ...(safeStr(user?.gender) ? {} : { gender: genderNorm }),
        userCode: assignedCode,
        userCodeNo: assignedNo,
        'application.userCode': assignedCode,
        'application.userCodeNo': assignedNo,
        'publicProfile.userCode': assignedCode,
        'publicProfile.userCodeNo': assignedNo,
        userCodeGender: genderNorm,
        userCodeAssignedAtMs: nowMs,
        ...(hasBandMismatch && normalizedCode ? { previousUserCode: normalizedCode } : {}),
        ...(hasBandMismatch && normalizedNo > 0 ? { previousUserCodeNo: normalizedNo } : {}),
        ...(hasBandMismatch ? { userCodeReassignedAtMs: nowMs } : {}),
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: nowMs,
      },
      { merge: true },
    );

    tx.set(
      countersRef,
      {
        nextFemale: genderNorm === 'female' && !usedReleasedCode ? assignedNo + 1 : nextFemale,
        nextMale: genderNorm === 'male' && !usedReleasedCode ? assignedNo + 1 : nextMale,
        releasedFemale,
        releasedMale,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: nowMs,
      },
      { merge: true },
    );

    result = {
      ok: true,
      assigned: true,
      userCode: assignedCode,
      userCodeNo: assignedNo,
      reason: hasBandMismatch ? 'reassigned_mismatched_band' : 'assigned',
    };
  });

  return result;
}