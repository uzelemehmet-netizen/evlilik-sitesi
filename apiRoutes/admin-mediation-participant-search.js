import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { buildLeadSnapshotFromDoc, buildUserSnapshotFromDoc, normalizeSourceType, safeStr } from './_adminMediation.js';

function addUnique(map, snapshot) {
  if (!snapshot?.refId) return;
  if (map.has(snapshot.refId)) return;
  const label = snapshot?.label || snapshot?.userCode || snapshot?.fullName || snapshot?.refId;
  const subLabel = [safeStr(snapshot?.fullName), safeStr(snapshot?.city), safeStr(snapshot?.whatsapp)].filter(Boolean).join(' · ');
  const lookupValue = normalizeSourceType(snapshot?.sourceType) === 'lead'
    ? safeStr(snapshot?.whatsapp) || safeStr(snapshot?.refId)
    : safeStr(snapshot?.userCode) || safeStr(snapshot?.username) || safeStr(snapshot?.whatsapp) || safeStr(snapshot?.refId);

  map.set(snapshot.refId, {
    sourceType: normalizeSourceType(snapshot?.sourceType),
    refId: safeStr(snapshot?.refId),
    lookupValue,
    label: safeStr(label),
    subLabel,
    whatsapp: safeStr(snapshot?.whatsapp),
    photoUrl: safeStr(snapshot?.photoUrl),
    username: safeStr(snapshot?.username),
    userCode: safeStr(snapshot?.userCode),
    fullName: safeStr(snapshot?.fullName),
    city: safeStr(snapshot?.city),
    profileCode: safeStr(snapshot?.profileCode),
  });
}

function matchesNeedle(snapshot, needle) {
  const hay = [
    safeStr(snapshot?.refId),
    safeStr(snapshot?.label),
    safeStr(snapshot?.fullName),
    safeStr(snapshot?.username),
    safeStr(snapshot?.userCode),
    safeStr(snapshot?.profileCode),
    safeStr(snapshot?.whatsapp),
    safeStr(snapshot?.city),
  ].join(' ').toLowerCase();
  return hay.includes(needle);
}

async function searchUsers(db, query, limit) {
  const lower = query.toLowerCase();
  const upper = query.toUpperCase();
  const out = new Map();

  const direct = await db.collection('matchmakingUsers').doc(query).get();
  if (direct.exists) addUnique(out, buildUserSnapshotFromDoc(direct.id, direct.data() || {}));

  const exactQueries = [
    ['userCode', upper],
    ['profileCode', upper],
    ['usernameLower', lower],
    ['username', query],
    ['whatsapp', query],
  ];

  for (const [field, value] of exactQueries) {
    const snap = await db.collection('matchmakingUsers').where(field, '==', value).limit(limit).get();
    snap.forEach((doc) => addUnique(out, buildUserSnapshotFromDoc(doc.id, doc.data() || {})));
  }

  const prefixQueries = [
    ['usernameLower', lower],
    ['userCode', upper],
    ['profileCode', upper],
    ['whatsapp', query],
    ['fullName', query],
  ];

  for (const [field, value] of prefixQueries) {
    try {
      const snap = await db.collection('matchmakingUsers').orderBy(field).startAt(value).endAt(`${value}\uf8ff`).limit(limit).get();
      snap.forEach((doc) => addUnique(out, buildUserSnapshotFromDoc(doc.id, doc.data() || {})));
    } catch {
      // ignore
    }
  }

  if (out.size < limit) {
    try {
      const recent = await db.collection('matchmakingUsers').orderBy('updatedAtMs', 'desc').limit(150).get();
      recent.forEach((doc) => {
        const snapshot = buildUserSnapshotFromDoc(doc.id, doc.data() || {});
        if (matchesNeedle(snapshot, lower)) addUnique(out, snapshot);
      });
    } catch {
      // ignore
    }
  }

  return Array.from(out.values()).filter((item) => matchesNeedle(item, lower)).slice(0, limit);
}

async function searchLeads(db, query, limit) {
  const lower = query.toLowerCase();
  const out = new Map();

  const direct = await db.collection('matchmakingLeads').doc(query).get();
  if (direct.exists) addUnique(out, buildLeadSnapshotFromDoc(direct.id, direct.data() || {}));

  const exactQueries = [
    ['lead.whatsapp', query],
    ['lead.fullName', query],
  ];

  for (const [field, value] of exactQueries) {
    const snap = await db.collection('matchmakingLeads').where(field, '==', value).limit(limit).get();
    snap.forEach((doc) => addUnique(out, buildLeadSnapshotFromDoc(doc.id, doc.data() || {})));
  }

  const prefixQueries = [
    ['lead.whatsapp', query],
    ['lead.fullName', query],
  ];

  for (const [field, value] of prefixQueries) {
    try {
      const snap = await db.collection('matchmakingLeads').orderBy(field).startAt(value).endAt(`${value}\uf8ff`).limit(limit).get();
      snap.forEach((doc) => addUnique(out, buildLeadSnapshotFromDoc(doc.id, doc.data() || {})));
    } catch {
      // ignore
    }
  }

  if (out.size < limit) {
    try {
      const recent = await db.collection('matchmakingLeads').orderBy('updatedAtMs', 'desc').limit(150).get();
      recent.forEach((doc) => {
        const snapshot = buildLeadSnapshotFromDoc(doc.id, doc.data() || {});
        if (matchesNeedle(snapshot, lower)) addUnique(out, snapshot);
      });
    } catch {
      // ignore
    }
  }

  return Array.from(out.values()).filter((item) => matchesNeedle(item, lower)).slice(0, limit);
}

export default async function adminMediationParticipantSearch(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);
    const body = normalizeBody(req);
    const sourceType = normalizeSourceType(body?.sourceType);
    const query = safeStr(body?.query);
    const limit = typeof body?.limit === 'number' && Number.isFinite(body.limit)
      ? Math.max(1, Math.min(15, Math.floor(body.limit)))
      : 8;

    if (query.length < 2) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, items: [] }));
      return;
    }

    const { db } = getAdmin();
    const items = sourceType === 'lead'
      ? await searchLeads(db, query, limit)
      : await searchUsers(db, query, limit);

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, items }));
  } catch (error) {
    res.statusCode = error?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(error?.message || 'server_error') }));
  }
}
