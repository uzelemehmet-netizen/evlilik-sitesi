import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import {
  loadApplicationsForUid,
  loadBestAppsByUidBatch,
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
  return userDoc?.pwa?.installed === true;
}

function pickPwaInstalledAtMs(userDoc) {
  const ms = userDoc?.pwa?.installedAtMs;
  return typeof ms === 'number' && Number.isFinite(ms) && ms > 0 ? ms : null;
}

function looksLikeUserCode(q) {
  const s = safeStr(q);
  if (!s) return false;
  return s.toUpperCase().startsWith('UC-');
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

  let resolvedBestApp = typeof bestApp === 'undefined' ? undefined : bestApp;
  if (typeof resolvedBestApp === 'undefined') {
    try {
      const apps = await loadApplicationsForUid(db, resolvedUid, {
        applicationId: resolvedUserDoc?.applicationId,
        limitPerField: 25,
      });
      resolvedBestApp = pickBestApp(apps);
    } catch {
      resolvedBestApp = null;
    }
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
  const hasApplication = applicationState === 'real' || applicationState === 'stub' || applicationState === 'cache' || applicationState === 'stub_cache';
  const hasProfileData = applicationState !== 'none';

  const details = pickDetailsFromUserDocOrApp(resolvedUserDoc, resolvedBestApp);
  const occupation = pickOccupationLabel(details);
  const maritalStatus = pickMaritalStatus(details);
  const hasChildren = pickHasChildren(details);
  const childrenCount = pickChildrenCount(details);
  const whatsapp = pickWhatsapp(resolvedUserDoc, resolvedBestApp);
  const authCreatedAtMs = resolvedUserRecord ? dateStringToMs(resolvedUserRecord.metadata?.creationTime) : 0;
  const authLastSignInAtMs = resolvedUserRecord ? dateStringToMs(resolvedUserRecord.metadata?.lastSignInTime) : 0;
  const userCreatedAtMs = toMs(resolvedUserDoc?.createdAt) || (typeof resolvedUserDoc?.createdAtMs === 'number' ? resolvedUserDoc.createdAtMs : 0);
  const userUpdatedAtMs = toMs(resolvedUserDoc?.updatedAt) || (typeof resolvedUserDoc?.updatedAtMs === 'number' ? resolvedUserDoc.updatedAtMs : 0);
  const appCreatedAtMs = toMs(resolvedBestApp?.createdAt) || (typeof resolvedBestApp?.createdAtMs === 'number' ? resolvedBestApp.createdAtMs : 0);
  const lastSeenAtMs = toMs(resolvedUserDoc?.lastSeenAt) || (typeof resolvedUserDoc?.lastSeenAtMs === 'number' ? resolvedUserDoc.lastSeenAtMs : 0);

  return {
    uid: resolvedUid,
    hasAuthRecord: !!resolvedUserRecord,
    email: resolvedUserRecord?.email || null,
    disabled: !!resolvedUserRecord?.disabled,
    createdAtMs: authCreatedAtMs || userCreatedAtMs || userUpdatedAtMs || appCreatedAtMs || null,
    lastSignInAtMs: authLastSignInAtMs || lastSeenAtMs || null,
    systemUser: !!flags?.systemUser,
    blocked: !!resolvedUserDoc?.blocked,
    membershipActive,
    membershipPlan: plan || null,
    membershipValidUntilMs: untilMs || null,
    hasUserDoc: !!resolvedUserDoc,
    hasApplication,
    hasProfileData,
    applicationState,
    applicationId: effectiveApplicationId || null,
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
    whatsapp,
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

    const { auth, db } = getAdmin();

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

        if (!resolvedUid) {
          for (const candidate of queryCandidates) {
            try {
              const appSnap = await db.collection('matchmakingApplications').where('usernameLower', '==', candidate).limit(10).get();
              if (!appSnap.empty) {
                const apps = appSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
                resolvedBestApp = pickBestApp(apps);
                resolvedUid = safeStr(resolvedBestApp?.userId) || safeStr(appSnap.docs[0]?.id);
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

    const result = await auth.listUsers(pageSize, pageToken);
    const records = Array.isArray(result?.users) ? result.users : [];
    const uids = records.map((u) => String(u.uid));

    const userRefs = uids.map((uid) => db.collection('matchmakingUsers').doc(uid));
    const flagRefs = uids.map((uid) => db.collection('adminUserFlags').doc(uid));

    let userSnaps = [];
    let flagSnaps = [];
    try {
      // getAll is available in firebase-admin Firestore
      userSnaps = uids.length ? await db.getAll(...userRefs) : [];
    } catch {
      userSnaps = await Promise.all(userRefs.map((r) => r.get()));
    }

    try {
      flagSnaps = uids.length ? await db.getAll(...flagRefs) : [];
    } catch {
      flagSnaps = await Promise.all(flagRefs.map((r) => r.get()));
    }

    const userDocByUid = new Map();
    for (let i = 0; i < uids.length; i += 1) {
      const snap = userSnaps[i];
      const uid = uids[i];
      userDocByUid.set(uid, snap && snap.exists ? (snap.data() || {}) : null);
    }

    const flagByUid = new Map();
    for (let i = 0; i < uids.length; i += 1) {
      const snap = flagSnaps[i];
      const uid = uids[i];
      flagByUid.set(uid, snap && snap.exists ? (snap.data() || {}) : null);
    }

    const now = Date.now();
    const bestAppByUid = await loadBestAppsByUidBatch(db, uids, { limitPerField: 25 });

    const users = records.map((u) => {
      const uid = String(u.uid);
      const userDoc = userDocByUid.get(uid) || null;
      const flags = flagByUid.get(uid) || null;
      const membershipActive = userDoc ? isMembershipActive(userDoc, now) : false;
      const untilMs = userDoc && typeof userDoc?.membership?.validUntilMs === 'number' ? userDoc.membership.validUntilMs : 0;
      const plan = userDoc && typeof userDoc?.membership?.plan === 'string' ? userDoc.membership.plan : '';
      const applicationId = userDoc && typeof userDoc?.applicationId === 'string' ? safeStr(userDoc.applicationId) : '';
      const bestApp = bestAppByUid.get(uid) || null;
      const effectiveApplicationId = applicationId || (bestApp?.id ? String(bestApp.id) : '');
      const applicationState = resolveAdminApplicationState(userDoc, bestApp);
      const hasApplication = applicationState === 'real' || applicationState === 'stub' || applicationState === 'cache' || applicationState === 'stub_cache';
      const hasProfileData = applicationState !== 'none';

      const details = pickDetailsFromUserDocOrApp(userDoc, bestApp);
      const occupation = pickOccupationLabel(details);
      const maritalStatus = pickMaritalStatus(details);
      const hasChildren = pickHasChildren(details);
      const childrenCount = pickChildrenCount(details);
      const whatsapp = pickWhatsapp(userDoc, bestApp);

      return {
        uid,
        hasAuthRecord: true,
        email: u.email || null,
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

        whatsapp,
      };
    });

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

      const extras = [];
      for (const uid of Array.from(extraCandidates).slice(0, pageSize)) {
        try {
          const entry = await buildAdminUserEntry({ auth, db, uid, userRecord: undefined });
          if (entry && !entry.hasAuthRecord && !users.some((user) => user.uid === entry.uid)) {
            extras.push(entry);
          }
        } catch {
          // ignore
        }
      }

      if (extras.length) users.push(...extras);
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        users,
        nextPageToken: result?.pageToken || null,
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
