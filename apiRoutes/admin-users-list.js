import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
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
                hasApplication: !!applicationId,
                applicationId: applicationId || null,
                userCode: typeof userDoc?.userCode === 'string' ? userDoc.userCode : null,
                fullName:
                  typeof userDoc?.fullName === 'string' && userDoc.fullName.trim() ? userDoc.fullName.trim() : null,
                age: userDoc ? parseAge(userDoc?.age) : null,
                gender: userDoc ? normalizeGender(userDoc?.gender) : null,
                identityVerified: userDoc ? (userDoc?.identityVerified === true) : null,
                lastApprovedPaymentId:
                  userDoc && typeof userDoc?.membership?.lastApprovedPaymentId === 'string'
                    ? safeStr(userDoc.membership.lastApprovedPaymentId) || null
                    : null,
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
              hasApplication: !!applicationId,
              applicationId: applicationId || null,
              userCode: typeof userDoc?.userCode === 'string' ? userDoc.userCode : null,
              fullName: typeof userDoc?.fullName === 'string' && userDoc.fullName.trim() ? userDoc.fullName.trim() : null,
              age: userDoc ? parseAge(userDoc?.age) : null,
              gender: userDoc ? normalizeGender(userDoc?.gender) : null,
              identityVerified: userDoc ? (userDoc?.identityVerified === true) : null,
              lastApprovedPaymentId:
                userDoc && typeof userDoc?.membership?.lastApprovedPaymentId === 'string'
                  ? safeStr(userDoc.membership.lastApprovedPaymentId) || null
                  : null,
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

    const users = records.map((u) => {
      const uid = String(u.uid);
      const userDoc = userDocByUid.get(uid) || null;
      const flags = flagByUid.get(uid) || null;
      const membershipActive = userDoc ? isMembershipActive(userDoc, now) : false;
      const untilMs = userDoc && typeof userDoc?.membership?.validUntilMs === 'number' ? userDoc.membership.validUntilMs : 0;
      const plan = userDoc && typeof userDoc?.membership?.plan === 'string' ? userDoc.membership.plan : '';
      const applicationId = userDoc && typeof userDoc?.applicationId === 'string' ? safeStr(userDoc.applicationId) : '';

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
        hasApplication: !!applicationId,
        applicationId: applicationId || null,
        userCode: typeof userDoc?.userCode === 'string' ? userDoc.userCode : null,
        fullName: typeof userDoc?.fullName === 'string' && userDoc.fullName.trim() ? userDoc.fullName.trim() : null,
        age: userDoc ? parseAge(userDoc?.age) : null,
        gender: userDoc ? normalizeGender(userDoc?.gender) : null,
        identityVerified: userDoc ? (userDoc?.identityVerified === true) : null,
        lastApprovedPaymentId:
          userDoc && typeof userDoc?.membership?.lastApprovedPaymentId === 'string'
            ? safeStr(userDoc.membership.lastApprovedPaymentId) || null
            : null,
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
