import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

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

function toMs(ts) {
  try {
    if (!ts) return 0;
    if (ts instanceof Date) {
      const n = ts.getTime();
      return Number.isFinite(n) ? n : 0;
    }
    if (typeof ts.toMillis === 'function') return ts.toMillis();
    if (typeof ts.seconds === 'number') return ts.seconds * 1000;
    if (typeof ts === 'number') return ts;
    return 0;
  } catch {
    return 0;
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

function parseAge(v) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < 18 || i > 99) return null;
  return i;
}

function normalizeGender(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'female' || s === 'male') return s;
  return null;
}

function getAnyAboutFromUserDoc(userDoc) {
  const it = userDoc && typeof userDoc === 'object' ? userDoc : null;
  if (!it) return '';
  const d = it?.details && typeof it.details === 'object' ? it.details : null;
  const pp = it?.publicProfile && typeof it.publicProfile === 'object' ? it.publicProfile : null;
  const app = it?.application && typeof it.application === 'object' ? it.application : null;
  return (
    safeStr(it?.bio) ||
    safeStr(d?.about) ||
    safeStr(d?.bio) ||
    safeStr(d?.aboutTr) ||
    safeStr(d?.aboutId) ||
    safeStr(d?.bioTr) ||
    safeStr(d?.bioId) ||
    safeStr(pp?.about) ||
    safeStr(pp?.bio) ||
    safeStr(pp?.aboutTr) ||
    safeStr(pp?.aboutId) ||
    safeStr(pp?.bioTr) ||
    safeStr(pp?.bioId) ||
    safeStr(app?.about) ||
    safeStr(app?.bio) ||
    safeStr(app?.aboutTr) ||
    safeStr(app?.aboutId) ||
    safeStr(app?.bioTr) ||
    safeStr(app?.bioId)
  );
}

function appScoreForAdmin(app) {
  const source = safeStr(app?.source).toLowerCase();
  const isStub = source === 'auto_stub' || app?.details?.autoBootstrap === true;
  const ms =
    (typeof app?.createdAtMs === 'number' && Number.isFinite(app.createdAtMs) ? app.createdAtMs : 0) ||
    toMs(app?.createdAt);
  let score = 0;
  if (!isStub) score += 1000;
  if (typeof app?.age === 'number' && Number.isFinite(app.age)) score += 10;
  if (normalizeGender(app?.gender)) score += 10;
  if (safeStr(app?.country)) score += 3;
  if (safeStr(app?.city)) score += 2;
  if (ms > 0) score += Math.min(50, Math.floor(ms / 1e12));
  return score;
}

function pickBestApp(apps) {
  const list = Array.isArray(apps) ? apps : [];
  if (!list.length) return null;
  let best = list[0];
  let bestScore = appScoreForAdmin(best);
  for (let i = 1; i < list.length; i += 1) {
    const cand = list[i];
    const s = appScoreForAdmin(cand);
    if (s > bestScore) {
      best = cand;
      bestScore = s;
    }
  }
  return best || null;
}

