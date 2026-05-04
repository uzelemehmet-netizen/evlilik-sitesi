import { getAdmin, isAdminEmail, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { hasSubmittedMatchmakingProfileInUserDoc } from './_matchmakingEligibility.js';
import { maskEmail, maskPhoneLike } from './_pii.js';
import { isSyntheticTestUserRecord } from './_syntheticTestUser.js';
import { isPhotoModerationRestricted } from '../src/utils/photoModerationState.js';
import {
  hasMeaningfulApplicationCache,
  hasMeaningfulProfileCache,
  loadApplicationsForUid,
  normalizeGender,
  parseAge,
  pickBestApp,
  resolveAdminApplicationState,
  safeStr,
  toMs,
} from './_adminMatchmakingProfiles.js';

function pickDetailsFromUserDocOrApp(userDoc, bestApp) {
  const d = userDoc && typeof userDoc === 'object' ? userDoc : null;
  const appSnap = d?.application && typeof d.application === 'object' ? d.application : null;
  const detailsFromUserCache = appSnap?.details && typeof appSnap.details === 'object' ? appSnap.details : null;
  const detailsFromBestApp = bestApp?.details && typeof bestApp.details === 'object' ? bestApp.details : null;
  // Prefer user cache values, but fill missing keys from the best application.
  // This prevents admin panel showing blanks when matchmakingUsers.application.details is stale/partial.
  if (detailsFromUserCache && detailsFromBestApp) {
    return { ...detailsFromBestApp, ...detailsFromUserCache };
  }
  return detailsFromUserCache || detailsFromBestApp || null;
}

function pickOccupationLabel(details) {
  const it = details && typeof details === 'object' ? details : null;
  if (!it) return null;
  return (
    safeStr(it?.occupationTr) ||
    safeStr(it?.occupation) ||
    safeStr(it?.occupationId) ||
    // Backward/alternate keys
    safeStr(it?.job) ||
    safeStr(it?.jobTitle) ||
    safeStr(it?.profession) ||
    null
  );
}

function pickMaritalStatus(details) {
  const it = details && typeof details === 'object' ? details : null;
  if (!it) return null;
  return safeStr(it?.maritalStatus) || safeStr(it?.marital) || safeStr(it?.medeniDurum) || safeStr(it?.marital_status) || null;
}

function pickHasChildren(details) {
  const it = details && typeof details === 'object' ? details : null;
  if (!it) return null;
  const raw = safeStr(it?.hasChildren) || safeStr(it?.children) || safeStr(it?.childStatus) || safeStr(it?.has_children);
  if (raw) return raw;
  // Backward compatible: some payloads used boolean.
  if (typeof it?.hasChildren === 'boolean') return it.hasChildren ? 'yes' : 'no';
  return null;
}

function pickChildrenCount(details) {
  const it = details && typeof details === 'object' ? details : null;
  if (!it) return null;
  const raw =
    it?.childrenCount ??
    it?.childCount ??
    it?.children_count ??
    it?.child_count;
  const n = typeof raw === 'number' ? raw : Number(String(raw ?? '').trim());
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < 0 || i > 20) return null;
  return i;
}

function pickChildrenLivingSituation(details) {
  const it = details && typeof details === 'object' ? details : null;
  if (!it) return null;
  return (
    safeStr(it?.childrenLivingSituation) ||
    safeStr(it?.children_living_situation) ||
    safeStr(it?.childrenLivingWith) ||
    safeStr(it?.children_living_with) ||
    null
  );
}

function pickWhatsapp(userDoc, bestApp) {
  try {
    const u = userDoc && typeof userDoc === 'object' ? userDoc : null;
    const a = bestApp && typeof bestApp === 'object' ? bestApp : null;

    // Prefer top-level whatsapp on application docs.
    const v =
      safeStr(u?.application?.whatsapp) ||
      safeStr(u?.whatsapp) ||
      safeStr(a?.whatsapp) ||
      safeStr(a?.application?.whatsapp) ||
      // Backward/alternate keys
      safeStr(u?.details?.whatsapp) ||
      safeStr(u?.application?.details?.whatsapp) ||
      safeStr(a?.details?.whatsapp) ||
      safeStr(a?.application?.details?.whatsapp) ||
      '';

    // Basic sanity: keep it short; don't try to normalize here.
    if (!v) return null;
    if (v.length > 80) return v.slice(0, 80);
    return v;
  } catch {
    return null;
  }
}

