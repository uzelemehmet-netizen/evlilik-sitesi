export function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function safeInt(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.trunc(num) : fallback;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function tsToMs(value) {
  if (!value) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value?.toMillis === 'function') {
    try {
      return value.toMillis();
    } catch {
      return 0;
    }
  }
  const seconds = typeof value?.seconds === 'number' ? value.seconds : typeof value?._seconds === 'number' ? value._seconds : null;
  const nanoseconds =
    typeof value?.nanoseconds === 'number'
      ? value.nanoseconds
      : typeof value?._nanoseconds === 'number'
        ? value._nanoseconds
        : 0;
  if (seconds !== null) return Math.floor(seconds * 1000 + nanoseconds / 1e6);
  return 0;
}

function normalizeTimestampLike(value) {
  const seconds = typeof value?.seconds === 'number' ? value.seconds : typeof value?._seconds === 'number' ? value._seconds : null;
  const nanoseconds =
    typeof value?.nanoseconds === 'number'
      ? value.nanoseconds
      : typeof value?._nanoseconds === 'number'
        ? value._nanoseconds
        : 0;

  if (seconds === null) return null;
  return { seconds, nanoseconds };
}

export function normalizeFirestoreValue(value) {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) return value.map((item) => normalizeFirestoreValue(item));

  if (value instanceof Date) return value.toISOString();

  if (typeof value === 'object') {
    const normalizedTs = normalizeTimestampLike(value);
    if (normalizedTs) return normalizedTs;
    if (typeof value?.toMillis === 'function') {
      const ms = tsToMs(value);
      if (ms > 0) {
        return {
          seconds: Math.floor(ms / 1000),
          nanoseconds: (ms % 1000) * 1e6,
        };
      }
    }

    const out = {};
    for (const [key, innerValue] of Object.entries(value)) {
      out[key] = normalizeFirestoreValue(innerValue);
    }
    return out;
  }

  return value;
}

export function normalizeDoc(id, data) {
  return {
    id: safeStr(id),
    ...(normalizeFirestoreValue(data && typeof data === 'object' ? data : {}) || {}),
  };
}

export function chunkArray(items, size) {
  const list = Array.isArray(items) ? items : [];
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export async function loadUserDocsMap(db, userIds) {
  const uniqueIds = Array.from(new Set((Array.isArray(userIds) ? userIds : []).map((value) => safeStr(value)).filter(Boolean)));
  if (!uniqueIds.length) return {};

  const snaps = await Promise.all(uniqueIds.map((uid) => db.collection('matchmakingUsers').doc(uid).get()));
  const out = {};

  for (let i = 0; i < uniqueIds.length; i += 1) {
    const uid = uniqueIds[i];
    const snap = snaps[i];
    out[uid] = snap.exists ? normalizeFirestoreValue(snap.data() || {}) : null;
  }

  return out;
}

export async function loadLatestApplicationsByUserIds(db, userIds) {
  const uniqueIds = Array.from(new Set((Array.isArray(userIds) ? userIds : []).map((value) => safeStr(value)).filter(Boolean)));
  if (!uniqueIds.length) return {};

  const out = {};
  const groups = chunkArray(uniqueIds, 10);

  for (const group of groups) {
    const snap = await db.collection('matchmakingApplications').where('userId', 'in', group).get();
    for (const doc of snap.docs) {
      const data = doc.data() || {};
      const uid = safeStr(data?.userId);
      if (!uid) continue;
      const current = out[uid];
      const currentMs = current ? tsToMs(current.updatedAt) || tsToMs(current.createdAt) || safeInt(current.createdAtMs, 0) : 0;
      const nextMs = tsToMs(data?.updatedAt) || tsToMs(data?.createdAt) || safeInt(data?.createdAtMs, 0);
      if (!current || nextMs >= currentMs) {
        out[uid] = normalizeDoc(doc.id, data);
      }
    }
  }

  return out;
}