import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function toNumOrNull(v, { min = -Infinity, max = Infinity } = {}) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (v < min || v > max) return null;
    return v;
  }
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s.replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

function ageFromBirthYearMaybe(v) {
  const year = toNumOrNull(v, { min: 1900, max: 2100 });
  if (year === null) return null;
  const nowYear = new Date().getFullYear();
  const age = nowYear - year;
  return age >= 18 && age <= 99 ? age : null;
}

function ageFromDateMaybe(v) {
  if (!v) return null;
  let d = null;
  if (typeof v === 'number' && Number.isFinite(v)) {
    d = new Date(v);
  } else if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    const parsed = Date.parse(s);
    if (Number.isFinite(parsed)) d = new Date(parsed);
  } else if (typeof v?.toDate === 'function') {
    try {
      d = v.toDate();
    } catch {
      d = null;
    }
  }
  if (!d || Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 18 && age <= 99 ? age : null;
}

function getAge(app) {
  const direct = toNumOrNull(app?.age, { min: 18, max: 99 });
  if (direct !== null) return direct;

  const details = app?.details || {};
  const nested = toNumOrNull(details?.age, { min: 18, max: 99 });
  if (nested !== null) return nested;

  const byYear = ageFromBirthYearMaybe(details?.birthYear ?? app?.birthYear);
  if (byYear !== null) return byYear;

  const byDate =
    ageFromDateMaybe(details?.birthDateMs ?? app?.birthDateMs) ??
    ageFromDateMaybe(details?.birthDate ?? app?.birthDate) ??
    ageFromDateMaybe(details?.dob ?? app?.dob);
  if (byDate !== null) return byDate;

  return null;
}

function tsToMs(v) {
  if (!v) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v?.toMillis === 'function') {
    try {
      return v.toMillis();
    } catch {
      return 0;
    }
  }
  const seconds = typeof v?.seconds === 'number' ? v.seconds : null;
  const nanoseconds = typeof v?.nanoseconds === 'number' ? v.nanoseconds : 0;
  if (seconds !== null) return Math.floor(seconds * 1000 + nanoseconds / 1e6);
  return 0;
}

function lastSeenMsFromUserDoc(userDoc) {
  const ms = typeof userDoc?.lastSeenAtMs === 'number' && Number.isFinite(userDoc.lastSeenAtMs) ? userDoc.lastSeenAtMs : 0;
  if (ms > 0) return ms;
  const ts = tsToMs(userDoc?.lastSeenAt);
  return ts > 0 ? ts : 0;
}