function dateStringToMs(s) {
  try {
    const raw = safeStr(s);
    if (!raw) return 0;
    const d = new Date(raw);
    const n = d.getTime();
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function parseIntSafe(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v || '').trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function chunkArray(values, size) {
  const out = [];
  const list = Array.isArray(values) ? values : [];
  const chunkSize = Math.max(1, parseIntSafe(size, 200) || 200);
  for (let i = 0; i < list.length; i += chunkSize) out.push(list.slice(i, i + chunkSize));
  return out;
}

function parseOffsetPageToken(pageToken) {
  const raw = safeStr(pageToken);
  if (!raw) return 0;
  if (!raw.startsWith('offset:')) return 0;
  const n = parseIntSafe(raw.slice('offset:'.length), 0);
  return Math.max(0, n || 0);
}

function encodeOffsetPageToken(offset) {
  const n = parseIntSafe(offset, 0);
  if (!n || n <= 0) return null;
  return `offset:${n}`;
}

async function listAllAuthUsers(auth) {
  const records = [];
  let nextPageToken;

  do {
    const result = await auth.listUsers(1000, nextPageToken);
    const users = Array.isArray(result?.users) ? result.users : [];
    records.push(...users);
    nextPageToken = safeStr(result?.pageToken) || '';
  } while (nextPageToken);

  return records;
}

async function loadDocDataMap(db, collectionName, ids, chunkSize = 200) {
  const result = new Map();
  const chunks = chunkArray(ids, chunkSize);

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
      result.set(chunk[i], snap && snap.exists ? (snap.data() || {}) : null);
    }
  }

  return result;
}

function sortAdminUsersByCreatedDesc(users) {
  const list = Array.isArray(users) ? [...users] : [];
  list.sort((a, b) => {
    const am = typeof a?.createdAtMs === 'number' && Number.isFinite(a.createdAtMs) ? a.createdAtMs : 0;
    const bm = typeof b?.createdAtMs === 'number' && Number.isFinite(b.createdAtMs) ? b.createdAtMs : 0;
    if (am !== bm) return bm - am;
    return String(a?.uid || '').localeCompare(String(b?.uid || ''));
  });
  return list;
}

async function queryRecentDocs(db, collectionName, field, limit) {
  try {
    return await db.collection(collectionName).orderBy(field, 'desc').limit(limit).get();
  } catch {
    return null;
  }
}

function collectUidCandidate(set, value, excluded = null) {
  const uid = safeStr(value);
  if (!uid) return;
  if (excluded && excluded.has(uid)) return;
  set.add(uid);
}

function isMembershipActive(userDoc, now = Date.now()) {
  const m = userDoc?.membership || null;
  if (!m || !m.active) return false;
  const until = typeof m.validUntilMs === 'number' ? m.validUntilMs : 0;
  return until > now;
}

function pickPushEnabled(userDoc) {
  return userDoc?.push?.enabled === true;
}

function pickPushEnabledAtMs(userDoc) {
  const ms = userDoc?.push?.updatedAtMs;
  return typeof ms === 'number' && Number.isFinite(ms) && ms > 0 ? ms : null;
}

function pickPwaInstalled(userDoc) {
  const ms = userDoc?.pwa?.lastStandaloneAtMs;
  return typeof ms === 'number' && Number.isFinite(ms) && ms > 0;
}

function pickPwaInstalledAtMs(userDoc) {
  const ms = userDoc?.pwa?.lastStandaloneAtMs;
  return typeof ms === 'number' && Number.isFinite(ms) && ms > 0 ? ms : null;
}

function looksLikeUserCode(q) {
  const s = safeStr(q);
  if (!s) return false;
  return s.toUpperCase().startsWith('UC-');
}

function getUserDocEmail(userDoc) {
  return safeStr(userDoc?.authEmailLower || userDoc?.authEmail).toLowerCase();
}

async function findSingleUserDocByAnyEmail(db, candidates) {
  const emails = Array.from(new Set((Array.isArray(candidates) ? candidates : []).map((value) => safeStr(value).toLowerCase()).filter(Boolean)));
  if (!emails.length) return null;

  const fields = ['authEmailLower', 'emailLower', 'authEmail', 'email'];
  for (const email of emails) {
    for (const field of fields) {
      try {
        const snap = await db.collection('matchmakingUsers').where(field, '==', email).limit(1).get();
        if (!snap.empty) {
          const doc = snap.docs[0];
          return { uid: safeStr(doc.id), userDoc: doc.data() || null };
        }
      } catch {
        // ignore and continue fallback search
      }
    }
  }

  return null;
}

