function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function safeNum(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = safeStr(value);
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function asObj(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeGender(value) {
  const normalized = safeStr(value).toLowerCase();
  if (normalized === 'female' || normalized === 'f' || normalized === 'woman' || normalized === 'kadin' || normalized === 'kadın') {
    return 'female';
  }
  if (normalized === 'male' || normalized === 'm' || normalized === 'man' || normalized === 'erkek') return 'male';
  return '';
}

function normalizeSourceType(value) {
  const normalized = safeStr(value).toLowerCase();
  return normalized === 'lead' ? 'lead' : 'user';
}

function normalizeStatus(value) {
  const normalized = safeStr(value).toLowerCase();
  if (normalized === 'ended') return 'ended';
  return 'active';
}

function normalizeReasonCode(value) {
  const normalized = safeStr(value).toLowerCase();
  if (
    normalized === 'uyumsuzluk' ||
    normalized === 'cevap_yok' ||
    normalized === 'aile_istemedi' ||
    normalized === 'iletisim_koptu' ||
    normalized === 'baska_biriyle_ilerledi' ||
    normalized === 'admin_sonlandirdi' ||
    normalized === 'evlilik_surecine_girdi' ||
    normalized === 'diger'
  ) {
    return normalized;
  }
  return 'diger';
}

function pickFirstString(...values) {
  for (const value of values) {
    const normalized = safeStr(value);
    if (normalized) return normalized;
  }
  return '';
}

function pickFirstNumber(...values) {
  for (const value of values) {
    const normalized = safeNum(value);
    if (normalized !== null) return normalized;
  }
  return null;
}

function normalizePhotoUrls(...sources) {
  const out = [];
  for (const source of sources) {
    const arr = Array.isArray(source) ? source : [];
    for (const item of arr) {
      const url = safeStr(item);
      if (!url) continue;
      if (!/^(https?:|data:|\/)/i.test(url)) continue;
      if (!out.includes(url)) out.push(url);
    }
  }
  return out.slice(0, 5);
}

function buildParticipantLabel(snapshot) {
  const userCode = safeStr(snapshot?.userCode);
  const username = safeStr(snapshot?.username);
  const fullName = safeStr(snapshot?.fullName);
  if (userCode && username) return `${userCode} @${username}`;
  if (userCode) return userCode;
  if (username) return `@${username}`;
  if (fullName) return fullName;
  return safeStr(snapshot?.refId);
}

function buildUserSnapshotFromDoc(refId, data) {
  const root = asObj(data);
  const application = asObj(root?.application);
  const publicProfile = asObj(root?.publicProfile);
  const details = asObj(application?.details || root?.details || publicProfile?.details);
  const photoUrls = normalizePhotoUrls(
    root?.photoUrls,
    application?.photoUrls,
    publicProfile?.photoUrls,
    root?.photoPaths,
    application?.photoPaths,
    publicProfile?.photoPaths
  );

  const snapshot = {
    sourceType: 'user',
    refId: safeStr(refId),
    fullName: pickFirstString(root?.fullName, application?.fullName, publicProfile?.fullName, details?.fullName),
    username: pickFirstString(root?.username, application?.username, publicProfile?.username),
    userCode: pickFirstString(root?.userCode, application?.userCode, publicProfile?.userCode),
    profileCode: pickFirstString(root?.profileCode, application?.profileCode, publicProfile?.profileCode),
    age: pickFirstNumber(root?.age, application?.age, publicProfile?.age, details?.age),
    city: pickFirstString(root?.city, application?.city, publicProfile?.city, details?.city),
    country: pickFirstString(root?.country, application?.country, publicProfile?.country),
    nationality: pickFirstString(root?.nationality, application?.nationality, publicProfile?.nationality),
    whatsapp: pickFirstString(root?.whatsapp, application?.whatsapp, publicProfile?.whatsapp, details?.whatsapp),
    gender: normalizeGender(root?.gender || application?.gender || publicProfile?.gender || details?.gender),
    photoUrls,
    photoUrl: photoUrls[0] || '',
    sourceLabel: 'user',
  };
  snapshot.label = buildParticipantLabel(snapshot);
  return snapshot;
}

function buildLeadSnapshotFromDoc(refId, data) {
  const root = asObj(data);
  const lead = asObj(root?.lead);
  const photoUrls = normalizePhotoUrls(lead?.photoUrls, [lead?.photoUrl]);
  const snapshot = {
    sourceType: 'lead',
    refId: safeStr(refId),
    fullName: pickFirstString(lead?.fullName),
    username: '',
    userCode: '',
    profileCode: '',
    age: pickFirstNumber(lead?.age),
    city: pickFirstString(lead?.city),
    country: pickFirstString(lead?.plannedLivingCountry),
    nationality: '',
    whatsapp: pickFirstString(lead?.whatsapp),
    gender: normalizeGender(lead?.gender),
    photoUrls,
    photoUrl: photoUrls[0] || '',
    sourceLabel: safeStr(root?.source) || 'lead',
    note: pickFirstString(root?.admin?.note, lead?.additionalInfoText),
  };
  snapshot.label = buildParticipantLabel(snapshot);
  return snapshot;
}

async function findUserByIdentifier(db, identifier) {
  const raw = safeStr(identifier);
  if (!raw) return null;

  const direct = await db.collection('matchmakingUsers').doc(raw).get();
  if (direct.exists) return { refId: direct.id, data: direct.data() || {} };

  const tries = [
    ['userCode', raw.toUpperCase()],
    ['profileCode', raw.toUpperCase()],
    ['usernameLower', raw.toLowerCase()],
    ['username', raw],
    ['whatsapp', raw],
  ];

  for (const [field, value] of tries) {
    const snap = await db.collection('matchmakingUsers').where(field, '==', value).limit(2).get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      return { refId: doc.id, data: doc.data() || {} };
    }
  }

  return null;
}

async function findLeadByIdentifier(db, identifier) {
  const raw = safeStr(identifier);
  if (!raw) return null;

  const direct = await db.collection('matchmakingLeads').doc(raw).get();
  if (direct.exists) return { refId: direct.id, data: direct.data() || {} };

  const tries = [
    ['lead.whatsapp', raw],
    ['lead.fullName', raw],
  ];

  for (const [field, value] of tries) {
    const snap = await db.collection('matchmakingLeads').where(field, '==', value).limit(2).get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      return { refId: doc.id, data: doc.data() || {} };
    }
  }

  return null;
}

