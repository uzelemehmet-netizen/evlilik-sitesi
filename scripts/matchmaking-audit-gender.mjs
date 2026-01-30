import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeGender(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'male' || s === 'm' || s === 'man' || s === 'erkek') return 'male';
  if (s === 'female' || s === 'f' || s === 'woman' || s === 'kadin' || s === 'kadın') return 'female';
  return '';
}

function parseArgs(argv) {
  const out = { limit: 5000, sinceDays: 180 };
  for (let i = 2; i < argv.length; i += 1) {
    const a = String(argv[i] || '');
    const next = argv[i + 1];
    if (a === '--limit') out.limit = Math.max(1, Math.min(20000, Number(next || 0) || 5000));
    if (a === '--sinceDays') out.sinceDays = Math.max(1, Math.min(3650, Number(next || 0) || 180));
  }
  return out;
}

async function main() {
  const opts = parseArgs(process.argv);
  const { db } = getAdmin();

  const now = Date.now();
  const cutoffMs = now - opts.sinceDays * 24 * 60 * 60 * 1000;

  // Note: createdAtMs is set by our writers; if absent, match may be older/legacy.
  const snap = await db
    .collection('matchmakingMatches')
    .where('createdAtMs', '>=', cutoffMs)
    .orderBy('createdAtMs', 'desc')
    .limit(opts.limit)
    .get();

  const counts = {
    mm: 0,
    ff: 0,
    mf: 0,
    fm: 0,
    unknown: 0,
    total: 0,
  };

  const examples = { mm: [], ff: [], unknown: [] };

  for (const d of snap.docs) {
    const m = d.data() || {};
    const profiles = m?.profiles && typeof m.profiles === 'object' ? m.profiles : {};

    const aG = normalizeGender(profiles?.a?.gender);
    const bG = normalizeGender(profiles?.b?.gender);

    counts.total += 1;

    if (!aG || !bG) {
      counts.unknown += 1;
      if (examples.unknown.length < 10) examples.unknown.push(d.id);
      continue;
    }

    const key = `${aG[0]}${bG[0]}`; // mm/ff/mf/fm
    if (key === 'mm') {
      counts.mm += 1;
      if (examples.mm.length < 10) examples.mm.push(d.id);
    } else if (key === 'ff') {
      counts.ff += 1;
      if (examples.ff.length < 10) examples.ff.push(d.id);
    } else if (key === 'mf') {
      counts.mf += 1;
    } else if (key === 'fm') {
      counts.fm += 1;
    } else {
      counts.unknown += 1;
      if (examples.unknown.length < 10) examples.unknown.push(d.id);
    }
  }

  console.log('--- Matchmaking gender audit ---');
  console.log(`sinceDays=${opts.sinceDays} limit=${opts.limit}`);
  console.log(counts);

  if (examples.mm.length) console.log('Same-sex male/male examples:', examples.mm.join(', '));
  if (examples.ff.length) console.log('Same-sex female/female examples:', examples.ff.join(', '));
  if (examples.unknown.length) console.log('Unknown gender examples:', examples.unknown.join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
