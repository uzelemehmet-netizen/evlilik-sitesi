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

export default async function adminMatchActivityList(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  await requireAdmin(req);
  const body = normalizeBody(req);

  const limit = Math.min(200, Math.max(1, safeInt(body?.limit, 80)));

  const { db } = getAdmin();

  // Index istememek için: sadece updatedAt desc çek, client-side filtrele.
  const snap = await db.collection('matchmakingMatches').orderBy('updatedAt', 'desc').limit(limit).get();

  const matches = snap.docs.map((d) => {
    const m = d.data() || {};
    const userIds = Array.isArray(m.userIds) ? m.userIds.map(String).filter(Boolean) : [];

    const activeStartByUid = m.activeStartByUid && typeof m.activeStartByUid === 'object' ? m.activeStartByUid : null;
    const activeCancelByUid = m.activeCancelByUid && typeof m.activeCancelByUid === 'object' ? m.activeCancelByUid : null;

    return {
      id: d.id,
      matchCode: safeStr(m.matchCode) || null,
      matchNo: typeof m.matchNo === 'number' && Number.isFinite(m.matchNo) ? m.matchNo : null,
      status: safeStr(m.status) || null,
      userIds,
      updatedAtMs: tsToMs(m.updatedAt) || null,
      chatEnabledAtMs: typeof m.chatEnabledAtMs === 'number' && Number.isFinite(m.chatEnabledAtMs) ? m.chatEnabledAtMs : null,
      mutualAcceptedAtMs: typeof m.mutualAcceptedAtMs === 'number' && Number.isFinite(m.mutualAcceptedAtMs) ? m.mutualAcceptedAtMs : null,
      cancelledAtMs: typeof m.cancelledAtMs === 'number' && Number.isFinite(m.cancelledAtMs) ? m.cancelledAtMs : null,
      cancelledReason: safeStr(m.cancelledReason) || null,
      activeStartByUid,
      activeCancelByUid,
    };
  });

  const uidSet = new Set();
  for (const it of matches) {
    for (const uid of it.userIds || []) uidSet.add(uid);
    if (it.activeStartByUid) for (const uid of Object.keys(it.activeStartByUid)) uidSet.add(uid);
    if (it.activeCancelByUid) for (const uid of Object.keys(it.activeCancelByUid)) uidSet.add(uid);
  }

  const uids = Array.from(uidSet).slice(0, 300);
  const userRefs = uids.map((uid) => db.collection('matchmakingUsers').doc(uid));

  const userByUid = {};
  if (userRefs.length) {
    const snaps = await db.getAll(...userRefs);
    for (const s of snaps) {
      if (!s.exists) continue;
      const uid = String(s.id || '');
      if (!uid) continue;
      userByUid[uid] = pickUserSummary(s.data() || {});
    }
  }

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, items: matches, userByUid }));
}
