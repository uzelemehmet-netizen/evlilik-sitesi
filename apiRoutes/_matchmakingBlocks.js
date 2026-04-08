function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export function getBlockedUserIds(userDoc) {
  const raw = Array.isArray(userDoc?.blockedUserIds) ? userDoc.blockedUserIds : [];
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    const uid = safeStr(item);
    if (!uid || seen.has(uid)) continue;
    seen.add(uid);
    out.push(uid);
  }
  return out;
}

export function hasBlockedUser(userDoc, targetUid) {
  const cleanTargetUid = safeStr(targetUid);
  if (!cleanTargetUid) return false;
  return getBlockedUserIds(userDoc).includes(cleanTargetUid);
}

export function isEitherUserBlocked({ aUserDoc, aUid, bUserDoc, bUid }) {
  const cleanA = safeStr(aUid);
  const cleanB = safeStr(bUid);
  if (!cleanA || !cleanB) return false;
  return hasBlockedUser(aUserDoc, cleanB) || hasBlockedUser(bUserDoc, cleanA);
}

export function buildBlockedUsersPatch({ userDoc, targetUid, matchId = '', reason = '', blockedAtMs = Date.now() }) {
  const cleanTargetUid = safeStr(targetUid);
  if (!cleanTargetUid) return {};

  const blockedUserIds = getBlockedUserIds(userDoc);
  if (!blockedUserIds.includes(cleanTargetUid)) blockedUserIds.push(cleanTargetUid);

  const blockedUsersMeta = userDoc?.blockedUsersMeta && typeof userDoc.blockedUsersMeta === 'object'
    ? { ...userDoc.blockedUsersMeta }
    : {};

  blockedUsersMeta[cleanTargetUid] = {
    blockedAtMs: typeof blockedAtMs === 'number' && Number.isFinite(blockedAtMs) ? blockedAtMs : Date.now(),
    matchId: safeStr(matchId),
    reason: safeStr(reason),
  };

  return {
    blockedUserIds,
    blockedUsersMeta,
  };
}