import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Reuse the same admin initialization logic used by API routes
import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

function toInt(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function parseDateYYYYMMDD(v) {
  const s = typeof v === 'string' ? v.trim() : '';
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

function getEventTotal(doc, key) {
  const events = doc?.events && typeof doc.events === 'object' ? doc.events : {};
  return safeNum(events?.[key]?.total);
}

function sumEventTotalsByPrefix(doc, prefix) {
  const events = doc?.events && typeof doc.events === 'object' ? doc.events : {};
  const out = {};
  const p = String(prefix || '');
  if (!p) return out;
  for (const [k, v] of Object.entries(events)) {
    if (!k.startsWith(p)) continue;
    out[k] = safeNum(v?.total);
  }
  return out;
}

function topEvents(doc, topN) {
  const events = doc?.events && typeof doc.events === 'object' ? doc.events : {};
  const arr = Object.entries(events).map(([eventKey, data]) => ({
    eventKey,
    total: safeNum(data?.total),
    countries: data?.countries && typeof data.countries === 'object' ? data.countries : {},
  }));
  arr.sort((a, b) => b.total - a.total);
  return arr.slice(0, Math.max(0, topN));
}

function topCountriesFromEvents(events, topN) {
  const totals = new Map();
  for (const e of events) {
    for (const [k, v] of Object.entries(e?.countries || {})) {
      totals.set(k, (totals.get(k) || 0) + safeNum(v));
    }
  }
  const arr = Array.from(totals.entries()).map(([k, v]) => ({ country: k, total: v }));
  arr.sort((a, b) => b.total - a.total);
  return arr.slice(0, Math.max(0, topN));
}

function msFromCreationTime(creationTime) {
  const s = typeof creationTime === 'string' ? creationTime.trim() : '';
  if (!s) return 0;
  const ms = new Date(s).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function dayStartEndUtcMsTR(dayKey) {
  // TR day boundary UTC+3.
  const offsetMs = 180 * 60 * 1000;
  const [y, m, d] = String(dayKey).split('-').map((x) => Number(x));
  const startUtcMs = Date.UTC(y, m - 1, d, 0, 0, 0) - offsetMs;
  const endUtcMs = startUtcMs + 24 * 60 * 60 * 1000;
  return { startUtcMs, endUtcMs };
}

function parseArgs(argv) {
  const out = {
    days: 7,
    dayKey: null,
    topEvents: 15,
    topCountries: 8,
    focus: 'signup',
    includeAuthSignups: true,
    authMaxPages: 200,
    topSignupErrors: 12,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--days') out.days = Math.min(31, Math.max(1, toInt(argv[i + 1], out.days)));
    if (a === '--dayKey') out.dayKey = parseDateYYYYMMDD(argv[i + 1]) || null;
    if (a === '--topEvents') out.topEvents = Math.min(200, Math.max(0, toInt(argv[i + 1], out.topEvents)));
    if (a === '--topCountries') out.topCountries = Math.min(200, Math.max(0, toInt(argv[i + 1], out.topCountries)));
    if (a === '--focus') out.focus = String(argv[i + 1] || '').trim() || out.focus;
    if (a === '--includeAuthSignups') {
      const v = String(argv[i + 1] || '').trim().toLowerCase();
      out.includeAuthSignups = v === '1' || v === 'true' || v === 'yes' || v === 'on';
    }
    if (a === '--authMaxPages') out.authMaxPages = Math.min(500, Math.max(1, toInt(argv[i + 1], out.authMaxPages)));
    if (a === '--topSignupErrors') out.topSignupErrors = Math.min(200, Math.max(0, toInt(argv[i + 1], out.topSignupErrors)));
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
  const { db, auth, projectId } = getAdmin();

  const nowMs = Date.now();
  const keys = args.dayKey ? [args.dayKey] : dayKeysLastNDays(args.days, nowMs);

  const refs = keys.map((k) => db.collection('clickStats').doc(k));
  let snaps = [];
  try {
    snaps = refs.length ? await db.getAll(...refs) : [];
  } catch {
    snaps = await Promise.all(refs.map((r) => r.get()));
  }

  const byDay = {};
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    const snap = snaps[i];
    byDay[k] = snap && snap.exists ? (snap.data() || {}) : null;
  }

  // Optional: count real signups from Firebase Auth in the same project.
  const authSignupsByDay = {};
  let scannedAuthUsers = 0;
  let pagesScanned = 0;
  let authPartial = false;
  if (args.includeAuthSignups) {
    for (const k of keys) authSignupsByDay[k] = 0;
    const ranges = {};
    for (const k of keys) ranges[k] = dayStartEndUtcMsTR(k);

    let pageToken = undefined;
    for (let page = 0; page < args.authMaxPages; page += 1) {
      pagesScanned += 1;
      // eslint-disable-next-line no-await-in-loop
      const result = await auth.listUsers(1000, pageToken);
      const users = Array.isArray(result?.users) ? result.users : [];
      scannedAuthUsers += users.length;

      for (const u of users) {
        const createdAtMs = msFromCreationTime(u?.metadata?.creationTime);
        if (!createdAtMs) continue;
        for (const k of keys) {
          const r = ranges[k];
          if (createdAtMs >= r.startUtcMs && createdAtMs < r.endUtcMs) {
            authSignupsByDay[k] += 1;
          }
        }
      }

      pageToken = result?.pageToken || null;
      if (!pageToken) break;
      if (page === args.authMaxPages - 1) authPartial = true;
    }
  }

  const summary = [];
  for (const k of keys) {
    const doc = byDay[k];
    const eventsTop = doc ? topEvents(doc, args.topEvents) : [];
    const countriesTop = eventsTop.length ? topCountriesFromEvents(eventsTop, args.topCountries) : [];

    const signupErrors = doc ? sumEventTotalsByPrefix(doc, 'signup_error:') : {};
    const signupErrorsTop = Object.entries(signupErrors)
      .map(([eventKey, total]) => ({ eventKey, total: safeNum(total) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, Math.max(0, args.topSignupErrors));

    const focus = String(args.focus || '').trim().toLowerCase();
    const funnel =
      focus === 'signup' || focus === 'funnel'
        ? {
            session_start: getEventTotal(doc, 'session_start'),
            landing_login_signup: getEventTotal(doc, 'landing_login_signup'),
            landing_login_login: getEventTotal(doc, 'landing_login_login'),
            signup_start_google: getEventTotal(doc, 'signup_start:google'),
            signup_start_email: getEventTotal(doc, 'signup_start:email'),
            // Success keys may vary; keep as prefix totals.
            signup_success: Object.values(sumEventTotalsByPrefix(doc, 'signup_success:')).reduce((a, b) => a + safeNum(b), 0),
            signup_error: Object.values(signupErrors).reduce((a, b) => a + safeNum(b), 0),
            landing_clickid: Object.values(sumEventTotalsByPrefix(doc, 'landing_clickid:')).reduce((a, b) => a + safeNum(b), 0),
            landing_ref: Object.values(sumEventTotalsByPrefix(doc, 'landing_ref:')).reduce((a, b) => a + safeNum(b), 0),
          }
        : null;

    summary.push({
      dayKey: k,
      totalUnique: safeNum(doc?.totalUnique),
      topEvents: eventsTop.map((e) => ({ eventKey: e.eventKey, total: e.total })),
      topCountries: countriesTop,
      funnel,
      signupErrorsTop,
      hasDoc: !!doc,
    });
  }

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        projectId: projectId || null,
        days: args.days,
        dayKeys: keys,
        authSignupsByDay: args.includeAuthSignups ? authSignupsByDay : null,
        scannedAuthUsers: args.includeAuthSignups ? scannedAuthUsers : null,
        pagesScanned: args.includeAuthSignups ? pagesScanned : null,
        authPartial: args.includeAuthSignups ? authPartial : null,
        summary,
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
