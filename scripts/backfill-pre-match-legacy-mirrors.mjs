import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnvLocal() {
  try {
    const envPath = path.join(projectRoot, '.env.local');
    if (!fs.existsSync(envPath)) return;

    const raw = fs.readFileSync(envPath, 'utf8');
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined || String(process.env[key]).trim() === '') {
        process.env[key] = key.toUpperCase().includes('PRIVATE_KEY') ? value.replace(/\\n/g, '\n') : value;
      }
    }
  } catch {
    // ignore
  }
}

function getArgValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  const next = process.argv[idx + 1];
  if (!next || next.startsWith('--')) return '';
  return String(next).trim();
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asNum(v) {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
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
  if (typeof v?.seconds === 'number') return v.seconds * 1000;
  return 0;
}

function pickBestNonStubApplication(items) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return null;

  const scored = list
    .map((a) => {
      const source = safeStr(a?.source).toLowerCase();
      const isStub = source === 'auto_stub';
      const ms = (typeof a?.updatedAtMs === 'number' ? a.updatedAtMs : 0) || (typeof a?.createdAtMs === 'number' ? a.createdAtMs : 0) || tsToMs(a?.updatedAt) || tsToMs(a?.createdAt);
      return { a, score: (isStub ? 0 : 1000) + ms };
    })
    .sort((x, y) => y.score - x.score);

  return scored[0]?.a || null;
}

function isIdentityVerifiedUserDoc(userDoc) {
  if (userDoc?.identityVerified === true) return true;
  const st = String(userDoc?.identityVerification?.status || '').toLowerCase().trim();
  return st === 'verified' || st === 'approved';
}

function isMembershipActiveUserDoc(userDoc) {
  const m = userDoc?.membership || null;
  if (!m || !m.active) return false;
  const until = typeof m.validUntilMs === 'number' ? m.validUntilMs : 0;
  return until > Date.now();
}

function buildMatchProfile(app, userDoc) {
  const details = app?.details || {};
  const clip = (s, maxLen) => {
    const v = safeStr(s);
    if (!v) return '';
    return v.length > maxLen ? v.slice(0, maxLen) : v;
  };

  return {
    identityVerified: !!(userDoc && isIdentityVerifiedUserDoc(userDoc)),
    membershipActive: !!(userDoc && isMembershipActiveUserDoc(userDoc)),
    membershipPlan: safeStr(userDoc?.membership?.plan || userDoc?.membershipPlan),
    proMember: !!(userDoc && isMembershipActiveUserDoc(userDoc) && String(userDoc?.membership?.plan || userDoc?.membershipPlan || '') === 'pro'),
    userCode: safeStr(userDoc?.userCode) || safeStr(userDoc?.publicProfile?.userCode),
    userCodeNo:
      typeof userDoc?.userCodeNo === 'number' && Number.isFinite(userDoc.userCodeNo)
        ? userDoc.userCodeNo
        : (typeof userDoc?.publicProfile?.userCodeNo === 'number' && Number.isFinite(userDoc.publicProfile.userCodeNo)
            ? userDoc.publicProfile.userCodeNo
            : null),
    profileNo: asNum(app?.profileNo),
    profileCode: safeStr(app?.profileCode) || (typeof app?.profileNo === 'number' ? `MK-${app.profileNo}` : ''),
    username: safeStr(app?.username),
    age: typeof app?.age === 'number' ? app.age : asNum(app?.age),
    gender: safeStr(app?.gender),
    city: safeStr(app?.city),
    country: safeStr(app?.country),
    photoUrls: Array.isArray(app?.photoUrls) ? app.photoUrls.filter((u) => typeof u === 'string' && u.trim()) : [],
    about: clip(app?.about, 360),
    aboutTr: clip(app?.aboutTr, 360),
    aboutId: clip(app?.aboutId, 360),
    expectations: clip(app?.expectations, 360),
    expectationsTr: clip(app?.expectationsTr, 360),
    expectationsId: clip(app?.expectationsId, 360),
    details: {
      maritalStatus: safeStr(details?.maritalStatus),
      occupation: safeStr(details?.occupation),
      hasChildren: safeStr(details?.hasChildren),
      childrenCount: asNum(details?.childrenCount),
      childrenLivingSituation: safeStr(details?.childrenLivingSituation),
    },
  };
}

function usage(exitCode = 0) {
  console.log('Kullanım: node scripts/backfill-pre-match-legacy-mirrors.mjs --uid <uid> [--dryRun]');
  process.exit(exitCode);
}