async function resolveParticipantByIdentifier(db, sourceType, identifier) {
  const normalizedType = normalizeSourceType(sourceType);
  const resolved = normalizedType === 'lead'
    ? await findLeadByIdentifier(db, identifier)
    : await findUserByIdentifier(db, identifier);

  if (!resolved) return null;

  return normalizedType === 'lead'
    ? buildLeadSnapshotFromDoc(resolved.refId, resolved.data)
    : buildUserSnapshotFromDoc(resolved.refId, resolved.data);
}

async function getParticipantSnapshotByRef(db, sourceType, refId) {
  const normalizedType = normalizeSourceType(sourceType);
  const id = safeStr(refId);
  if (!id) return null;

  const doc = await db.collection(normalizedType === 'lead' ? 'matchmakingLeads' : 'matchmakingUsers').doc(id).get();
  if (!doc.exists) return null;

  return normalizedType === 'lead'
    ? buildLeadSnapshotFromDoc(doc.id, doc.data() || {})
    : buildUserSnapshotFromDoc(doc.id, doc.data() || {});
}

async function createManualMediationLead(db, payload, adminEmail) {
  const now = Date.now();
  const photoUrls = normalizePhotoUrls(
    Array.isArray(payload?.photoUrls) ? payload.photoUrls : [],
    safeStr(payload?.photoUrl) ? [payload.photoUrl] : []
  );
  const lead = {
    gender: normalizeGender(payload?.gender),
    fullName: safeStr(payload?.fullName),
    age: pickFirstNumber(payload?.age),
    city: safeStr(payload?.city),
    whatsapp: safeStr(payload?.whatsapp),
    plannedLivingCountry: safeStr(payload?.country),
    occupation: safeStr(payload?.occupation),
    maritalStatus: safeStr(payload?.maritalStatus),
    additionalInfoText: safeStr(payload?.note),
    photoUrls,
    photoUrl: photoUrls[0] || '',
  };

  const ref = db.collection('matchmakingLeads').doc();
  const doc = {
    status: 'new',
    source: 'admin_manual_mediation',
    createdAtMs: now,
    updatedAtMs: now,
    lead,
    admin: {
      createdByEmail: safeStr(adminEmail),
      createdAtMs: now,
      note: safeStr(payload?.note),
    },
  };

  await ref.set(doc);
  return buildLeadSnapshotFromDoc(ref.id, doc);
}

