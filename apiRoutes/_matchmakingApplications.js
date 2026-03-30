function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

async function fetchByField(db, uid, field, limitN = 10) {
  try {
    const snap = await db.collection('matchmakingApplications').where(field, '==', uid).limit(limitN).get();
    if (!snap || snap.empty) return [];
    return snap.docs.map((d) => ({ id: safeStr(d.id), ...(d.data() || {}) })).filter((x) => safeStr(x?.id));
  } catch {
    return [];
  }
}

/**
 * Fetch matchmakingApplications for a user, with backward-compatible field names.
 * Historically some docs used `uid` / `userUid` instead of `userId`.
 */
async function fetchMatchmakingApplicationsByUid(db, uid, { limit = 10 } = {}) {
  const userId = safeStr(uid);
  if (!db || !userId) return [];

  const [a, b, c] = await Promise.all([
    fetchByField(db, userId, 'userId', limit),
    fetchByField(db, userId, 'uid', limit),
    fetchByField(db, userId, 'userUid', limit),
  ]);

  const byId = new Map();
  for (const it of [...a, ...b, ...c]) {
    const id = safeStr(it?.id);
    if (!id) continue;
    if (!byId.has(id)) byId.set(id, it);
  }
  return Array.from(byId.values());
}

export { fetchMatchmakingApplicationsByUid };
