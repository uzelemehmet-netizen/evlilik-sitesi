import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { buildLeadSnapshotFromDoc, buildUserSnapshotFromDoc, safeStr } from './_adminMediation.js';

function clampLimit(value, fallback, max) {
  const num = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.max(1, Math.min(max, num));
}

function candidateFromSnapshot(snapshot, sourceKind, activeMatch) {
  const fullName = safeStr(snapshot?.fullName);
  const city = safeStr(snapshot?.city);
  const whatsapp = safeStr(snapshot?.whatsapp);
  return {
    sourceType: safeStr(snapshot?.sourceType) || 'user',
    sourceKind,
    refId: safeStr(snapshot?.refId),
    label: safeStr(snapshot?.label) || safeStr(snapshot?.userCode) || safeStr(snapshot?.username) || fullName || safeStr(snapshot?.refId),
    subLabel: [fullName, city, whatsapp].filter(Boolean).join(' · '),
    fullName,
    username: safeStr(snapshot?.username),
    userCode: safeStr(snapshot?.userCode),
    profileCode: safeStr(snapshot?.profileCode),
    city,
    whatsapp,
    gender: safeStr(snapshot?.gender),
    age: typeof snapshot?.age === 'number' ? snapshot.age : null,
    photoUrl: safeStr(snapshot?.photoUrl),
    photoUrls: Array.isArray(snapshot?.photoUrls) ? snapshot.photoUrls.filter(Boolean) : [],
    activeMatch: !!activeMatch,
    activeMatchId: safeStr(activeMatch?.id),
    activeMatchLabel: safeStr(activeMatch?.label),
  };
}

function buildActiveMatchMap(items) {
  const out = new Map();
  for (const item of items) {
    const participants = item?.participants && typeof item.participants === 'object' ? item.participants : {};
    for (const key of ['a', 'b']) {
      const participant = participants[key] && typeof participants[key] === 'object' ? participants[key] : null;
      const sourceType = safeStr(participant?.sourceType) || 'user';
      const refId = safeStr(participant?.refId);
      if (!refId) continue;
      const mapKey = `${sourceType}:${refId}`;
      if (out.has(mapKey)) continue;
      out.set(mapKey, {
        id: safeStr(item?.id),
        label: [safeStr(participants?.a?.label), safeStr(participants?.b?.label)].filter(Boolean).join(' ↔ '),
      });
    }
  }
  return out;
}

export default async function adminMediationCandidatesList(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);
    const body = normalizeBody(req);
    const userLimit = body?.userLimit === undefined ? 0 : clampLimit(body?.userLimit, 24, 60);
    const leadLimit = clampLimit(body?.leadLimit, 24, 60);
    const { db } = getAdmin();

    const [activeMatchesSnap, usersSnap, allRecentLeadsSnap, manualLeadsSnap] = await Promise.all([
      db.collection('matchmakingMediationMatches').where('status', '==', 'active').limit(400).get(),
      userLimit > 0 ? db.collection('matchmakingUsers').orderBy('updatedAtMs', 'desc').limit(userLimit).get() : Promise.resolve({ docs: [] }),
      db.collection('matchmakingLeads').orderBy('createdAtMs', 'desc').limit(Math.max(leadLimit * 5, 80)).get(),
      db.collection('matchmakingLeads').where('source', '==', 'admin_manual_mediation').orderBy('createdAtMs', 'desc').limit(leadLimit).get(),
    ]);

    const activeMatches = activeMatchesSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
    const activeMap = buildActiveMatchMap(activeMatches);

    const users = usersSnap.docs.map((doc) => {
      const snapshot = buildUserSnapshotFromDoc(doc.id, doc.data() || {});
      return candidateFromSnapshot(snapshot, 'user', activeMap.get(`user:${snapshot.refId}`));
    });

    const formLeads = [];
    for (const doc of allRecentLeadsSnap.docs) {
      const data = doc.data() || {};
      if (safeStr(data?.source) === 'admin_manual_mediation') continue;
      const snapshot = buildLeadSnapshotFromDoc(doc.id, data);
      formLeads.push(candidateFromSnapshot(snapshot, 'form', activeMap.get(`lead:${snapshot.refId}`)));
      if (formLeads.length >= leadLimit) break;
    }

    const manualLeads = manualLeadsSnap.docs.map((doc) => {
      const snapshot = buildLeadSnapshotFromDoc(doc.id, doc.data() || {});
      return candidateFromSnapshot(snapshot, 'manual', activeMap.get(`lead:${snapshot.refId}`));
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, users, formLeads, manualLeads }));
  } catch (error) {
    res.statusCode = error?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(error?.message || 'server_error') }));
  }
}