function mapMediationMatchRecord(docId, data) {
  const root = asObj(data);
  const participants = asObj(root?.participants);
  const a = asObj(participants?.a);
  const b = asObj(participants?.b);

  return {
    id: safeStr(docId),
    status: normalizeStatus(root?.status),
    matchedAtMs: pickFirstNumber(root?.matchedAtMs, root?.createdAtMs) || 0,
    endedAtMs: pickFirstNumber(root?.endedAtMs) || 0,
    endReasonCode: normalizeReasonCode(root?.endReasonCode),
    endReasonNote: safeStr(root?.endReasonNote),
    createdAtMs: pickFirstNumber(root?.createdAtMs) || 0,
    updatedAtMs: pickFirstNumber(root?.updatedAtMs, root?.matchedAtMs, root?.createdAtMs) || 0,
    createdByEmail: safeStr(root?.createdByEmail),
    note: safeStr(root?.note),
    participants: {
      a: {
        ...a,
        sourceType: normalizeSourceType(a?.sourceType),
        refId: safeStr(a?.refId),
        fullName: safeStr(a?.fullName),
        username: safeStr(a?.username),
        userCode: safeStr(a?.userCode),
        profileCode: safeStr(a?.profileCode),
        age: pickFirstNumber(a?.age),
        city: safeStr(a?.city),
        country: safeStr(a?.country),
        nationality: safeStr(a?.nationality),
        whatsapp: safeStr(a?.whatsapp),
        gender: normalizeGender(a?.gender),
        photoUrls: normalizePhotoUrls(a?.photoUrls, [a?.photoUrl]),
        photoUrl: safeStr(a?.photoUrl),
        label: safeStr(a?.label) || buildParticipantLabel(a),
      },
      b: {
        ...b,
        sourceType: normalizeSourceType(b?.sourceType),
        refId: safeStr(b?.refId),
        fullName: safeStr(b?.fullName),
        username: safeStr(b?.username),
        userCode: safeStr(b?.userCode),
        profileCode: safeStr(b?.profileCode),
        age: pickFirstNumber(b?.age),
        city: safeStr(b?.city),
        country: safeStr(b?.country),
        nationality: safeStr(b?.nationality),
        whatsapp: safeStr(b?.whatsapp),
        gender: normalizeGender(b?.gender),
        photoUrls: normalizePhotoUrls(b?.photoUrls, [b?.photoUrl]),
        photoUrl: safeStr(b?.photoUrl),
        label: safeStr(b?.label) || buildParticipantLabel(b),
      },
    },
  };
}

export {
  buildLeadSnapshotFromDoc,
  buildUserSnapshotFromDoc,
  createManualMediationLead,
  getParticipantSnapshotByRef,
  mapMediationMatchRecord,
  normalizeReasonCode,
  normalizeSourceType,
  normalizeStatus,
  resolveParticipantByIdentifier,
  safeStr,
};