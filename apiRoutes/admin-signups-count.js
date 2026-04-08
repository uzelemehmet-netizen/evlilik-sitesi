import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { hasSubmittedMatchmakingProfileInUserDoc } from './_matchmakingEligibility.js';
import { resolveAdminApplicationState, safeStr } from './_adminMatchmakingProfiles.js';

function safeInt(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function parseDateYYYYMMDD(v) {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return s;
}

function dayStartEndUtcMsTR(dayKey) {
  // TR day boundary UTC+3.
  const offsetMs = 180 * 60 * 1000;
  const [y, m, d] = dayKey.split('-').map((x) => Number(x));
  const startUtcMs = Date.UTC(y, m - 1, d, 0, 0, 0) - offsetMs;
  const endUtcMs = startUtcMs + 24 * 60 * 60 * 1000;
  return { startUtcMs, endUtcMs };
}

function dayKeyTRFromMs(ms) {
  const offsetMs = 180 * 60 * 1000;
  const d = new Date(ms + offsetMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function msFromCreationTime(creationTime) {
  const s = typeof creationTime === 'string' ? creationTime.trim() : '';
  if (!s) return 0;
  const ms = new Date(s).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function chunkArray(values, size = 200) {
  const list = Array.isArray(values) ? values : [];
  const out = [];
  const chunkSize = Math.max(1, Number(size) || 200);
  for (let i = 0; i < list.length; i += chunkSize) out.push(list.slice(i, i + chunkSize));
  return out;
}

function createDayClassification() {
  return {
    authTotal: 0,
    submitted: 0,
    unknown: 0,
    byState: {},
  };
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
    const daysRaw = safeInt(body?.days, 1);
    const days = Math.min(Math.max(daysRaw || 1, 1), 31);
    const dayKey = parseDateYYYYMMDD(body?.dayKey) || dayKeyTRFromMs(Date.now());

    const { auth, db, projectId } = getAdmin();

    const countsByDay = {};
    const scannedByDay = {};
    const classificationByDay = {};

    // We'll scan Auth users once and bucket into days we care about.
    // Works well for small/medium user counts; avoids 31x scans.
    const wantedKeys = [];
    for (let i = 0; i < days; i += 1) {
      const ms = Date.now() - i * 24 * 60 * 60 * 1000;
      wantedKeys.push(dayKeyTRFromMs(ms));
    }

    for (const k of wantedKeys) {
      countsByDay[k] = 0;
      scannedByDay[k] = 0;
      classificationByDay[k] = createDayClassification();
    }

    const ranges = {};
    for (const k of wantedKeys) ranges[k] = dayStartEndUtcMsTR(k);

    let pageToken = undefined;
    let scannedTotal = 0;
    let pages = 0;
    const createdUsers = [];

    for (let page = 0; page < 200; page += 1) {
      pages += 1;
      const result = await auth.listUsers(1000, pageToken);
      const users = Array.isArray(result?.users) ? result.users : [];

      for (const u of users) {
        scannedTotal += 1;
        const createdAtMs = msFromCreationTime(u?.metadata?.creationTime);
        if (!createdAtMs) continue;

        for (const k of wantedKeys) {
          const r = ranges[k];
          if (createdAtMs >= r.startUtcMs && createdAtMs < r.endUtcMs) {
            countsByDay[k] += 1;
            createdUsers.push({ uid: String(u.uid || '').trim(), dayKey: k });
          }
        }
      }

      pageToken = result?.pageToken || null;
      if (!pageToken) break;
    }

    // scannedByDay is informational; total scan size is same
    for (const k of wantedKeys) scannedByDay[k] = scannedTotal;

    if (createdUsers.length) {
      const uniqueUids = Array.from(new Set(createdUsers.map((item) => item.uid).filter(Boolean)));

      const userDocByUid = new Map();
      for (const chunk of chunkArray(uniqueUids, 200)) {
        const refs = chunk.map((uid) => db.collection('matchmakingUsers').doc(uid));
        let snaps = [];
        try {
          snaps = refs.length ? await db.getAll(...refs) : [];
        } catch {
          snaps = await Promise.all(refs.map((ref) => ref.get()));
        }

        for (let i = 0; i < chunk.length; i += 1) {
          const snap = snaps[i];
          userDocByUid.set(chunk[i], snap && snap.exists ? (snap.data() || {}) : null);
        }
      }

      const applicationIds = Array.from(
        new Set(
          uniqueUids
            .map((uid) => {
              const userDoc = userDocByUid.get(uid) || null;
              return safeStr(userDoc?.applicationId) || `auto_${uid}`;
            })
            .filter(Boolean)
        )
      );

      const appDocById = new Map();
      for (const chunk of chunkArray(applicationIds, 200)) {
        const refs = chunk.map((id) => db.collection('matchmakingApplications').doc(id));
        let snaps = [];
        try {
          snaps = refs.length ? await db.getAll(...refs) : [];
        } catch {
          snaps = await Promise.all(refs.map((ref) => ref.get()));
        }

        for (let i = 0; i < chunk.length; i += 1) {
          const snap = snaps[i];
          if (snap && snap.exists) appDocById.set(chunk[i], { id: snap.id, ...(snap.data() || {}) });
        }
      }

      for (const item of createdUsers) {
        const bucket = classificationByDay[item.dayKey] || createDayClassification();
        const userDoc = userDocByUid.get(item.uid) || null;
        const applicationId = safeStr(userDoc?.applicationId) || `auto_${item.uid}`;
        const bestApp =
          appDocById.get(applicationId) ||
          (userDoc?.application && typeof userDoc.application === 'object'
            ? { id: applicationId || null, ...userDoc.application }
            : null);

        const applicationState = resolveAdminApplicationState(userDoc, bestApp);
        const hasSubmittedProfile =
          (!!bestApp && applicationState === 'real') || hasSubmittedMatchmakingProfileInUserDoc(userDoc);

        bucket.authTotal += 1;
        if (hasSubmittedProfile) bucket.submitted += 1;
        else bucket.unknown += 1;
        bucket.byState[applicationState] = (bucket.byState[applicationState] || 0) + 1;
        classificationByDay[item.dayKey] = bucket;
      }
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'no-store');
    res.end(
      JSON.stringify({
        ok: true,
        projectId: projectId || null,
        days,
        dayKeys: wantedKeys,
        countsByDay,
        classificationByDay,
        scannedUsers: scannedTotal,
        pagesScanned: pages,
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