function looksLikeUserCode(q) {
  const s = safeStr(q);
  if (!s) return false;
  return s.toUpperCase().startsWith('UC-');
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

        const userRef = db.collection('matchmakingUsers').doc(uid);
        const flagRef = db.collection('adminUserFlags').doc(uid);
        const [userSnap, flagSnap] = await Promise.all([userRef.get(), flagRef.get()]);
        const userDoc = userSnap.exists ? (userSnap.data() || {}) : null;
        const flags = flagSnap.exists ? (flagSnap.data() || {}) : null;

        const now = Date.now();
        const membershipActive = userDoc ? isMembershipActive(userDoc, now) : false;
        const untilMs = userDoc && typeof userDoc?.membership?.validUntilMs === 'number' ? userDoc.membership.validUntilMs : 0;
        const plan = userDoc && typeof userDoc?.membership?.plan === 'string' ? userDoc.membership.plan : '';
        const applicationId = userDoc && typeof userDoc?.applicationId === 'string' ? safeStr(userDoc.applicationId) : '';
        const cachedAbout = getAnyAboutFromUserDoc(userDoc);

        const details = pickDetailsFromUserDocOrApp(userDoc, null);
        const occupation = pickOccupationLabel(details);
        const maritalStatus = pickMaritalStatus(details);
        const hasChildren = pickHasChildren(details);
        const childrenCount = pickChildrenCount(details);
        const whatsapp = pickWhatsapp(userDoc, null);

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            ok: true,
            users: [
              {
                uid,
                email: userRecord?.email || null,
                disabled: !!userRecord?.disabled,
                createdAtMs: userRecord ? dateStringToMs(userRecord.metadata?.creationTime) : null,
                lastSignInAtMs: userRecord ? dateStringToMs(userRecord.metadata?.lastSignInTime) : null,
                systemUser: !!flags?.systemUser,
                blocked: !!userDoc?.blocked,
                membershipActive,
                membershipPlan: plan || null,
                membershipValidUntilMs: untilMs || null,
                hasUserDoc: !!userDoc,
                hasApplication: !!applicationId || !!cachedAbout,
                applicationId: applicationId || null,
                userCode: typeof userDoc?.userCode === 'string' ? userDoc.userCode : null,
                fullName:
                  typeof userDoc?.fullName === 'string' && userDoc.fullName.trim() ? userDoc.fullName.trim() : null,
                age: userDoc ? parseAge(userDoc?.age) : null,
                gender: userDoc ? normalizeGender(userDoc?.gender) : null,
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
              },
            ],
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
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true, users: [], nextPageToken: null }));
        return;
      }

      const uid = String(userRecord.uid);
      const userRef = db.collection('matchmakingUsers').doc(uid);
      const flagRef = db.collection('adminUserFlags').doc(uid);
      const [userSnap, flagSnap] = await Promise.all([userRef.get(), flagRef.get()]);
      const userDoc = userSnap.exists ? (userSnap.data() || {}) : null;
      const flags = flagSnap.exists ? (flagSnap.data() || {}) : null;

      const now = Date.now();
      const membershipActive = userDoc ? isMembershipActive(userDoc, now) : false;
      const untilMs = userDoc && typeof userDoc?.membership?.validUntilMs === 'number' ? userDoc.membership.validUntilMs : 0;
      const plan = userDoc && typeof userDoc?.membership?.plan === 'string' ? userDoc.membership.plan : '';
      const applicationId = userDoc && typeof userDoc?.applicationId === 'string' ? safeStr(userDoc.applicationId) : '';
      const cachedAbout = getAnyAboutFromUserDoc(userDoc);

      const details = pickDetailsFromUserDocOrApp(userDoc, null);
      const occupation = pickOccupationLabel(details);
      const maritalStatus = pickMaritalStatus(details);
      const hasChildren = pickHasChildren(details);
      const childrenCount = pickChildrenCount(details);
      const whatsapp = pickWhatsapp(userDoc, null);

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          ok: true,
          users: [
            {
              uid,
              email: userRecord.email || null,
              disabled: !!userRecord.disabled,
              createdAtMs: dateStringToMs(userRecord.metadata?.creationTime),
              lastSignInAtMs: dateStringToMs(userRecord.metadata?.lastSignInTime),
              systemUser: !!flags?.systemUser,
              blocked: !!userDoc?.blocked,
              membershipActive,
              membershipPlan: plan || null,
              membershipValidUntilMs: untilMs || null,
              hasUserDoc: !!userDoc,
              hasApplication: !!applicationId || !!cachedAbout,
              applicationId: applicationId || null,
              userCode: typeof userDoc?.userCode === 'string' ? userDoc.userCode : null,
              fullName: typeof userDoc?.fullName === 'string' && userDoc.fullName.trim() ? userDoc.fullName.trim() : null,
              age: userDoc ? parseAge(userDoc?.age) : null,
              gender: userDoc ? normalizeGender(userDoc?.gender) : null,
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
            },
          ],
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

    // Enrich missing age/gender from applications (some users have no cache fields).
    const needsAppUids = uids.filter((uid) => {
      const d = userDocByUid.get(uid) || null;
      const age = d ? (parseAge(d?.age) ?? parseAge(d?.publicProfile?.age) ?? parseAge(d?.application?.age)) : null;
      const gender = d ? (normalizeGender(d?.gender) ?? normalizeGender(d?.publicProfile?.gender) ?? normalizeGender(d?.application?.gender)) : null;
      const applicationId = d && typeof d?.applicationId === 'string' ? safeStr(d.applicationId) : '';
      const cachedAbout = getAnyAboutFromUserDoc(d);
      return age === null || gender === null || (!applicationId && !cachedAbout);
    });

    const bestAppByUid = new Map();
    if (needsAppUids.length) {
      const chunks = [];
      for (let i = 0; i < needsAppUids.length; i += 10) chunks.push(needsAppUids.slice(i, i + 10));
      for (const chunk of chunks) {
        try {
          const snap = await db.collection('matchmakingApplications').where('userId', 'in', chunk).get();
          const byUid = new Map();
          snap.docs.forEach((d) => {
            const a = d.data() || {};
            const uid = safeStr(a?.userId);
            if (!uid) return;
            const list = byUid.get(uid) || [];
            list.push({ id: d.id, ...a });
            byUid.set(uid, list);
          });
          for (const [uid, list] of byUid.entries()) {
            const best = pickBestApp(list);
            if (best) bestAppByUid.set(uid, best);
          }
        } catch {
          // best-effort
        }
      }
    }

    const users = records.map((u) => {
      const uid = String(u.uid);
      const userDoc = userDocByUid.get(uid) || null;
      const flags = flagByUid.get(uid) || null;
      const membershipActive = userDoc ? isMembershipActive(userDoc, now) : false;
      const untilMs = userDoc && typeof userDoc?.membership?.validUntilMs === 'number' ? userDoc.membership.validUntilMs : 0;
      const plan = userDoc && typeof userDoc?.membership?.plan === 'string' ? userDoc.membership.plan : '';
      const applicationId = userDoc && typeof userDoc?.applicationId === 'string' ? safeStr(userDoc.applicationId) : '';
      const cachedAbout = getAnyAboutFromUserDoc(userDoc);
      const bestApp = bestAppByUid.get(uid) || null;
      const effectiveApplicationId = applicationId || (bestApp?.id ? String(bestApp.id) : '');
      const hasApplication = !!effectiveApplicationId || !!cachedAbout;

      const details = pickDetailsFromUserDocOrApp(userDoc, bestApp);
      const occupation = pickOccupationLabel(details);
      const maritalStatus = pickMaritalStatus(details);
      const hasChildren = pickHasChildren(details);
      const childrenCount = pickChildrenCount(details);
      const whatsapp = pickWhatsapp(userDoc, bestApp);

      return {
        uid,
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