function pickKeys(obj, keys) {
  const out = {};
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);

    const body = normalizeBody(req);
    const limitApps = typeof body?.limitApps === 'number' ? body.limitApps : 400;
    const sampleLimitRaw = typeof body?.sampleLimit === 'number' ? body.sampleLimit : 60;
    const sampleLimit = Math.max(0, Math.min(200, Math.floor(sampleLimitRaw)));

    const { db } = getAdmin();

    const nowMs = Date.now();
    const INACTIVE_TTL_MS = 24 * 60 * 60 * 1000;
    const inactiveCutoffMs = nowMs - INACTIVE_TTL_MS;

    const appsSnap = await db
      .collection('matchmakingApplications')
      .orderBy('createdAt', 'desc')
      .limit(Math.max(50, Math.min(2000, limitApps)))
      .get();

    const apps = appsSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() || {}) }))
      .filter((a) => a?.userId && (a?.gender === 'male' || a?.gender === 'female'));

    const lastRunSnap = await db.collection('matchmakingRuns').doc('last').get();
    const lastRunRaw = lastRunSnap.exists ? lastRunSnap.data() || {} : null;
    const lastRun = lastRunRaw
      ? {
          ok: typeof lastRunRaw?.ok === 'boolean' ? lastRunRaw.ok : null,
          error: safeStr(lastRunRaw?.error),
          triggeredBy: safeStr(lastRunRaw?.triggeredBy),
          startedAtMs: typeof lastRunRaw?.startedAtMs === 'number' ? lastRunRaw.startedAtMs : tsToMs(lastRunRaw?.startedAt),
          finishedAtMs: typeof lastRunRaw?.finishedAtMs === 'number' ? lastRunRaw.finishedAtMs : tsToMs(lastRunRaw?.finishedAt),
          summary: lastRunRaw?.summary && typeof lastRunRaw.summary === 'object' ? lastRunRaw.summary : null,
        }
      : null;

    const uniqueUserIds = Array.from(new Set(apps.map((a) => String(a.userId)).filter(Boolean)));
    const userDocById = new Map();

    const chunks = [];
    for (let i = 0; i < uniqueUserIds.length; i += 10) chunks.push(uniqueUserIds.slice(i, i + 10));

    for (const chunk of chunks) {
      const snap = await db.collection('matchmakingUsers').where('__name__', 'in', chunk).get();
      snap.docs.forEach((d) => userDocById.set(d.id, d.data() || {}));
    }

    const rows = [];

    for (const app of apps) {
      const uid = String(app.userId);
      const u = userDocById.get(uid) || {};

      const gender = safeStr(app.gender);
      const lookingForGender = safeStr(app.lookingForGender) || (gender === 'male' ? 'female' : gender === 'female' ? 'male' : '');

      const lastSeenAtMs = lastSeenMsFromUserDoc(u);
      const createdAtMs = typeof app?.createdAtMs === 'number' ? app.createdAtMs : tsToMs(app?.createdAt);
      const inactive = lastSeenAtMs > 0 ? lastSeenAtMs <= inactiveCutoffMs : createdAtMs > 0 && createdAtMs <= inactiveCutoffMs;

      const lockActive = !!u?.matchmakingLock?.active;
      const blocked = !!u?.blocked;
      const cooldownUntilMs = typeof u?.newMatchCooldownUntilMs === 'number' && Number.isFinite(u.newMatchCooldownUntilMs) ? u.newMatchCooldownUntilMs : 0;

      const rejectedAllAtMs = tsToMs(u?.matchmakingRejectedAllAt);
      const requestedNewMatchAtMs = typeof u?.requestedNewMatchAtMs === 'number' && Number.isFinite(u.requestedNewMatchAtMs) ? u.requestedNewMatchAtMs : 0;

      const newUserSlot = u?.newUserSlot || null;
      const newUserSlotActive = !!newUserSlot?.active;

      const quota = u?.newMatchRequestQuota || {};
      const freeSlotQuota = u?.freeSlotQuota || {};

      // Ürün kararı: pasif/online filtresi eşleşmeyi etkilemez.
      // Admin havuz ekranında pasiflik sadece bilgi amaçlı gösterilir.
      const eligibleOpen = !blocked;
      const hasFreeSlot = eligibleOpen && !lockActive && cooldownUntilMs <= nowMs;

      rows.push({
        userId: uid,
        applicationId: String(app.id),
        username: safeStr(app.username),
        fullName: safeStr(app.fullName),
        gender,
        lookingForGender,
        nationality: safeStr(app.nationality),
        createdAtMs,
        lastSeenAtMs,
        inactive,
        blocked,
        lockActive,
        cooldownUntilMs,
        rejectedAllAtMs,
        requestedNewMatchAtMs,
        newUserSlotActive,
        replacementCredits: typeof u?.newMatchReplacementCredits === 'number' ? u.newMatchReplacementCredits : 0,
        details: pickKeys(app?.details || {}, ['maritalStatus']),
        age: getAge(app),
        eligibleOpen,
        hasFreeSlot,
      });
    }

    const by = {
      open: rows.filter((r) => r.eligibleOpen),
      hasFreeSlot: rows.filter((r) => r.hasFreeSlot),
      blocked: rows.filter((r) => r.blocked),
      inactive: rows.filter((r) => r.inactive),
      cooldown: rows.filter((r) => r.cooldownUntilMs > nowMs),
      locked: rows.filter((r) => r.lockActive),
      rejectedAll: rows.filter((r) => r.rejectedAllAtMs > 0),
      renewed: rows.filter((r) => r.requestedNewMatchAtMs > 0 || r.newUserSlotActive || (r.replacementCredits || 0) > 0),
    };

    // payload'ı şişirmemek için her kategoriden örnekle
    const cap = (arr) => arr.slice(0, sampleLimit);

    const lite = (r) =>
      pickKeys(r, [
        'userId',
        'applicationId',
        'gender',
        'lookingForGender',
        'age',
        'lastSeenAtMs',
        'inactive',
        'blocked',
        'lockActive',
        'cooldownUntilMs',
        'rejectedAllAtMs',
        'requestedNewMatchAtMs',
        'newUserSlotActive',
        'replacementCredits',
        'eligibleOpen',
        'hasFreeSlot',
        'details',
      ]);

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'no-store');
    res.end(
      JSON.stringify({
        ok: true,
        meta: {
          nowMs,
          inactiveCutoffMs,
          totalApplications: apps.length,
          totalUsers: uniqueUserIds.length,
          sampleLimit,
        },
        lastRun,
        counts: Object.fromEntries(Object.entries(by).map(([k, v]) => [k, v.length])),
        sample: {
          open: cap(by.open).map(lite),
          hasFreeSlot: cap(by.hasFreeSlot).map(lite),
          rejectedAll: cap(by.rejectedAll).map(lite),
          renewed: cap(by.renewed).map(lite),
          blocked: cap(by.blocked).map(lite),
          inactive: cap(by.inactive).map(lite),
          cooldown: cap(by.cooldown).map(lite),
          locked: cap(by.locked).map(lite),
        },
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
