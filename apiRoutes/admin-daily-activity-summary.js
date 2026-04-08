import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeInt(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function safeMs(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function parseDateYYYYMMDD(v) {
  const s = safeStr(v);
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return s;
}

function dayKeyTRFromMs(ms) {
  const offsetMs = 180 * 60 * 1000;
  const d = new Date(ms + offsetMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayStartEndUtcMsTR(dayKey) {
  const offsetMs = 180 * 60 * 1000;
  const [y, m, d] = String(dayKey || '').split('-').map((x) => Number(x));
  const startUtcMs = Date.UTC(y, m - 1, d, 0, 0, 0) - offsetMs;
  return { startUtcMs, endUtcMs: startUtcMs + 24 * 60 * 60 * 1000 };
}

function dayKeysLastNDays(n, nowMs) {
  const out = [];
  const total = Math.max(1, safeInt(n, 30));
  for (let i = 0; i < total; i += 1) out.push(dayKeyTRFromMs(nowMs - i * 24 * 60 * 60 * 1000));
  return out;
}

function chunkArray(values, size = 200) {
  const list = Array.isArray(values) ? values : [];
  const out = [];
  const chunkSize = Math.max(1, safeInt(size, 200));
  for (let i = 0; i < list.length; i += chunkSize) out.push(list.slice(i, i + chunkSize));
  return out;
}

function uniqueStrings(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map((v) => safeStr(v)).filter(Boolean)));
}

function tsToMs(v) {
  try {
    if (!v) return 0;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (v instanceof Date) return v.getTime();
    if (typeof v?.toMillis === 'function') return v.toMillis();
    if (typeof v?.seconds === 'number') return Math.floor(v.seconds * 1000 + (typeof v?.nanoseconds === 'number' ? v.nanoseconds / 1e6 : 0));
    return 0;
  } catch {
    return 0;
  }
}

function isMembershipActive(userDoc, nowMs = Date.now()) {
  const membership = userDoc?.membership || null;
  if (!membership || membership.active !== true) return false;
  const untilMs = typeof membership.validUntilMs === 'number' ? membership.validUntilMs : 0;
  return untilMs > nowMs;
}

function pickUserSummary(userDoc, uid, nowMs) {
  const d = userDoc && typeof userDoc === 'object' ? userDoc : {};
  const app = d?.application && typeof d.application === 'object' ? d.application : null;
  const profile = d?.publicProfile && typeof d.publicProfile === 'object' ? d.publicProfile : null;
  const details = d?.details && typeof d.details === 'object' ? d.details : null;
  return {
    uid: safeStr(uid) || null,
    userCode: safeStr(d?.userCode) || safeStr(profile?.userCode) || null,
    username: safeStr(d?.username) || safeStr(profile?.username) || safeStr(app?.username) || null,
    fullName: safeStr(d?.fullName) || safeStr(profile?.fullName) || safeStr(app?.fullName) || null,
    gender: safeStr(d?.gender) || safeStr(profile?.gender) || safeStr(app?.gender) || null,
    city: safeStr(d?.city) || safeStr(profile?.city) || safeStr(app?.city) || safeStr(details?.city) || null,
    country: safeStr(d?.country) || safeStr(profile?.country) || safeStr(app?.country) || safeStr(details?.country) || null,
    lastSeenAtMs: safeMs(d?.lastSeenAtMs) || tsToMs(d?.lastSeenAt) || null,
    membershipActive: isMembershipActive(d, nowMs),
  };
}

async function getDocsById(db, collectionName, ids) {
  const result = new Map();
  const chunks = chunkArray(ids, 200);
  for (const chunk of chunks) {
    const refs = chunk.map((id) => db.collection(collectionName).doc(id));
    let snaps = [];
    try {
      snaps = refs.length ? await db.getAll(...refs) : [];
    } catch {
      snaps = await Promise.all(refs.map((ref) => ref.get()));
    }
    for (let i = 0; i < chunk.length; i += 1) {
      const snap = snaps[i];
      result.set(chunk[i], snap && snap.exists ? { id: snap.id, ...(snap.data() || {}) } : null);
    }
  }
  return result;
}

export default async function adminDailyActivitySummary(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);

    const body = normalizeBody(req);
    const days = Math.min(Math.max(safeInt(body?.days, 30), 1), 31);
    const limit = Math.min(Math.max(safeInt(body?.limit, 200), 20), 500);
    const nowMs = Date.now();
    const dayKeys = dayKeysLastNDays(days, nowMs);
    const dayKey = parseDateYYYYMMDD(body?.dayKey) || dayKeys[0];
    const { startUtcMs, endUtcMs } = dayStartEndUtcMsTR(dayKey);

    const { db } = getAdmin();

    const likeMatchesById = new Map();
    const addLikeMatch = (doc) => {
      if (!doc?.exists) return;
      const data = doc.data() || {};
      const id = safeStr(doc.id);
      if (!id) return;
      if (likeMatchesById.has(id)) return;
      const userIds = uniqueStrings(data?.userIds);
      likeMatchesById.set(id, {
        id,
        matchCode: safeStr(data?.matchCode) || null,
        matchNo: typeof data?.matchNo === 'number' && Number.isFinite(data.matchNo) ? data.matchNo : null,
        status: safeStr(data?.status) || null,
        userIds,
        eventAtMs: safeMs(data?.mutualInterestAtMs) || safeMs(data?.mutualAcceptedAtMs) || tsToMs(data?.updatedAt) || null,
      });
    };

    try {
      const snap = await db
        .collection('matchmakingMatches')
        .where('mutualInterestAtMs', '>=', startUtcMs)
        .where('mutualInterestAtMs', '<', endUtcMs)
        .limit(limit)
        .get();
      snap.forEach(addLikeMatch);
    } catch {
      // ignore
    }

    try {
      const snap = await db
        .collection('matchmakingMatches')
        .where('mutualAcceptedAtMs', '>=', startUtcMs)
        .where('mutualAcceptedAtMs', '<', endUtcMs)
        .limit(limit)
        .get();
      snap.forEach(addLikeMatch);
    } catch {
      // ignore
    }

    const reciprocalMessageMatchesRaw = new Map();
    try {
      const msgSnap = await db
        .collectionGroup('messages')
        .where('createdAtMs', '>=', startUtcMs)
        .where('createdAtMs', '<', endUtcMs)
        .limit(Math.max(limit * 20, 1000))
        .get();

      msgSnap.forEach((doc) => {
        const data = doc.data() || {};
        const deliveryState = safeStr(data?.delivery?.state).toLowerCase();
        if (deliveryState === 'held') return;

        const matchId = safeStr(data?.matchId) || safeStr(doc.ref?.parent?.parent?.id);
        const userId = safeStr(data?.userId);
        const createdAtMs = safeMs(data?.createdAtMs) || tsToMs(data?.createdAt);
        if (!matchId || !userId || !createdAtMs) return;

        let entry = reciprocalMessageMatchesRaw.get(matchId);
        if (!entry) {
          entry = { userIds: new Set(), perUidCount: {}, lastMessageAtMs: 0, totalMessages: 0 };
          reciprocalMessageMatchesRaw.set(matchId, entry);
        }
        entry.userIds.add(userId);
        entry.perUidCount[userId] = (entry.perUidCount[userId] || 0) + 1;
        entry.totalMessages += 1;
        if (createdAtMs > entry.lastMessageAtMs) entry.lastMessageAtMs = createdAtMs;
      });
    } catch {
      // ignore
    }

    const reciprocalMatchIds = Array.from(reciprocalMessageMatchesRaw.entries())
      .filter(([, value]) => value?.userIds && value.userIds.size >= 2)
      .map(([matchId]) => matchId)
      .slice(0, limit);

    const reciprocalMatchDocs = reciprocalMatchIds.length
      ? await getDocsById(db, 'matchmakingMatches', reciprocalMatchIds)
      : new Map();

    const reciprocalMatches = reciprocalMatchIds
      .map((matchId) => {
        const raw = reciprocalMessageMatchesRaw.get(matchId) || null;
        const doc = reciprocalMatchDocs.get(matchId) || null;
        const userIds = uniqueStrings(doc?.userIds || Array.from(raw?.userIds || []));
        return {
          id: matchId,
          matchCode: safeStr(doc?.matchCode) || null,
          matchNo: typeof doc?.matchNo === 'number' && Number.isFinite(doc.matchNo) ? doc.matchNo : null,
          status: safeStr(doc?.status) || null,
          userIds,
          totalMessages: raw?.totalMessages || 0,
          lastMessageAtMs: raw?.lastMessageAtMs || null,
          perUidCount: raw?.perUidCount || {},
        };
      })
      .sort((a, b) => safeMs(b?.lastMessageAtMs) - safeMs(a?.lastMessageAtMs));

    let onlineDocs = [];
    try {
      const snap = await db
        .collection('matchmakingUsers')
        .where('lastSeenAtMs', '>=', startUtcMs)
        .where('lastSeenAtMs', '<', endUtcMs)
        .orderBy('lastSeenAtMs', 'desc')
        .limit(limit)
        .get();
      onlineDocs = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
    } catch {
      onlineDocs = [];
    }

    const uidSet = new Set();
    for (const item of likeMatchesById.values()) for (const uid of item.userIds || []) uidSet.add(uid);
    for (const item of reciprocalMatches) for (const uid of item.userIds || []) uidSet.add(uid);
    for (const item of onlineDocs) uidSet.add(String(item.id || ''));

    const uidList = Array.from(uidSet).filter(Boolean);
    const userDocs = uidList.length ? await getDocsById(db, 'matchmakingUsers', uidList) : new Map();

    const userByUid = {};
    for (const uid of uidList) {
      const userDoc = userDocs.get(uid) || null;
      if (!userDoc) continue;
      userByUid[uid] = pickUserSummary(userDoc, uid, nowMs);
    }

    const reciprocalMessagerByUid = new Map();
    for (const match of reciprocalMatches) {
      for (const uid of match.userIds || []) {
        let row = reciprocalMessagerByUid.get(uid);
        if (!row) {
          row = { uid, reciprocalMatchCount: 0, sentCount: 0, lastMessageAtMs: 0 };
          reciprocalMessagerByUid.set(uid, row);
        }
        row.reciprocalMatchCount += 1;
        row.sentCount += safeInt(match?.perUidCount?.[uid], 0) || 0;
        if (safeMs(match?.lastMessageAtMs) > row.lastMessageAtMs) row.lastMessageAtMs = match.lastMessageAtMs;
      }
    }

    const reciprocalMessagers = Array.from(reciprocalMessagerByUid.values()).sort((a, b) => {
      if (safeInt(b?.reciprocalMatchCount, 0) !== safeInt(a?.reciprocalMatchCount, 0)) {
        return safeInt(b?.reciprocalMatchCount, 0) - safeInt(a?.reciprocalMatchCount, 0);
      }
      return safeMs(b?.lastMessageAtMs) - safeMs(a?.lastMessageAtMs);
    });

    const onlineUsers = onlineDocs
      .map((doc) => ({ uid: String(doc.id || ''), lastSeenAtMs: safeMs(doc.lastSeenAtMs) || tsToMs(doc.lastSeenAt) || null }))
      .filter((row) => row.uid)
      .sort((a, b) => safeMs(b?.lastSeenAtMs) - safeMs(a?.lastSeenAtMs));

    const mutualLikeUsers = new Set();
    for (const match of likeMatchesById.values()) for (const uid of match.userIds || []) mutualLikeUsers.add(uid);

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'no-store');
    res.end(
      JSON.stringify({
        ok: true,
        dayKey,
        dayKeys,
        range: { startUtcMs, endUtcMs },
        summary: {
          mutualLikeMatches: likeMatchesById.size,
          mutualLikeUsers: mutualLikeUsers.size,
          reciprocalMessageMatches: reciprocalMatches.length,
          reciprocalMessageUsers: reciprocalMessagers.length,
          reciprocalMessageTotal: reciprocalMatches.reduce((sum, item) => sum + safeInt(item?.totalMessages, 0), 0),
          onlineUsers: onlineUsers.length,
        },
        mutualLikes: Array.from(likeMatchesById.values()).sort((a, b) => safeMs(b?.eventAtMs) - safeMs(a?.eventAtMs)),
        reciprocalMatches,
        reciprocalMessagers,
        onlineUsers,
        userByUid,
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}