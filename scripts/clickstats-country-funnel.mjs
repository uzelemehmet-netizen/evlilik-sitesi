import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

function toInt(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function parseDateYYYYMMDD(v) {
  const s = safeStr(v);
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return s;
}

function dayKeyTRFromMs(ms) {
  const offsetMs = 180 * 60 * 1000;
  const d = new Date(ms + offsetMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayKeysLastNDays(n, nowMs) {
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const ms = nowMs - i * 24 * 60 * 60 * 1000;
    out.push(dayKeyTRFromMs(ms));
  }
  return out;
}

function safeNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function parseArgs(argv) {
  const out = {
    days: 14,
    dayKey: null,
    country: 'ID',
    includeAllKeys: false,
    topKeys: 40,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--days') out.days = Math.min(31, Math.max(1, toInt(argv[i + 1], out.days)));
    if (a === '--dayKey') out.dayKey = parseDateYYYYMMDD(argv[i + 1]) || null;
    if (a === '--country') out.country = safeStr(argv[i + 1] || out.country).toUpperCase();
    if (a === '--includeAllKeys') {
      const v = safeStr(argv[i + 1]).toLowerCase();
      out.includeAllKeys = v === '1' || v === 'true' || v === 'yes' || v === 'on';
    }
    if (a === '--topKeys') out.topKeys = Math.min(300, Math.max(5, toInt(argv[i + 1], out.topKeys)));
  }

  return out;
}

function sumCountryForKey(doc, eventKey, country) {
  const events = doc?.events && typeof doc.events === 'object' ? doc.events : {};
  const e = events?.[eventKey];
  const c = e?.countries && typeof e.countries === 'object' ? e.countries : {};
  return safeNum(c?.[country]);
}

function sumCountryForPrefix(doc, prefix, country) {
  const events = doc?.events && typeof doc.events === 'object' ? doc.events : {};
  const p = safeStr(prefix);
  let total = 0;
  for (const [k, v] of Object.entries(events)) {
    if (!k.startsWith(p)) continue;
    const c = v?.countries && typeof v.countries === 'object' ? v.countries : {};
    total += safeNum(c?.[country]);
  }
  return total;
}

function collectAllCountryKeys(doc, country) {
  const events = doc?.events && typeof doc.events === 'object' ? doc.events : {};
  const out = new Map();
  for (const [k, v] of Object.entries(events)) {
    const c = v?.countries && typeof v.countries === 'object' ? v.countries : {};
    const n = safeNum(c?.[country]);
    if (!n) continue;
    out.set(k, (out.get(k) || 0) + n);
  }
  return out;
}

async function main() {
  // Default to local repo secret file if env isn't set.
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

  const args = parseArgs(process.argv.slice(2));
  const { db, projectId } = getAdmin();

  const nowMs = Date.now();
  const keys = args.dayKey ? [args.dayKey] : dayKeysLastNDays(args.days, nowMs);

  const refs = keys.map((k) => db.collection('clickStats').doc(k));
  let snaps = [];
  try {
    snaps = refs.length ? await db.getAll(...refs) : [];
  } catch {
    snaps = await Promise.all(refs.map((r) => r.get()));
  }

  const totals = {
    session_start: 0,
    landing_login_signup: 0,
    landing_login_login: 0,
    landing_login_auto_signup: 0,
    signup_start_google: 0,
    signup_start_email: 0,
    signup_success: 0,
    signup_error: 0,
    login_start_google: 0,
    login_start_email: 0,
    login_error: 0,
  };

  const byKey = new Map();

  for (let i = 0; i < keys.length; i += 1) {
    const snap = snaps[i];
    const doc = snap && snap.exists ? snap.data() || {} : null;
    if (!doc) continue;

    totals.session_start += sumCountryForKey(doc, 'session_start', args.country);
    totals.landing_login_signup += sumCountryForKey(doc, 'landing_login_signup', args.country);
    totals.landing_login_login += sumCountryForKey(doc, 'landing_login_login', args.country);
    totals.landing_login_auto_signup += sumCountryForKey(doc, 'landing_login_auto_signup', args.country);

    totals.signup_start_google += sumCountryForKey(doc, 'signup_start:google', args.country);
    totals.signup_start_email += sumCountryForKey(doc, 'signup_start:email', args.country);
    totals.signup_success += sumCountryForPrefix(doc, 'signup_success:', args.country);
    totals.signup_error += sumCountryForPrefix(doc, 'signup_error:', args.country);

    totals.login_start_google += sumCountryForKey(doc, 'login_start:google', args.country);
    totals.login_start_email += sumCountryForKey(doc, 'login_start:email', args.country);
    totals.login_error += sumCountryForPrefix(doc, 'login_error:', args.country);

    if (args.includeAllKeys) {
      const m = collectAllCountryKeys(doc, args.country);
      for (const [k, v] of m.entries()) byKey.set(k, (byKey.get(k) || 0) + v);
    } else {
      const focusPrefixes = ['signup_error:', 'login_error:', 'signup_fallback:', 'signup_success:', 'signup_start:', 'landing_login_'];
      const events = doc?.events && typeof doc.events === 'object' ? doc.events : {};
      for (const [k, v] of Object.entries(events)) {
        if (!focusPrefixes.some((p) => k.startsWith(p))) continue;
        const c = v?.countries && typeof v.countries === 'object' ? v.countries : {};
        const n = safeNum(c?.[args.country]);
        if (!n) continue;
        byKey.set(k, (byKey.get(k) || 0) + n);
      }
    }
  }

  const signupStarts = totals.signup_start_google + totals.signup_start_email;
  const signupSuccess = totals.signup_success;
  const signupErrors = totals.signup_error;

  const derived = {
    signupStarts,
    signupSuccess,
    signupErrors,
    signupSuccessRate: signupStarts ? signupSuccess / signupStarts : null,
    signupErrorRate: signupStarts ? signupErrors / signupStarts : null,
  };

  const topKeys = Array.from(byKey.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, args.topKeys)
    .map(([eventKey, total]) => ({ eventKey, total }));

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        projectId: projectId || null,
        country: args.country,
        dayKeys: keys,
        totals,
        derived,
        topKeys,
      },
      null,
      2
    )
  );
  process.stdout.write('\n');
}

main().catch((e) => {
  process.stderr.write(String(e?.stack || e?.message || e));
  process.stderr.write('\n');
  process.exitCode = 1;
});
