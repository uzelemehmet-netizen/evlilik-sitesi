function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getAnyAbout(app) {
  const item = app && typeof app === 'object' ? app : null;
  if (!item) return '';

  const legacyBio = safeStr(item?.bio);
  if (legacyBio) return legacyBio;

  const direct = safeStr(item?.about) || safeStr(item?.aboutTr) || safeStr(item?.aboutId);
  if (direct) return direct;

  const details = item?.details && typeof item.details === 'object' ? item.details : null;
  const detailsAbout =
    safeStr(details?.about) ||
    safeStr(details?.bio) ||
    safeStr(details?.aboutTr) ||
    safeStr(details?.aboutId) ||
    safeStr(details?.bioTr) ||
    safeStr(details?.bioId);
  if (detailsAbout) return detailsAbout;

  const publicProfile = item?.publicProfile && typeof item.publicProfile === 'object' ? item.publicProfile : null;
  return (
    safeStr(publicProfile?.about) ||
    safeStr(publicProfile?.bio) ||
    safeStr(publicProfile?.aboutTr) ||
    safeStr(publicProfile?.aboutId) ||
    safeStr(publicProfile?.bioTr) ||
    safeStr(publicProfile?.bioId)
  );
}

function pickAccountDisplayName(app, userDoc) {
  return safeStr(app?.displayName) || safeStr(userDoc?.displayName) || safeStr(userDoc?.publicProfile?.displayName) || '';
}

function pickAccountEmail(app, userDoc) {
  return safeStr(app?.authEmail) || safeStr(app?.email) || safeStr(userDoc?.authEmail) || safeStr(userDoc?.email) || '';
}

function hasKnownAccountIdentity(app, userDoc) {
  return !!(
    safeStr(app?.username) ||
    safeStr(app?.fullName) ||
    safeStr(userDoc?.username) ||
    safeStr(userDoc?.fullName) ||
    safeStr(userDoc?.publicProfile?.fullName) ||
    pickAccountDisplayName(app, userDoc) ||
    pickAccountEmail(app, userDoc)
  );
}

function isStubApplication(app) {
  const source = safeStr(app?.source).toLowerCase();
  return source === 'auto_stub' || app?.details?.autoBootstrap === true;
}

function isCompletedApplication(app) {
  const about = getAnyAbout(app);
  const expectations = safeStr(app?.expectations) || safeStr(app?.expectationsTr) || safeStr(app?.expectationsId);
  const wroteOnceMs =
    typeof app?.profileTextWriteOnceUsedAtMs === 'number' && Number.isFinite(app.profileTextWriteOnceUsedAtMs)
      ? app.profileTextWriteOnceUsedAtMs
      : 0;
  const hasEditOnce = !!app?.userEditOnceUsedAt || wroteOnceMs > 0;
  return hasEditOnce || !!about || (!!about && !!expectations);
}

function isUnknownUserWithAccount(app, userDoc) {
  return isStubApplication(app) && !isCompletedApplication(app) && !hasKnownAccountIdentity(app, userDoc);
}

function getCreatedAtMs(app) {
  if (typeof app?.createdAtMs === 'number' && Number.isFinite(app.createdAtMs)) return app.createdAtMs;
  const ts = app?.createdAt;
  if (ts && typeof ts.toMillis === 'function') {
    try {
      return ts.toMillis();
    } catch {
      return 0;
    }
  }
  if (typeof ts?.seconds === 'number' && Number.isFinite(ts.seconds)) return ts.seconds * 1000;
  return 0;
}

function getRepresentativeScore(app, userDoc) {
  let score = 0;
  if (!isStubApplication(app)) score += 1_000_000;
  if (isCompletedApplication(app)) score += 500_000;
  if (hasKnownAccountIdentity(app, userDoc)) score += 100_000;
  if (typeof app?.age === 'number' && Number.isFinite(app.age)) score += 10_000;
  if (safeStr(app?.gender)) score += 5_000;
  if (safeStr(app?.userCode) || safeStr(userDoc?.userCode) || safeStr(userDoc?.publicProfile?.userCode)) score += 1_000;
  return score + Math.min(getCreatedAtMs(app), 999_999_999);
}

function isSyntheticTestUser(app, userDoc) {
  const emails = [pickAccountEmail(app, userDoc), safeStr(app?.authEmail), safeStr(app?.email)]
    .map((value) => value.toLowerCase())
    .filter(Boolean);

  if (emails.some((value) => value.endsWith('@example.test'))) return true;
  if (emails.some((value) => value.includes('mobile.signup.'))) return true;

  const labels = [
    safeStr(app?.username),
    safeStr(app?.fullName),
    safeStr(userDoc?.username),
    safeStr(userDoc?.fullName),
    pickAccountDisplayName(app, userDoc),
  ]
    .map((value) => value.toLowerCase())
    .filter(Boolean);

  return labels.some((value) => value.includes('mobile.signup.'));
}

function pickBetterApplication(current, candidate, currentUserDoc, candidateUserDoc) {
  if (!current) return candidate;

  const currentScore = getRepresentativeScore(current, currentUserDoc);
  const candidateScore = getRepresentativeScore(candidate, candidateUserDoc);
  if (candidateScore !== currentScore) return candidateScore > currentScore ? candidate : current;

  return getCreatedAtMs(candidate) > getCreatedAtMs(current) ? candidate : current;
}

function dedupeAdminNewUsers(items, userInfoByUid = {}) {
  const byKey = new Map();
  const list = Array.isArray(items) ? items : [];

  for (const item of list) {
    const uid = safeStr(item?.userId);
    const key = uid || `doc:${safeStr(item?.id)}`;
    const userDoc = uid ? userInfoByUid[uid] ?? null : null;

    if (isSyntheticTestUser(item, userDoc)) continue;

    const current = byKey.get(key);
    const currentUserDoc = current && uid ? userInfoByUid[uid] ?? null : null;
    byKey.set(key, pickBetterApplication(current, item, currentUserDoc, userDoc));
  }

  return Array.from(byKey.values()).sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));
}

export {
  dedupeAdminNewUsers,
  getAnyAbout,
  getCreatedAtMs,
  hasKnownAccountIdentity,
  isCompletedApplication,
  isStubApplication,
  isSyntheticTestUser,
  isUnknownUserWithAccount,
  pickAccountDisplayName,
  pickAccountEmail,
  safeStr,
};