import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
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
  const seconds = typeof v?.seconds === 'number' ? v.seconds : null;
  const nanoseconds = typeof v?.nanoseconds === 'number' ? v.nanoseconds : 0;
  if (seconds !== null) return Math.floor(seconds * 1000 + nanoseconds / 1e6);
  return 0;
}

function safeBool(v) {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '').toLowerCase().trim();
  return s === '1' || s === 'true' || s === 'yes' || s === 'y';
}

function clampInt(v, { min = 0, max = 500 } = {}) {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function clearUserLockIfMatch(userDoc, matchId) {
  const lock = userDoc?.matchmakingLock || null;
  const choice = userDoc?.matchmakingChoice || null;

  const lockMatchId = safeStr(lock?.matchId);
  const choiceMatchId = safeStr(choice?.matchId);

  const patch = {};
  if (lockMatchId === matchId) patch.matchmakingLock = { active: false, matchId: '', matchCode: '' };
  if (choiceMatchId === matchId) patch.matchmakingChoice = { active: false, matchId: '', matchCode: '' };
  return patch;
}

async function fetchMatchesInWindow({ db, sinceMs, untilMs, limitMatches }) {
  // Önce ideal query'i dene (index gerekebilir). Olmazsa fallback yap.
  try {
    const snap = await db
      .collection('matchmakingMatches')
      .where('status', '==', 'proposed')
      .where('createdAtMs', '>=', sinceMs)
      .where('createdAtMs', '<=', untilMs)
      .orderBy('createdAtMs', 'desc')
      .limit(limitMatches)
      .get();

    return snap.docs.map((d) => ({ id: d.id, ref: d.ref, data: d.data() || {} }));
  } catch {
    // Fallback: son N kaydı çek, memory'de filtrele.
    const cap = Math.max(500, Math.min(5000, limitMatches * 20));
    const snap2 = await db.collection('matchmakingMatches').orderBy('createdAt', 'desc').limit(cap).get();
    const out = [];
    for (const d of snap2.docs) {
      const m = d.data() || {};
      if (safeStr(m?.status) !== 'proposed') continue;
      const createdAtMs = typeof m?.createdAtMs === 'number' ? m.createdAtMs : tsToMs(m?.createdAt);
      if (!createdAtMs) continue;
      if (createdAtMs < sinceMs || createdAtMs > untilMs) continue;
      out.push({ id: d.id, ref: d.ref, data: m });
      if (out.length >= limitMatches) break;
    }
    return out;
  }
}

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireAdmin(req);
    const adminUid = safeStr(decoded?.uid) || 'admin';

    const body = normalizeBody(req);
    const limitMatches = clampInt(body?.limitMatches ?? body?.limit ?? 200, { min: 1, max: 500 });
    const dryRun = safeBool(body?.dryRun);

    const { db, FieldValue } = getAdmin();

    // Varsayılan: matchmakingRuns/last zaman penceresi.
    const lastRunSnap = await db.collection('matchmakingRuns').doc('last').get();
    const lastRun = lastRunSnap.exists ? (lastRunSnap.data() || {}) : null;
    const startedAtMs = typeof lastRun?.startedAtMs === 'number' ? lastRun.startedAtMs : tsToMs(lastRun?.startedAt);
    const finishedAtMs = typeof lastRun?.finishedAtMs === 'number' ? lastRun.finishedAtMs : tsToMs(lastRun?.finishedAt);

    const nowMs = Date.now();

    // Opsiyonel override: sinceMs/untilMs.
    const sinceMs = typeof body?.sinceMs === 'number' ? body.sinceMs : Number(body?.sinceMs);
    const untilMs = typeof body?.untilMs === 'number' ? body.untilMs : Number(body?.untilMs);

    const windowStart = Number.isFinite(sinceMs) && sinceMs > 0 ? sinceMs : startedAtMs;
    const windowEnd = Number.isFinite(untilMs) && untilMs > 0 ? untilMs : (finishedAtMs || nowMs);

    if (!windowStart || windowEnd <= 0 || windowEnd < windowStart) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'invalid_window', startedAtMs, finishedAtMs }));
      return;
    }

    const matches = await fetchMatchesInWindow({ db, sinceMs: windowStart, untilMs: windowEnd, limitMatches });

    let cancelled = 0;
    let skipped = 0;
    let userPatchesApplied = 0;

    if (dryRun) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          ok: true,
          dryRun: true,
          window: { sinceMs: windowStart, untilMs: windowEnd },
          limitMatches,
          found: matches.length,
          sampleMatchIds: matches.slice(0, 20).map((m) => m.id),
        })
      );
      return;
    }

    // User doc cache: aynı UID birden çok match'te geçerse tekrar okuma.
    const userDocCache = new Map();

    const commitBatch = async (ops) => {
      if (!ops.length) return;
      const batch = db.batch();
      for (const op of ops) {
        batch.set(op.ref, op.data, { merge: true });
      }
      await batch.commit();
    };

    let ops = [];
    const flushIfNeeded = async () => {
      // Firestore batch limit 500; biraz pay bırakalım.
      if (ops.length >= 420) {
        await commitBatch(ops);
        ops = [];
      }
    };

    for (const m of matches) {
      const status = safeStr(m?.data?.status);
      if (status !== 'proposed') {
        skipped += 1;
        continue;
      }

      // Match iptali
      ops.push({
        ref: m.ref,
        data: {
          status: 'cancelled',
          cancelledAt: FieldValue.serverTimestamp(),
          cancelledAtMs: nowMs,
          cancelledByUserId: adminUid,
          cancelledReason: 'admin_rollback',
          rollbackWindowStartMs: windowStart,
          rollbackWindowEndMs: windowEnd,
          updatedAt: FieldValue.serverTimestamp(),
        },
      });
      cancelled += 1;

      // Kullanıcı lock/choice temizliği
      const userIds = Array.isArray(m?.data?.userIds) ? m.data.userIds.map(String).filter(Boolean) : [];
      for (const uid of userIds.slice(0, 2)) {
        if (!uid) continue;
        let uDoc = userDocCache.get(uid);
        if (!uDoc) {
          const snap = await db.collection('matchmakingUsers').doc(uid).get();
          uDoc = snap.exists ? (snap.data() || {}) : {};
          userDocCache.set(uid, uDoc);
        }

        const patch = clearUserLockIfMatch(uDoc, m.id);
        if (Object.keys(patch).length) {
          ops.push({
            ref: db.collection('matchmakingUsers').doc(uid),
            data: { ...patch, updatedAt: FieldValue.serverTimestamp() },
          });
          userPatchesApplied += 1;
        }
      }

      await flushIfNeeded();
    }

    if (ops.length) await commitBatch(ops);

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        dryRun: false,
        window: { sinceMs: windowStart, untilMs: windowEnd, startedAtMs, finishedAtMs },
        limitMatches,
        found: matches.length,
        cancelled,
        skipped,
        userPatchesApplied,
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
