import fs from 'node:fs';
import path from 'node:path';

import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

function loadEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
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

      const current = process.env[key];
      const shouldOverride = key.startsWith('FIREBASE_SERVICE_ACCOUNT');
      if (shouldOverride || current === undefined || String(current).trim() === '') {
        process.env[key] = key.toUpperCase().includes('PRIVATE_KEY') ? value.replace(/\\n/g, '\n') : value;
      }
    }
  } catch {
    // ignore
  }
}

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  const v = process.argv[idx + 1];
  if (!v || v.startsWith('--')) return null;
  return v;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function parseCsvList(s) {
  if (!s) return [];
  return String(s)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

async function countCollection(colRef) {
  // Prefer Firestore aggregation count if available.
  try {
    if (typeof colRef.count === 'function') {
      const snap = await colRef.count().get();
      const data = snap.data();
      if (data && typeof data.count === 'number') return data.count;
    }
  } catch {
    // fallback below
  }

  try {
    const snap = await colRef.get();
    return snap.size;
  } catch {
    return null;
  }
}

async function sampleLatest(colRef, { orderField = 'createdAtMs', limit = 3 } = {}) {
  try {
    const snap = await colRef.orderBy(orderField, 'desc').limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
  } catch {
    try {
      const snap2 = await colRef.limit(limit).get();
      return snap2.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
    } catch {
      return [];
    }
  }
}

function pickFields(doc) {
  const createdAtMs = typeof doc?.createdAtMs === 'number' ? doc.createdAtMs : null;
  const type = typeof doc?.type === 'string' ? doc.type : null;
  const fromUid = typeof doc?.fromUid === 'string' ? doc.fromUid : null;
  const toUid = typeof doc?.toUid === 'string' ? doc.toUid : null;
  const status = typeof doc?.status === 'string' ? doc.status : null;
  const matchId = typeof doc?.matchId === 'string' ? doc.matchId : null;
  const requestId = typeof doc?.requestId === 'string' ? doc.requestId : null;
  const text = typeof doc?.text === 'string' ? doc.text.slice(0, 80) : null;
  return { id: doc?.id || null, createdAtMs, type, status, fromUid, toUid, matchId, requestId, text };
}

async function main() {
  loadEnvLocal();

  const limitUsersRaw = Number(argValue('--limitUsers') || 50);
  const limitUsers = Number.isFinite(limitUsersRaw) && limitUsersRaw > 0 ? Math.floor(limitUsersRaw) : 50;

  const uidsFilter = parseCsvList(argValue('--uids'));
  const showSamples = hasFlag('--samples');

  const { db, projectId } = getAdmin();

  const usersSnap = await db.collection('matchmakingUsers').limit(200).get();
  const userIds = usersSnap.docs.map((d) => d.id);

  const filtered = uidsFilter.length ? userIds.filter((u) => uidsFilter.includes(u)) : userIds;
  const take = filtered.slice(0, limitUsers);

  const subcols = [
    'inboxLikes',
    'inboxAccessRequests',
    'outboxAccessRequests',
    'profileAccessGranted',
    'inboxMessages',
    'outboxMessages',
  ];

  const results = [];

  for (const uid of take) {
    const baseRef = db.collection('matchmakingUsers').doc(uid);

    const row = { uid, counts: {}, samples: {} };
    for (const name of subcols) {
      const col = baseRef.collection(name);
      const c = await countCollection(col);
      row.counts[name] = c;

      if (showSamples && (c || 0) > 0) {
        const docs = await sampleLatest(col, { orderField: 'createdAtMs', limit: 3 });
        row.samples[name] = docs.map(pickFields);
      }
    }

    results.push(row);
  }

  const totals = {};
  for (const name of subcols) totals[name] = 0;
  for (const r of results) {
    for (const name of subcols) {
      const v = r.counts[name];
      if (typeof v === 'number') totals[name] += v;
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        firebaseProjectId: projectId || null,
        limitUsers,
        scannedUsers: results.length,
        totals,
        users: results,
        note:
          'Subcollectionlar Firestore Console’da sadece icinde dokuman varsa gorunur. Bu rapor; mesaj/begeni/istek yazilmis mi diye sayim yapar.',
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error('matchmaking-audit-inboxes failed:', e?.message || e);
  process.exitCode = 1;
});
