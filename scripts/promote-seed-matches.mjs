import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnvLocal() {
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

    const current = process.env[key];
    if (current === undefined || String(current).trim() === '') {
      if (key.toUpperCase().includes('PRIVATE_KEY')) {
        process.env[key] = value.replace(/\\n/g, '\n');
      } else {
        process.env[key] = value;
      }
    }
  }
}

function parseArgs(argv) {
  const args = { _: [] };
  for (const a of argv) {
    if (!a.startsWith('--')) {
      args._.push(a);
      continue;
    }

    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) {
      args[m[1]] = m[2];
    } else {
      args[a.slice(2)] = true;
    }
  }
  return args;
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

loadEnvLocal();

const args = parseArgs(process.argv.slice(2));
const limit = Math.max(1, Math.min(50, Number(args.limit || 3)));
const seedTag = safeStr(args.seedTag) || 'mk_seed';
const batch = safeStr(args.batch);
const to = safeStr(args.to) || 'mutual_accepted';
const interaction = safeStr(args.interaction);

if (to !== 'mutual_accepted' && to !== 'contact_unlocked') {
  // eslint-disable-next-line no-console
  console.error('Invalid --to. Use mutual_accepted or contact_unlocked');
  process.exitCode = 2;
}

const { db, FieldValue } = getAdmin();

async function run() {
  // Index istemeyen güvenli sorgu: sadece tek eşitlik filtresi.
  // Batch filtresini (varsa) client-side uyguluyoruz.
  const q = db.collection('matchmakingMatches').where('seedTag', '==', seedTag).limit(200);
  const snap = await q.get();
  const docs = snap.docs || [];

  const candidates = [];
  for (const d of docs) {
    const data = d.data() || {};
    if (batch && String(data.seedBatchId || '') !== batch) continue;
    const st = String(data.status || '');
    if (st === 'proposed' || st === 'mutual_accepted' || st === 'contact_unlocked') {
      candidates.push({ id: d.id, ref: d.ref, data });
    }
  }

  const picked = candidates.filter((x) => String(x.data?.status || '') === 'proposed').slice(0, limit);
  const fallback = picked.length < limit ? candidates.slice(picked.length, limit) : [];
  const target = picked.concat(fallback).slice(0, limit);

  if (!target.length) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ ok: true, promoted: 0, note: 'No seed matches found.', seedTag, batch }, null, 2));
    return;
  }

  const results = [];

  for (const m of target) {
    const patch = {
      updatedAt: FieldValue.serverTimestamp(),
      seedPromotedAt: FieldValue.serverTimestamp(),
      seedPromotedTo: to,
      decisions: { a: 'accept', b: 'accept' },
    };

    const matchId = String(m.id || '');
    const data = m.data || {};
    const userIds = Array.isArray(data.userIds) ? data.userIds.map(String).filter(Boolean) : [];
    const aUserId = safeStr(data.aUserId) || userIds[0] || '';
    const bUserId = safeStr(data.bUserId) || userIds[1] || '';

    if (to === 'mutual_accepted') {
      const nowMs = Date.now();
      patch.status = 'mutual_accepted';
      patch.mutualAcceptedAt = FieldValue.serverTimestamp();
      patch.mutualAcceptedAtMs = nowMs;
      patch.interactionMode = interaction === 'chat' ? 'chat' : null;
      patch.interactionChosenAt = interaction === 'chat' ? FieldValue.serverTimestamp() : null;
      patch.interactionChoices = {};
      patch.contactUnlockedAt = null;

      if (interaction === 'chat') {
        patch.chatEnabledAt = FieldValue.serverTimestamp();
        patch.chatEnabledAtMs = nowMs;
      }

      // Seed testlerinde gerçek akışa daha yakın olsun diye iki tarafı da bu match'e kilitle.
      // (Normalde bu kilit, /api/matchmaking-decision mutual accept sırasında yazılır.)
      if (matchId && aUserId && bUserId) {
        const lockPatch = {
          matchmakingLock: { active: true, matchId, matchCode: '' },
          matchmakingChoice: { active: true, matchId, matchCode: '' },
          updatedAt: FieldValue.serverTimestamp(),
        };
        await Promise.all([
          db.collection('matchmakingUsers').doc(aUserId).set(lockPatch, { merge: true }),
          db.collection('matchmakingUsers').doc(bUserId).set(lockPatch, { merge: true }),
        ]);
      }
    } else {
      // Basit demo: contact_unlocked için gerekli alanları set ediyoruz.
      // Not: Bu demo, kullanıcı kilidi (matchmakingLock) da açsın istiyorsan ekleyebiliriz.
      patch.status = 'contact_unlocked';
      patch.mutualAcceptedAt = FieldValue.serverTimestamp();
      patch.interactionMode = 'contact';
      patch.interactionChosenAt = FieldValue.serverTimestamp();
      patch.interactionChoices = {};
      patch.contactUnlockedAt = FieldValue.serverTimestamp();
    }

    await m.ref.set(patch, { merge: true });
    results.push({ matchId: m.id, from: String(m.data?.status || ''), to });
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        promoted: results.length,
        seedTag,
        batch: batch || null,
        results,
      },
      null,
      2
    )
  );
}

await run();