async function findBestApplicationByAnyEmail(db, candidates) {
  const emails = Array.from(new Set((Array.isArray(candidates) ? candidates : []).map((value) => safeStr(value).toLowerCase()).filter(Boolean)));
  if (!emails.length) return null;

  const fields = ['authEmailLower', 'emailLower', 'authEmail', 'email'];
  for (const email of emails) {
    for (const field of fields) {
      try {
        const snap = await db.collection('matchmakingApplications').where(field, '==', email).limit(10).get();
        if (!snap.empty) {
          const apps = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
          const bestApp = pickBestApp(apps);
          const resolvedUid = safeStr(bestApp?.userId) || safeStr(bestApp?.uid) || safeStr(bestApp?.userUid) || safeStr(bestApp?.ownerUid);
          if (resolvedUid) {
            return { uid: resolvedUid, bestApp };
          }
        }
      } catch {
        // ignore and continue fallback search
      }
    }
  }

  return null;
}

function hasEndUserProfileSignals(userDoc) {
  const d = userDoc && typeof userDoc === 'object' ? userDoc : null;
  if (!d) return false;
  if (safeStr(d?.userCode) || safeStr(d?.fullName) || safeStr(d?.applicationId)) return true;
  if (hasMeaningfulApplicationCache(d) || hasMeaningfulProfileCache(d)) return true;
  if (d?.membership && typeof d.membership === 'object') return true;
  return false;
}

function isAdminOnlyAccount({ userRecord = null, userDoc = null, entry = null } = {}) {
  const email = entry?.email || userRecord?.email || getUserDocEmail(userDoc);
  if (!isAdminEmail(email)) return false;
  return !hasEndUserProfileSignals(userDoc);
}

function buildCachedBestApp(userDoc) {
  const d = userDoc && typeof userDoc === 'object' ? userDoc : null;
  if (!d || !hasMeaningfulApplicationCache(d)) return null;

  const applicationId = typeof d?.applicationId === 'string' ? safeStr(d.applicationId) : '';
  const application = d?.application && typeof d.application === 'object' ? d.application : null;
  if (!applicationId || !application) return null;

  return {
    id: applicationId,
    ...application,
  };
}

function hasPersistedAuthTrace(userDoc, bestApp = null) {
  const user = userDoc && typeof userDoc === 'object' ? userDoc : null;
  const app = bestApp && typeof bestApp === 'object' ? bestApp : null;

  return [
    user?.authEmailLower,
    user?.authEmail,
    user?.authProvider,
    app?.authEmailLower,
    app?.authEmail,
    app?.authProvider,
  ].some((value) => !!safeStr(value));
}

function shouldLoadLiveBestApp(userDoc, cachedBestApp = null) {
  const d = userDoc && typeof userDoc === 'object' ? userDoc : null;
  if (!d) return true;
  const cached = cachedBestApp || buildCachedBestApp(d);
  if (cached) {
    return resolveAdminApplicationState(d, cached) !== 'real';
  }
  if (!hasMeaningfulProfileCache(d)) return true;
  return !!safeStr(d?.applicationId);
}

async function loadBestAppsFromApplicationIds(db, usersByUid) {
  const entries = Array.isArray(usersByUid) ? usersByUid : [];
  const pairs = entries
    .map(({ uid, userDoc }) => ({
      uid: safeStr(uid),
      applicationId: safeStr(userDoc?.applicationId),
    }))
    .filter((item) => item.uid && item.applicationId);

  const refs = pairs.map((item) => db.collection('matchmakingApplications').doc(item.applicationId));
  let snaps = [];
  try {
    snaps = refs.length ? await db.getAll(...refs) : [];
  } catch {
    snaps = await Promise.all(refs.map((ref) => ref.get()));
  }

  const result = new Map();
  for (let i = 0; i < pairs.length; i += 1) {
    const pair = pairs[i];
    const snap = snaps[i];
    if (!pair?.uid || !snap?.exists) continue;
    result.set(pair.uid, { id: snap.id, ...(snap.data() || {}) });
  }
  return result;
}