loadEnvLocal();

const uid = safeStr(getArgValue('--uid'));
if (!uid) usage(1);
const dryRun = hasFlag('--dryRun');

const firebaseAdminPath = path.join(projectRoot, 'apiRoutes', '_firebaseAdmin.js');
const { getAdmin } = await import(pathToFileURL(firebaseAdminPath).href);
const { db, FieldValue } = getAdmin();

const inboxSnap = await db.collection('matchmakingUsers').doc(uid).collection('inboxPreMatchRequests').where('status', '==', 'pending').limit(100).get();
const pending = inboxSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));

let updated = 0;
const details = [];

for (const req of pending) {
  const fromUid = safeStr(req?.fromUid);
  const toUid = safeStr(req?.toUid) || uid;
  if (!fromUid || !toUid) continue;

  const [fromAppsSnap, toAppsSnap, fromUserSnap, toUserSnap] = await Promise.all([
    db.collection('matchmakingApplications').where('userId', '==', fromUid).limit(10).get(),
    db.collection('matchmakingApplications').where('userId', '==', toUid).limit(10).get(),
    db.collection('matchmakingUsers').doc(fromUid).get(),
    db.collection('matchmakingUsers').doc(toUid).get(),
  ]);

  const fromApps = fromAppsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
  const toApps = toAppsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
  const fromApp = pickBestNonStubApplication(fromApps);
  const toApp = pickBestNonStubApplication(toApps);
  if (!fromApp || !toApp) {
    details.push({ requestId: req.id, skipped: 'application_not_found' });
    continue;
  }

  const fromUser = fromUserSnap.exists ? (fromUserSnap.data() || {}) : {};
  const toUser = toUserSnap.exists ? (toUserSnap.data() || {}) : {};

  const userIdsSorted = [fromUid, toUid].slice().sort();
  const aUserId = userIdsSorted[0];
  const bUserId = userIdsSorted[1];
  const requesterSide = fromUid === aUserId ? 'a' : 'b';
  const matchId = `${aUserId}__${bUserId}`;
  const matchRef = db.collection('matchmakingMatches').doc(matchId);
  const existingSnap = await matchRef.get();
  const existing = existingSnap.exists ? (existingSnap.data() || {}) : {};
  const existingStatus = safeStr(existing?.status);

  if (existingStatus === 'mutual_interest' || existingStatus === 'mutual_accepted' || existingStatus === 'contact_unlocked') {
    details.push({ requestId: req.id, matchId, skipped: 'already_progressed' });
    continue;
  }

  const aApp = safeStr(fromApp?.userId) === aUserId ? fromApp : toApp;
  const bApp = safeStr(fromApp?.userId) === bUserId ? fromApp : toApp;
  const aUser = aUserId === fromUid ? fromUser : toUser;
  const bUser = bUserId === fromUid ? fromUser : toUser;

  const existingDecisions = existing?.decisions && typeof existing.decisions === 'object' ? existing.decisions : {};
  const decisions = {
    a: safeStr(existingDecisions?.a) || null,
    b: safeStr(existingDecisions?.b) || null,
  };
  decisions[requesterSide] = 'accept';

  const patch = {
    userIds: userIdsSorted,
    aUserId,
    bUserId,
    aApplicationId: safeStr(aApp?.id),
    bApplicationId: safeStr(bApp?.id),
    scoreAtoB: null,
    scoreBtoA: null,
    score: null,
    matchTier: 'pre_match',
    createdBy: 'pre_match_request',
    status: 'proposed',
    decisions,
    profiles: {
      a: buildMatchProfile(aApp, aUser),
      b: buildMatchProfile(bApp, bUser),
    },
    createdAt: existingSnap.exists ? existing?.createdAt || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
    createdAtMs: existingSnap.exists ? (typeof existing?.createdAtMs === 'number' ? existing.createdAtMs : Date.now()) : Date.now(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtMs: Date.now(),
  };

  if (existingStatus === 'cancelled') {
    patch.cancelledAt = FieldValue.delete();
    patch.cancelledAtMs = FieldValue.delete();
    patch.cancelledByUserId = FieldValue.delete();
    patch.cancelledReason = FieldValue.delete();
  }

  if (!dryRun) {
    await matchRef.set(patch, { merge: true });
  }

  updated += 1;
  details.push({ requestId: req.id, matchId, updated: true });
}

console.log(JSON.stringify({ ok: true, uid, dryRun, pendingCount: pending.length, updated, details }, null, 2));