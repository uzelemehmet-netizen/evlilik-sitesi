import fs from 'node:fs';
import path from 'node:path';

import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';
import { normalizeCompletedStubApplication, shouldPromoteStubApplication } from '../apiRoutes/_matchmakingApplicationActivation.js';

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
      if (current === undefined || String(current).trim() === '') {
        process.env[key] = key.toUpperCase().includes('PRIVATE_KEY') ? value.replace(/\\n/g, '\n') : value;
      }
    }
  } catch {
    // ignore
  }
}

function argValue(flag, fallback = '') {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  const next = process.argv[idx + 1];
  if (!next || next.startsWith('--')) return fallback;
  return String(next).trim();
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

loadEnvLocal();

const applyFix = hasFlag('--apply');
const limitRaw = Number(argValue('--limit', '500'));
const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.trunc(limitRaw), 5000) : 500;

const { db, FieldValue } = getAdmin();

const stubSnap = await db.collection('matchmakingApplications').where('source', '==', 'auto_stub').limit(limit).get();
const docs = stubSnap.docs || [];

let normalizedCount = 0;
let candidateCount = 0;
const results = [];

for (const doc of docs) {
  const app = doc.data() || {};
  const uid = safeStr(app?.userId);
  if (!uid) {
    results.push({ applicationId: doc.id, uid: '', action: 'skip', reason: 'missing_uid' });
    continue;
  }

  const userSnap = await db.collection('matchmakingUsers').doc(uid).get();
  const userDoc = userSnap.exists ? (userSnap.data() || {}) : {};
  const canPromote = shouldPromoteStubApplication(app, userDoc);
  if (!canPromote) {
    results.push({ applicationId: doc.id, uid, userCode: safeStr(userDoc?.userCode), action: 'skip', reason: 'not_completed' });
    continue;
  }

  candidateCount += 1;

  if (!applyFix) {
    results.push({ applicationId: doc.id, uid, userCode: safeStr(userDoc?.userCode), action: 'candidate' });
    continue;
  }

  const normalized = await normalizeCompletedStubApplication({
    db,
    FieldValue,
    uid,
    applicationId: doc.id,
    app,
    userDoc,
  });

  if (normalized?.normalized) {
    normalizedCount += 1;
    results.push({ applicationId: doc.id, uid, userCode: safeStr(userDoc?.userCode), action: 'normalized' });
  } else {
    results.push({ applicationId: doc.id, uid, userCode: safeStr(userDoc?.userCode), action: 'skip', reason: normalized?.reason || 'not_completed' });
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: applyFix ? 'apply' : 'dry-run',
      scanned: docs.length,
      candidateCount,
      normalizedCount,
      limit,
      truncated: docs.length === limit,
      results,
    },
    null,
    2
  )
);