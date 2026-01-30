import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function parseProfileNoFromCode(raw) {
  const s = safeStr(raw);
  if (!s) return null;
  const m = s.match(/^mk\s*[-_]?\s*(\d+)$/i);
  if (m) return Number(m[1]);
  if (/^\d+$/.test(s)) return Number(s);
  return null;
}

function isIdentityVerifiedUserDoc(data) {
  if (data?.identityVerified === true) return true;
  const st = String(data?.identityVerification?.status || '').toLowerCase().trim();
  return st === 'verified' || st === 'approved';
}

function isMembershipActiveUserDoc(userDoc) {
  const m = userDoc?.membership || null;
  if (!m || !m.active) return false;
  const until = typeof m.validUntilMs === 'number' ? m.validUntilMs : 0;
  return until > Date.now();
}

function buildProfileSnapshot(app, userDoc) {
  const details = app?.details || {};
  const about = typeof app?.about === 'string' ? app.about.trim() : '';
  const expectations = typeof app?.expectations === 'string' ? app.expectations.trim() : '';
  const clip = (s, maxLen) => {
    const v = typeof s === 'string' ? s.trim() : '';
    if (!v) return '';
    return v.length > maxLen ? v.slice(0, maxLen) : v;
  };
  return {
    identityVerified: !!(userDoc && isIdentityVerifiedUserDoc(userDoc)),
    proMember: !!(userDoc && isMembershipActiveUserDoc(userDoc)),
    profileNo: asNum(app?.profileNo),
    profileCode: safeStr(app?.profileCode) || (typeof app?.profileNo === 'number' ? `MK-${app.profileNo}` : ''),
    username: safeStr(app?.username),
    fullName: safeStr(app?.fullName),
    age: asNum(app?.age),
    city: safeStr(app?.city),
    country: safeStr(app?.country),
    photoUrls: Array.isArray(app?.photoUrls)
      ? app.photoUrls.filter((u) => typeof u === 'string' && u.trim())
      : [],
    about: clip(about, 360),
    expectations: clip(expectations, 360),
    details: {
      maritalStatus: safeStr(details?.maritalStatus),
      occupation: safeStr(details?.occupation),
      hasChildren: safeStr(details?.hasChildren),
      childrenCount: asNum(details?.childrenCount),
      childrenLivingSituation: safeStr(details?.childrenLivingSituation),
    },
  };
}

async function resolveApplication(db, identifier) {
  const raw = safeStr(identifier);
  if (!raw) return null;

  // 1) Direct doc id
  try {
    const direct = await db.collection('matchmakingApplications').doc(raw).get();
    if (direct.exists) return { id: direct.id, ...(direct.data() || {}) };
  } catch {
    // ignore
  }

  // 2) profileCode
  try {
    const byCode = await db
      .collection('matchmakingApplications')
      .where('profileCode', '==', raw)
      .limit(1)
      .get();
    if (!byCode.empty) {
      const d = byCode.docs[0];
      return { id: d.id, ...(d.data() || {}) };
    }
  } catch {
    // ignore
  }

  // 3) profileNo
  const n = parseProfileNoFromCode(raw);
  if (typeof n === 'number' && Number.isFinite(n)) {
    try {
      const byNo = await db
        .collection('matchmakingApplications')
        .where('profileNo', '==', n)
        .limit(1)
        .get();
      if (!byNo.empty) {
        const d = byNo.docs[0];
        return { id: d.id, ...(d.data() || {}) };
      }
    } catch {
      // ignore
    }
  }

  return null;
}