async function buildAdminUserEntry({ auth, db, uid, userRecord = null, userDoc = undefined, bestApp = undefined }) {
  const resolvedUid = safeStr(uid);
  if (!resolvedUid) return null;

  let resolvedUserRecord = userRecord;
  if (resolvedUserRecord === null) {
    // keep null
  } else if (!resolvedUserRecord) {
    try {
      resolvedUserRecord = await auth.getUser(resolvedUid);
    } catch (e) {
      const code = String(e?.code || '');
      if (!code.includes('auth/user-not-found')) throw e;
      resolvedUserRecord = null;
    }
  }

  let resolvedUserDoc = typeof userDoc === 'undefined' ? undefined : userDoc;
  let flags = null;
  if (typeof resolvedUserDoc === 'undefined') {
    const userRef = db.collection('matchmakingUsers').doc(resolvedUid);
    const flagRef = db.collection('adminUserFlags').doc(resolvedUid);
    const [userSnap, flagSnap] = await Promise.all([userRef.get(), flagRef.get()]);
    resolvedUserDoc = userSnap.exists ? (userSnap.data() || {}) : null;
    flags = flagSnap.exists ? (flagSnap.data() || {}) : null;
  } else {
    const flagSnap = await db.collection('adminUserFlags').doc(resolvedUid).get();
    flags = flagSnap.exists ? (flagSnap.data() || {}) : null;
  }

  if (isAdminOnlyAccount({ userRecord: resolvedUserRecord, userDoc: resolvedUserDoc })) return null;

  const cachedBestApp = buildCachedBestApp(resolvedUserDoc);
  let resolvedBestApp = typeof bestApp === 'undefined' ? undefined : bestApp;
  if (typeof resolvedBestApp === 'undefined') {
    if (shouldLoadLiveBestApp(resolvedUserDoc, cachedBestApp)) {
      try {
        const apps = await loadApplicationsForUid(db, resolvedUid, {
          applicationId: resolvedUserDoc?.applicationId,
          limitPerField: 25,
        });
        resolvedBestApp = pickBestApp(apps) || cachedBestApp || null;
      } catch {
        resolvedBestApp = cachedBestApp || null;
      }
    } else {
      resolvedBestApp = cachedBestApp || null;
    }
  }

  if (
    isSyntheticTestUserRecord({
      uid: resolvedUid,
      email: resolvedUserRecord?.email || '',
      user: resolvedUserDoc,
      application: resolvedBestApp,
    })
  ) {
    return null;
  }

  const now = Date.now();
  const membershipActive = resolvedUserDoc ? isMembershipActive(resolvedUserDoc, now) : false;
  const untilMs =
    resolvedUserDoc && typeof resolvedUserDoc?.membership?.validUntilMs === 'number'
      ? resolvedUserDoc.membership.validUntilMs
      : 0;
  const plan = resolvedUserDoc && typeof resolvedUserDoc?.membership?.plan === 'string' ? resolvedUserDoc.membership.plan : '';
  const applicationId = resolvedUserDoc && typeof resolvedUserDoc?.applicationId === 'string' ? safeStr(resolvedUserDoc.applicationId) : '';
  const effectiveApplicationId = applicationId || (resolvedBestApp?.id ? String(resolvedBestApp.id) : '');
  const applicationState = resolveAdminApplicationState(resolvedUserDoc, resolvedBestApp);
  const hasSubmittedProfile = !!(resolvedBestApp && applicationState === 'real') || hasSubmittedMatchmakingProfileInUserDoc(resolvedUserDoc);
  const hasApplication = applicationState === 'real' || applicationState === 'partial' || applicationState === 'stub' || applicationState === 'cache' || applicationState === 'stub_cache';
  const hasProfileData = applicationState !== 'none';

  const details = pickDetailsFromUserDocOrApp(resolvedUserDoc, resolvedBestApp);
  const occupation = pickOccupationLabel(details);
  const maritalStatus = pickMaritalStatus(details);
  const hasChildren = pickHasChildren(details);
  const childrenCount = pickChildrenCount(details);
  const childrenLivingSituation = pickChildrenLivingSituation(details);
  const whatsapp = pickWhatsapp(resolvedUserDoc, resolvedBestApp);
  const authCreatedAtMs = resolvedUserRecord ? dateStringToMs(resolvedUserRecord.metadata?.creationTime) : 0;
  const authLastSignInAtMs = resolvedUserRecord ? dateStringToMs(resolvedUserRecord.metadata?.lastSignInTime) : 0;
  const userCreatedAtMs = toMs(resolvedUserDoc?.createdAt) || (typeof resolvedUserDoc?.createdAtMs === 'number' ? resolvedUserDoc.createdAtMs : 0);
  const userUpdatedAtMs = toMs(resolvedUserDoc?.updatedAt) || (typeof resolvedUserDoc?.updatedAtMs === 'number' ? resolvedUserDoc.updatedAtMs : 0);
  const appCreatedAtMs = toMs(resolvedBestApp?.createdAt) || (typeof resolvedBestApp?.createdAtMs === 'number' ? resolvedBestApp.createdAtMs : 0);
  const lastSeenAtMs = toMs(resolvedUserDoc?.lastSeenAt) || (typeof resolvedUserDoc?.lastSeenAtMs === 'number' ? resolvedUserDoc.lastSeenAtMs : 0);
  const persistedAuthTrace = hasPersistedAuthTrace(resolvedUserDoc, resolvedBestApp);

  return {
    uid: resolvedUid,
    hasAuthRecord: !!resolvedUserRecord,
    hasPersistedAuthTrace: persistedAuthTrace,
    email: resolvedUserRecord?.email ? maskEmail(resolvedUserRecord.email) : null,
    disabled: !!resolvedUserRecord?.disabled,
    createdAtMs: authCreatedAtMs || userCreatedAtMs || userUpdatedAtMs || appCreatedAtMs || null,
    lastSignInAtMs: authLastSignInAtMs || lastSeenAtMs || null,
    lastSeenAtMs: lastSeenAtMs || null,
    systemUser: !!flags?.systemUser,
    blocked: !!resolvedUserDoc?.blocked,
    membershipActive,
    membershipPlan: plan || null,
    membershipValidUntilMs: untilMs || null,
    hasUserDoc: !!resolvedUserDoc,
    hasApplication,
    hasProfileData,
    hasSubmittedProfile,
    applicationState,
    applicationId: effectiveApplicationId || null,
    photoReviewRequired: isPhotoModerationRestricted(resolvedUserDoc, resolvedBestApp),
    userCode: typeof resolvedUserDoc?.userCode === 'string' ? resolvedUserDoc.userCode : null,
    fullName:
      typeof resolvedUserDoc?.fullName === 'string' && resolvedUserDoc.fullName.trim() ? resolvedUserDoc.fullName.trim() : null,
    age: resolvedUserDoc
      ? (parseAge(resolvedUserDoc?.age) ??
        parseAge(resolvedUserDoc?.publicProfile?.age) ??
        parseAge(resolvedUserDoc?.application?.age) ??
        parseAge(resolvedBestApp?.age))
      : (parseAge(resolvedBestApp?.age) ?? null),
    gender: resolvedUserDoc
      ? (normalizeGender(resolvedUserDoc?.gender) ??
        normalizeGender(resolvedUserDoc?.publicProfile?.gender) ??
        normalizeGender(resolvedUserDoc?.application?.gender) ??
        normalizeGender(resolvedBestApp?.gender))
      : (normalizeGender(resolvedBestApp?.gender) ?? null),
    identityVerified: resolvedUserDoc ? (resolvedUserDoc?.identityVerified === true) : null,
    pwaInstalled: resolvedUserDoc ? pickPwaInstalled(resolvedUserDoc) : false,
    pwaInstalledAtMs: resolvedUserDoc ? pickPwaInstalledAtMs(resolvedUserDoc) : null,
    pushEnabled: resolvedUserDoc ? pickPushEnabled(resolvedUserDoc) : false,
    pushEnabledAtMs: resolvedUserDoc ? pickPushEnabledAtMs(resolvedUserDoc) : null,
    lastApprovedPaymentId:
      resolvedUserDoc && typeof resolvedUserDoc?.membership?.lastApprovedPaymentId === 'string'
        ? safeStr(resolvedUserDoc.membership.lastApprovedPaymentId) || null
        : null,
    occupation,
    maritalStatus,
    hasChildren,
    childrenCount,
    childrenLivingSituation,
    whatsapp: whatsapp ? maskPhoneLike(whatsapp) : null,
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
    const pageSizeRaw = parseIntSafe(body?.pageSize, 50);
    const pageSize = Math.min(Math.max(pageSizeRaw || 50, 1), 200);
    const pageToken = safeStr(body?.pageToken) || undefined;
    const q = safeStr(body?.query);
    const refreshSinceMs = Math.max(0, parseIntSafe(body?.refreshSinceMs, 0) || 0);
    const includeNonAuth = body?.includeNonAuth === true || body?.includeNonAuth === 'true';

    const { auth, db } = getAdmin();

    if (!q && !pageToken && refreshSinceMs > 0 && Date.now() - refreshSinceMs <= 2 * 60 * 60 * 1000) {
      const candidateUids = new Set();
      const deletedUidSet = new Set();
      const recentLimit = Math.max(pageSize * 3, 120);

      const [recentUsersUpdatedSnap, recentUsersCreatedSnap, recentAppsUpdatedSnap, recentAppsCreatedSnap, recentDeletedSnap] = await Promise.all([
        queryRecentDocs(db, 'matchmakingUsers', 'updatedAt', recentLimit),
        queryRecentDocs(db, 'matchmakingUsers', 'createdAt', recentLimit),
        queryRecentDocs(db, 'matchmakingApplications', 'updatedAt', recentLimit),
        queryRecentDocs(db, 'matchmakingApplications', 'createdAt', recentLimit),
        queryRecentDocs(db, 'accountDeletionLogs', 'deletedAt', recentLimit),
      ]);

      recentDeletedSnap?.docs?.forEach((doc) => {
        const data = doc.data() || {};
        const deletedAtMs = toMs(data?.deletedAt);
        if (deletedAtMs <= refreshSinceMs) return;
        collectUidCandidate(deletedUidSet, data?.uid);
      });

      recentUsersUpdatedSnap?.docs?.forEach((doc) => {
        const data = doc.data() || {};
        const updatedAtMs = toMs(data?.updatedAt);
        if (updatedAtMs <= refreshSinceMs) return;
        collectUidCandidate(candidateUids, doc.id, deletedUidSet);
      });

      recentUsersCreatedSnap?.docs?.forEach((doc) => {
        const data = doc.data() || {};
        const createdAtMs = toMs(data?.createdAt) || (typeof data?.createdAtMs === 'number' ? data.createdAtMs : 0);
        if (createdAtMs <= refreshSinceMs) return;
        collectUidCandidate(candidateUids, doc.id, deletedUidSet);
      });

      const collectAppUid = (data) => {
        collectUidCandidate(candidateUids, data?.userId, deletedUidSet);
        collectUidCandidate(candidateUids, data?.uid, deletedUidSet);
        collectUidCandidate(candidateUids, data?.userUid, deletedUidSet);
        collectUidCandidate(candidateUids, data?.ownerUid, deletedUidSet);
      };

      recentAppsUpdatedSnap?.docs?.forEach((doc) => {
        const data = doc.data() || {};
        const updatedAtMs = toMs(data?.updatedAt);
        if (updatedAtMs <= refreshSinceMs) return;
        collectAppUid(data);
      });

      recentAppsCreatedSnap?.docs?.forEach((doc) => {
        const data = doc.data() || {};
        const createdAtMs = toMs(data?.createdAt) || (typeof data?.createdAtMs === 'number' ? data.createdAtMs : 0);
        if (createdAtMs <= refreshSinceMs) return;
        collectAppUid(data);
      });

      const users = (
        await Promise.all(
          Array.from(candidateUids)
            .slice(0, Math.max(pageSize, 100))
            .map(async (uid) => {
              try {
                return await buildAdminUserEntry({ auth, db, uid, userRecord: undefined });
              } catch {
                return null;
              }
            })
        )
      ).filter((entry) => entry && (includeNonAuth || entry.hasAuthRecord));

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          ok: true,
          users: sortAdminUsersByCreatedDesc(users),
          deletedUids: Array.from(deletedUidSet),
          nextPageToken: null,
          syncAtMs: Date.now(),
          refreshMode: 'delta',
        })
      );
      return;
    }

    // Search mode (email / uid)
    if (q) {
      const queryLower = q.toLowerCase();
      let userRecord = null;

      // UC-... userCode search via Firestore
      if (!queryLower.includes('@') && looksLikeUserCode(q)) {
        const userCode = safeStr(q);
        const snap = await db.collection('matchmakingUsers').where('userCode', '==', userCode).limit(1).get();
        if (snap.empty) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ ok: true, users: [], nextPageToken: null }));
          return;
        }

        const uid = String(snap.docs[0].id);
        try {
          userRecord = await auth.getUser(uid);
        } catch (e) {
          const code = String(e?.code || '');
          if (!code.includes('auth/user-not-found')) throw e;
          userRecord = null;
        }

        const entry = await buildAdminUserEntry({ auth, db, uid, userRecord });

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            ok: true,
            users: entry ? [entry] : [],
            nextPageToken: null,
          })
        );
        return;
      }

      try {
        if (queryLower.includes('@')) {
          userRecord = await auth.getUserByEmail(queryLower);
        } else {
          userRecord = await auth.getUser(q);
        }
      } catch (e) {
        const code = String(e?.code || '');
        if (!code.includes('auth/user-not-found')) throw e;
        userRecord = null;
      }

      if (!userRecord) {
        const queryCandidates = Array.from(new Set([safeStr(q), queryLower].filter(Boolean)));
        let resolvedUid = '';
        let resolvedUserDoc = null;
        let resolvedBestApp = null;

        if (queryLower.includes('@')) {
          const emailMatch = await findSingleUserDocByAnyEmail(db, queryCandidates);
          if (emailMatch?.uid) {
            resolvedUid = emailMatch.uid;
            resolvedUserDoc = emailMatch.userDoc || null;
          }
        }

        if (!resolvedUid) {
          for (const candidate of queryCandidates) {
            try {
              const userSnap = await db.collection('matchmakingUsers').where('usernameLower', '==', candidate).limit(1).get();
              if (!userSnap.empty) {
                const doc = userSnap.docs[0];
                resolvedUid = safeStr(doc.id);
                resolvedUserDoc = doc.data() || null;
                break;
              }
            } catch {
              // ignore
            }
          }
        }

        if (!resolvedUid) {
          if (queryLower.includes('@')) {
            const emailAppMatch = await findBestApplicationByAnyEmail(db, queryCandidates);
            if (emailAppMatch?.uid) {
              resolvedUid = emailAppMatch.uid;
              resolvedBestApp = emailAppMatch.bestApp || null;
            }
          }
        }

        if (!resolvedUid) {
          for (const candidate of queryCandidates) {
            try {
              const appSnap = await db.collection('matchmakingApplications').where('usernameLower', '==', candidate).limit(10).get();
              if (!appSnap.empty) {
                const apps = appSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
                resolvedBestApp = pickBestApp(apps);
                resolvedUid = safeStr(resolvedBestApp?.userId) || safeStr(resolvedBestApp?.uid) || safeStr(resolvedBestApp?.userUid) || safeStr(resolvedBestApp?.ownerUid) || safeStr(appSnap.docs[0]?.id);
                break;
              }
            } catch {
              // ignore
            }
          }
        }

        if (!resolvedUid) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ ok: true, users: [], nextPageToken: null }));
          return;
        }

        const entry = await buildAdminUserEntry({
          auth,
          db,
          uid: resolvedUid,
          userRecord: null,
          userDoc: resolvedUserDoc,
          bestApp: resolvedBestApp,
        });

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true, users: entry ? [entry] : [], nextPageToken: null }));
        return;
      }

      const entry = await buildAdminUserEntry({ auth, db, uid: String(userRecord.uid), userRecord });

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          ok: true,
          users: entry ? [entry] : [],
          nextPageToken: null,
        })
      );
      return;
    }

    const authPage = await auth.listUsers(pageSize, pageToken);
    const records = Array.isArray(authPage?.users) ? authPage.users : [];
    const nextAuthPageToken = safeStr(authPage?.pageToken) || null;
    const uids = records.map((u) => String(u.uid));
    const userDocByUid = await loadDocDataMap(db, 'matchmakingUsers', uids);
    const flagByUid = await loadDocDataMap(db, 'adminUserFlags', uids);
    const visibleRecords = records.filter((u) => {
      const uid = String(u.uid || '');
      const userDoc = userDocByUid.get(uid) || null;
      if (isSyntheticTestUserRecord({ uid, email: u.email || '', user: userDoc })) return false;
      return !isAdminOnlyAccount({ userRecord: u, userDoc });
    });

    const now = Date.now();
    const cachedBestAppByUid = new Map();
    const directApplicationDocCandidates = [];
    for (const uid of visibleRecords.map((u) => String(u.uid))) {
      const userDoc = userDocByUid.get(uid) || null;
      const cachedBestApp = buildCachedBestApp(userDoc);
      if (cachedBestApp) {
        cachedBestAppByUid.set(uid, cachedBestApp);
      }
      if (!shouldLoadLiveBestApp(userDoc, cachedBestApp)) continue;
      if (safeStr(userDoc?.applicationId)) {
        directApplicationDocCandidates.push({ uid, userDoc });
      }
    }

    const liveBestAppByUid = directApplicationDocCandidates.length
      ? await loadBestAppsFromApplicationIds(db, directApplicationDocCandidates)
      : new Map();

    const users = visibleRecords.map((u) => {
      const uid = String(u.uid);
      const userDoc = userDocByUid.get(uid) || null;
      const flags = flagByUid.get(uid) || null;
      const membershipActive = userDoc ? isMembershipActive(userDoc, now) : false;
      const untilMs = userDoc && typeof userDoc?.membership?.validUntilMs === 'number' ? userDoc.membership.validUntilMs : 0;
      const plan = userDoc && typeof userDoc?.membership?.plan === 'string' ? userDoc.membership.plan : '';
      const applicationId = userDoc && typeof userDoc?.applicationId === 'string' ? safeStr(userDoc.applicationId) : '';
      const bestApp = liveBestAppByUid.get(uid) || cachedBestAppByUid.get(uid) || null;
      const effectiveApplicationId = applicationId || (bestApp?.id ? String(bestApp.id) : '');
      const applicationState = resolveAdminApplicationState(userDoc, bestApp);
      const hasSubmittedProfile = !!(bestApp && applicationState === 'real') || hasSubmittedMatchmakingProfileInUserDoc(userDoc);
      const hasApplication = applicationState === 'real' || applicationState === 'partial' || applicationState === 'stub' || applicationState === 'cache' || applicationState === 'stub_cache';
      const hasProfileData = applicationState !== 'none';

      const details = pickDetailsFromUserDocOrApp(userDoc, bestApp);
      const occupation = pickOccupationLabel(details);
      const maritalStatus = pickMaritalStatus(details);
      const hasChildren = pickHasChildren(details);
      const childrenCount = pickChildrenCount(details);
      const childrenLivingSituation = pickChildrenLivingSituation(details);
      const whatsapp = pickWhatsapp(userDoc, bestApp);
      const persistedAuthTrace = hasPersistedAuthTrace(userDoc, bestApp);

      return {
        uid,
        hasAuthRecord: true,
        hasPersistedAuthTrace: persistedAuthTrace,
        email: u.email ? maskEmail(u.email) : null,
        disabled: !!u.disabled,
        createdAtMs: dateStringToMs(u.metadata?.creationTime),
        lastSignInAtMs: dateStringToMs(u.metadata?.lastSignInTime),
        systemUser: !!flags?.systemUser,
        blocked: !!userDoc?.blocked,
        membershipActive,
        membershipPlan: plan || null,
        membershipValidUntilMs: untilMs || null,
        hasUserDoc: !!userDoc,
        hasApplication,
        hasProfileData,
        hasSubmittedProfile,
        applicationState,
        applicationId: effectiveApplicationId || null,
        userCode: typeof userDoc?.userCode === 'string' ? userDoc.userCode : null,
        fullName: typeof userDoc?.fullName === 'string' && userDoc.fullName.trim() ? userDoc.fullName.trim() : null,
        age: userDoc
          ? (parseAge(userDoc?.age) ??
            parseAge(userDoc?.publicProfile?.age) ??
            parseAge(userDoc?.application?.age) ??
            parseAge(bestApp?.age))
          : (parseAge(bestApp?.age) ?? null),
        gender: userDoc
          ? (normalizeGender(userDoc?.gender) ??
            normalizeGender(userDoc?.publicProfile?.gender) ??
            normalizeGender(userDoc?.application?.gender) ??
            normalizeGender(bestApp?.gender))
          : (normalizeGender(bestApp?.gender) ?? null),
        identityVerified: userDoc ? (userDoc?.identityVerified === true) : null,
        pwaInstalled: userDoc ? pickPwaInstalled(userDoc) : false,
        pwaInstalledAtMs: userDoc ? pickPwaInstalledAtMs(userDoc) : null,
        pushEnabled: userDoc ? pickPushEnabled(userDoc) : false,
        pushEnabledAtMs: userDoc ? pickPushEnabledAtMs(userDoc) : null,
        lastApprovedPaymentId:
          userDoc && typeof userDoc?.membership?.lastApprovedPaymentId === 'string'
            ? safeStr(userDoc.membership.lastApprovedPaymentId) || null
            : null,

        occupation,
        maritalStatus,
        hasChildren,
        childrenCount,
        childrenLivingSituation,

        whatsapp: whatsapp ? maskPhoneLike(whatsapp) : null,
      };
    });

    const pagedUsers = sortAdminUsersByCreatedDesc(users);

    if (!pageToken) {
      const extraCandidates = new Set();
      const collectUid = (candidate) => {
        const uid = safeStr(candidate);
        if (!uid || extraCandidates.has(uid) || uids.includes(uid)) return;
        extraCandidates.add(uid);
      };

      try {
        const recentUsersSnap = await db.collection('matchmakingUsers').orderBy('updatedAtMs', 'desc').limit(Math.max(pageSize * 3, 100)).get();
        recentUsersSnap.docs.forEach((doc) => collectUid(doc.id));
      } catch {
        // ignore
      }

      try {
        const recentAppsSnap = await db.collection('matchmakingApplications').orderBy('updatedAtMs', 'desc').limit(Math.max(pageSize * 4, 120)).get();
        recentAppsSnap.docs.forEach((doc) => {
          const data = doc.data() || {};
          collectUid(data?.userId);
          collectUid(data?.uid);
          collectUid(data?.userUid);
          collectUid(data?.ownerUid);
        });
      } catch {
        // ignore
      }

      const extras = (
        await Promise.all(
          Array.from(extraCandidates)
            .slice(0, Math.max(pageSize, 50))
            .map(async (uid) => {
              try {
                return await buildAdminUserEntry({ auth, db, uid, userRecord: undefined });
              } catch {
                return null;
              }
            })
        )
      ).filter((entry) => entry && (includeNonAuth || entry.hasAuthRecord) && !pagedUsers.some((user) => user.uid === entry.uid));

      if (extras.length) pagedUsers.push(...extras);
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        users: sortAdminUsersByCreatedDesc(pagedUsers),
        nextPageToken: nextAuthPageToken,
        syncAtMs: Date.now(),
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
