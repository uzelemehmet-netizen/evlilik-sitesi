import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function tsToMs(v) {
  try {
    if (!v) return 0;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (v instanceof Date) return v.getTime();
    if (typeof v?.toMillis === 'function') return v.toMillis();
    const seconds = typeof v?.seconds === 'number' ? v.seconds : null;
    const nanos = typeof v?.nanoseconds === 'number' ? v.nanoseconds : 0;
    if (seconds !== null) return Math.floor(seconds * 1000 + nanos / 1e6);
    return 0;
  } catch {
    return 0;
  }
}

function pickUserSummary(userDoc) {
  const d = userDoc || {};
  return {
    userCode: typeof d?.userCode === 'string' ? d.userCode : null,
    fullName: typeof d?.fullName === 'string' && d.fullName.trim() ? d.fullName.trim() : null,
    username: typeof d?.username === 'string' && d.username.trim() ? d.username.trim() : null,
  };
}

function needsIndexError(e) {
  const msg = String(e?.message || e || '');
  return msg.includes('FAILED_PRECONDITION') && (msg.includes('requires an index') || msg.includes('requires a composite index'));
}

export default async function adminUserMatchesList(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  await requireAdmin(req);
  const body = normalizeBody(req);

  const userId = safeStr(body?.userId);
  const limit = Math.min(200, Math.max(1, safeInt(body?.limit, 80)));

  if (!userId) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
    return;
  }

  const { db } = getAdmin();

  const baseQ = db.collection('matchmakingMatches').where('userIds', 'array-contains', userId);

  let docs = [];
  try {
    // Prefer deterministic order if index exists.
    const snap = await baseQ.orderBy('updatedAt', 'desc').limit(limit).get();
    docs = snap.docs || [];
  } catch (e) {
    if (!needsIndexError(e)) throw e;

    // Fallback: no orderBy (no composite index needed), then sort in-memory.
    const snap = await baseQ.limit(limit).get();
    docs = snap.docs || [];
  }

  const items = docs
    .map((d) => {
      const m = d.data() || {};
      const userIds = Array.isArray(m.userIds) ? m.userIds.map(String).filter(Boolean) : [];
      const otherUserId = userIds.find((x) => x && x !== userId) || null;

      return {
        id: d.id,
        matchCode: safeStr(m.matchCode) || null,
        matchNo: typeof m.matchNo === 'number' && Number.isFinite(m.matchNo) ? m.matchNo : null,
        status: safeStr(m.status) || null,
        userIds,
        otherUserId,
        createdAtMs: tsToMs(m.createdAt) || null,
        updatedAtMs: tsToMs(m.updatedAt) || null,
        chatEnabledAtMs: typeof m.chatEnabledAtMs === 'number' && Number.isFinite(m.chatEnabledAtMs) ? m.chatEnabledAtMs : null,
        mutualAcceptedAtMs: typeof m.mutualAcceptedAtMs === 'number' && Number.isFinite(m.mutualAcceptedAtMs) ? m.mutualAcceptedAtMs : null,
        cancelledAtMs: typeof m.cancelledAtMs === 'number' && Number.isFinite(m.cancelledAtMs) ? m.cancelledAtMs : null,
        cancelledReason: safeStr(m.cancelledReason) || null,
        cancelledByUserId: safeStr(m.cancelledByUserId) || null,
      };
    })
    .sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0))
    .slice(0, limit);

  const uidSet = new Set();
  uidSet.add(userId);
  for (const it of items) {
    for (const uid of it.userIds || []) uidSet.add(uid);
    if (it.otherUserId) uidSet.add(it.otherUserId);
  }

  const uids = Array.from(uidSet).slice(0, 300);
  const refs = uids.map((uid) => db.collection('matchmakingUsers').doc(uid));

  const userByUid = {};
  if (refs.length) {
    const snaps = await db.getAll(...refs);
    for (const s of snaps) {
      if (!s.exists) continue;
      const uid = String(s.id || '');
      if (!uid) continue;
      userByUid[uid] = pickUserSummary(s.data() || {});
    }
  }

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, userId, items, userByUid }));
}