function normalizeStatus(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'proposed' || s === 'mutual_accepted' || s === 'contact_unlocked') return s;
  return 'proposed';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const admin = await requireAdmin(req);
    const body = normalizeBody(req);

    const aInput = safeStr(body?.a);
    const bInput = safeStr(body?.b);
    const status = normalizeStatus(body?.status);
    const overwrite = body?.overwrite === true;
    const clearLocks = body?.clearLocks !== false;

    if (!aInput || !bInput) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();

    const [aApp, bApp] = await Promise.all([
      resolveApplication(db, aInput),
      resolveApplication(db, bInput),
    ]);

    if (!aApp || !bApp) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({
        ok: false,
        error: 'application_not_found',
        details: {
          aFound: !!aApp,
          bFound: !!bApp,
        },
      }));
      return;
    }

    const aUserId = safeStr(aApp?.userId);
    const bUserId = safeStr(bApp?.userId);

    if (!aUserId || !bUserId || aUserId === bUserId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_users' }));
      return;
    }

    const userIdsSorted = [aUserId, bUserId].slice().sort();
    const matchId = `${userIdsSorted[0]}__${userIdsSorted[1]}`;

    const matchRef = db.collection('matchmakingMatches').doc(matchId);
    let skippedBecauseExists = false;

    // Manual admin action: avoid Firestore transaction pitfalls.
    // We only need deterministic matchId; matchCode can be generated when missing.
    const existing = await matchRef.get();
    if (existing.exists && !overwrite) {
      skippedBecauseExists = true;
    } else {
      const [aUserSnap, bUserSnap] = await Promise.all([
        db.collection('matchmakingUsers').doc(aUserId).get(),
        db.collection('matchmakingUsers').doc(bUserId).get(),
      ]);

      const aUserDoc = aUserSnap.exists ? (aUserSnap.data() || {}) : null;
      const bUserDoc = bUserSnap.exists ? (bUserSnap.data() || {}) : null;

      const existingData = existing.exists ? (existing.data() || {}) : {};
      const matchNo = typeof existingData?.matchNo === 'number' && Number.isFinite(existingData.matchNo) ? existingData.matchNo : null;
      const existingMatchCode = safeStr(existingData?.matchCode);
      const manualSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
      const matchCode = existingMatchCode || `ES-MANUAL-${Date.now()}-${manualSuffix}`;

      const baseDoc = {
        matchNo,
        matchCode,
        userIds: userIdsSorted,
        aUserId,
        bUserId,
        aApplicationId: aApp.id,
        bApplicationId: bApp.id,
        scoreAtoB: null,
        scoreBtoA: null,
        score: null,
        status,
        decisions: { a: null, b: null },
        profiles: {
          a: buildProfileSnapshot(aApp, aUserDoc),
          b: buildProfileSnapshot(bApp, bUserDoc),
        },
        createdAt: existing.exists ? existingData?.createdAt || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdByAdminId: admin.uid,
      };

      // Fast-path options for testing
      if (status === 'mutual_accepted' || status === 'contact_unlocked') {
        baseDoc.decisions = { a: 'accept', b: 'accept' };
        baseDoc.mutualAcceptedAt = FieldValue.serverTimestamp();
        baseDoc.interactionMode = null;
        baseDoc.interactionChosenAt = null;
        baseDoc.interactionChoices = {};
      }

      if (status === 'contact_unlocked') {
        baseDoc.interactionMode = 'contact';
        baseDoc.interactionChosenAt = FieldValue.serverTimestamp();
        baseDoc.interactionChoices = { [aUserId]: 'contact', [bUserId]: 'contact' };
        baseDoc.contactUnlockedAt = FieldValue.serverTimestamp();
      }

      await matchRef.set(baseDoc, { merge: false });

      if (clearLocks) {
        for (const uid of [aUserId, bUserId]) {
          await db.collection('matchmakingUsers').doc(uid).set(
            {
              matchmakingLock: { active: false, matchId: '', matchCode: '' },
              matchmakingChoice: { active: false, matchId: '', matchCode: '' },
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
      }

      if (status === 'contact_unlocked') {
        for (const uid of [aUserId, bUserId]) {
          await db.collection('matchmakingUsers').doc(uid).set(
            {
              matchmakingLock: { active: true, matchId, matchCode },
              matchmakingChoice: { active: true, matchId, matchCode },
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
      }
    }

    const snap = await matchRef.get();

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        matchId,
        status,
        skippedBecauseExists,
        existed: snap.exists,
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error'), details: e?.details || null }));
  }
}
