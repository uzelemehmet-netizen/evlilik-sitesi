import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asNum(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toInt(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function parseArgs(argv) {
  const out = {
    limit: 250,
    uid: '',
    includeStubs: false,
    includeComplete: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--limit') out.limit = Math.max(1, toInt(argv[i + 1], out.limit));
    if (a === '--uid') out.uid = safeStr(argv[i + 1]);
    if (a === '--include-stubs') out.includeStubs = true;
    if (a === '--include-complete') out.includeComplete = true;
  }

  return out;
}

function normalizeGender(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'male' || s === 'm' || s === 'man' || s === 'erkek') return 'male';
  if (s === 'female' || s === 'f' || s === 'woman' || s === 'kadin' || s === 'kadın') return 'female';
  return '';
}

function normalizeMaritalStatus(v) {
  return safeStr(v).toLowerCase();
}

function isStubApplication(a) {
  const source = safeStr(a?.source).toLowerCase();
  if (source === 'auto_stub') return true;
  if (a?.details?.autoBootstrap === true) return true;
  return false;
}

function ageFromBirthYearMaybe(v) {
  const year = asNum(v);
  if (!(typeof year === 'number' && Number.isFinite(year) && year >= 1900 && year <= 2100)) return null;
  const now = new Date();
  const age = now.getFullYear() - Math.trunc(year);
  return age >= 18 && age <= 99 ? age : null;
}

function ageFromDateMaybe(v) {
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

function getAge(obj) {
  const it = obj && typeof obj === 'object' ? obj : {};
  const details = it?.details && typeof it.details === 'object' ? it.details : {};

  const direct = asNum(it?.age);
  if (typeof direct === 'number' && Number.isFinite(direct) && direct >= 18 && direct <= 99) return direct;

  const nested = asNum(details?.age);
  if (typeof nested === 'number' && Number.isFinite(nested) && nested >= 18 && nested <= 99) return nested;

  const byYear = ageFromBirthYearMaybe(details?.birthYear ?? it?.birthYear);
  if (byYear !== null) return byYear;

  const byDate =
    ageFromDateMaybe(details?.birthDateMs ?? it?.birthDateMs) ??
    ageFromDateMaybe(details?.birthDate ?? it?.birthDate) ??
    ageFromDateMaybe(details?.dob ?? it?.dob);
  if (byDate !== null) return byDate;

  return null;
}

function pickOccupation(details, obj) {
  const d = details && typeof details === 'object' ? details : {};
  const a = obj && typeof obj === 'object' ? obj : {};
  return (
    safeStr(d?.occupationTr) ||
    safeStr(d?.occupation) ||
    safeStr(d?.occupationId) ||
    safeStr(a?.occupation) ||
    safeStr(d?.job) ||
    safeStr(d?.jobTitle) ||
    safeStr(d?.profession) ||
    safeStr(a?.job) ||
    safeStr(a?.jobTitle) ||
    safeStr(a?.profession) ||
    ''
  );
}

function pickMaritalStatus(details, obj) {
  const d = details && typeof details === 'object' ? details : {};
  const a = obj && typeof obj === 'object' ? obj : {};
  return (
    safeStr(d?.maritalStatus) ||
    safeStr(a?.maritalStatus) ||
    safeStr(d?.marital) ||
    safeStr(a?.marital) ||
    safeStr(d?.medeniDurum) ||
    safeStr(a?.medeniDurum) ||
    safeStr(d?.marital_status) ||
    safeStr(a?.marital_status) ||
    ''
  );
}

function pickHasChildren(details, obj) {
  const d = details && typeof details === 'object' ? details : {};
  const a = obj && typeof obj === 'object' ? obj : {};

  const raw =
    safeStr(d?.hasChildren) ||
    safeStr(a?.hasChildren) ||
    safeStr(d?.children) ||
    safeStr(a?.children) ||
    safeStr(d?.childStatus) ||
    safeStr(a?.childStatus) ||
    safeStr(d?.has_children) ||
    safeStr(a?.has_children);
  if (raw) return raw;

  if (typeof d?.hasChildren === 'boolean') return d.hasChildren ? 'yes' : 'no';
  if (typeof a?.hasChildren === 'boolean') return a.hasChildren ? 'yes' : 'no';

  return '';
}

function pickChildrenCount(details, obj) {
  const d = details && typeof details === 'object' ? details : {};
  const a = obj && typeof obj === 'object' ? obj : {};
  const raw = d?.childrenCount ?? d?.childCount ?? d?.children_count ?? d?.child_count ?? a?.childrenCount ?? a?.childCount;
  const n = asNum(raw);
  if (!(typeof n === 'number' && Number.isFinite(n))) return null;
  const i = Math.trunc(n);
  if (i < 0 || i > 20) return null;
  return i;
}

function getOwnerUid(app) {
  return safeStr(app?.userId) || safeStr(app?.uid) || safeStr(app?.userUid) || null;
}

function checkMinimum(app) {
  const a = app && typeof app === 'object' ? app : {};
  const details = a?.details && typeof a.details === 'object' ? a.details : {};

  const missing = [];

  if (!safeStr(a?.fullName)) missing.push('fullName');

  const age = getAge(a);
  if (!(typeof age === 'number' && Number.isFinite(age) && age >= 18 && age <= 99)) missing.push('age');

  if (!normalizeGender(a?.gender)) missing.push('gender');
  if (!safeStr(a?.city)) missing.push('city');
  if (!safeStr(a?.country)) missing.push('country');
  if (!safeStr(a?.nationality)) missing.push('nationality');

  if (!pickOccupation(details, a)) missing.push('occupation');
  const ms = normalizeMaritalStatus(pickMaritalStatus(details, a));
  if (!ms) missing.push('maritalStatus');

  if (ms === 'widowed' || ms === 'divorced') {
    const hc = safeStr(pickHasChildren(details, a)).toLowerCase();
    if (!hc) missing.push('hasChildren');
    if (hc === 'yes') {
      const cnt = pickChildrenCount(details, a);
      if (!(typeof cnt === 'number' && Number.isFinite(cnt) && cnt >= 1 && cnt <= 20)) missing.push('childrenCount');
    }
  }

  return { ok: missing.length === 0, missing };
}

async function defaultServiceAccountFromRepoIfMissing() {
  if (
    !process.env.FIREBASE_SERVICE_ACCOUNT_JSON &&
    !process.env.FIREBASE_SERVICE_ACCOUNT &&
    !process.env.FIREBASE_SERVICE_ACCOUNT_JSON_FILE &&
    !process.env.FIREBASE_SERVICE_ACCOUNT_FILE
  ) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const defaultPath = path.resolve(__dirname, '../secrets/firebase-service-account.json');
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON_FILE = defaultPath;
  }
}

async function main() {
  await defaultServiceAccountFromRepoIfMissing();

  const args = parseArgs(process.argv.slice(2));
  const { db, projectId } = getAdmin();

  let docs = [];

  if (args.uid) {
    const uid = args.uid;
    const [s1, s2, s3] = await Promise.all([
      db.collection('matchmakingApplications').where('userId', '==', uid).limit(25).get(),
      db.collection('matchmakingApplications').where('uid', '==', uid).limit(25).get(),
      db.collection('matchmakingApplications').where('userUid', '==', uid).limit(25).get(),
    ]);

    const all = [...(s1?.docs || []), ...(s2?.docs || []), ...(s3?.docs || [])];
    const seen = new Set();
    for (const d of all) {
      const id = safeStr(d?.id);
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      docs.push(d);
    }
  } else {
    const snap = await db.collection('matchmakingApplications').orderBy('createdAtMs', 'desc').limit(args.limit).get();
    docs = snap?.docs || [];
  }

  const items = [];
  let scanned = 0;
  let stub = 0;
  let nonStub = 0;
  let complete = 0;
  let incomplete = 0;

  for (const d of docs) {
    const data = d.data() || {};
    scanned += 1;

    const isStub = isStubApplication(data);
    if (isStub) stub += 1;
    else nonStub += 1;

    if (!args.includeStubs && isStub) continue;

    const check = checkMinimum(data);
    if (check.ok) complete += 1;
    else incomplete += 1;

    if (!args.includeComplete && check.ok) continue;

    items.push({
      id: safeStr(d.id),
      ownerUid: getOwnerUid(data),
      source: safeStr(data?.source) || null,
      createdAtMs: typeof data?.createdAtMs === 'number' ? data.createdAtMs : null,
      isStub,
      ok: check.ok,
      missing: check.missing,
    });
  }

  const payload = {
    ok: true,
    projectId: projectId || null,
    args,
    stats: {
      scanned,
      stub,
      nonStub,
      complete,
      incomplete,
      returned: items.length,
    },
    items,
  };

  process.stdout.write(JSON.stringify(payload, null, 2));
  process.stdout.write('\n');
}

main().catch((e) => {
  process.stderr.write(String(e?.stack || e?.message || e));
  process.stderr.write('\n');
  process.exitCode = 1;
});
