import { getAdmin, normalizeBody, requireCronSecret } from './_firebaseAdmin.js';

function asNum(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

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

function nowMs() {
  return Date.now();
}

function clampInt(v, { min, max, fallback }) {
  const n = asNum(v);
  if (n === null) return fallback;
  const i = Math.floor(n);
  return Math.max(min, Math.min(max, i));
}

async function deleteMatchDeep({ db, matchRef }) {
  if (typeof db?.recursiveDelete === 'function') {
    await db.recursiveDelete(matchRef);
    return;
  }

  // Fallback: delete known subcollections + doc
  const msgs = await matchRef.collection('messages').limit(800).get();
  if (!msgs.empty) {
    const batch = db.batch();
    msgs.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await matchRef.delete();
}

async function cleanupCollectionGroup({ db, name, cutoffMs, limitDocs }) {
  const q = db.collectionGroup(name).where('createdAtMs', '<', cutoffMs).limit(limitDocs);
  const snap = await q.get();
  if (snap.empty) return { deleted: 0 };

  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return { deleted: snap.size };
}

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    // Cron secret gate
    requireCronSecret(req);

    const body = normalizeBody(req);
    const dryRun = body?.dryRun === true;

    // Retention
    const cancelledRetentionDays = clampInt(body?.cancelledRetentionDays, { min: 3, max: 180, fallback: 30 });
    const deletedUserRetentionDays = clampInt(body?.deletedUserRetentionDays, { min: 7, max: 365, fallback: 60 });
    const notificationsRetentionDays = clampInt(body?.notificationsRetentionDays, { min: 7, max: 365, fallback: 30 });

    // Limits per run (avoid timeouts)
    const maxMatches = clampInt(body?.maxMatches, { min: 1, max: 200, fallback: 50 });
    const maxGroupDocs = clampInt(body?.maxGroupDocs, { min: 50, max: 1000, fallback: 300 });

    const { db } = getAdmin();

    const now = nowMs();
    const cancelledCutoffMs = now - cancelledRetentionDays * 24 * 60 * 60 * 1000;
    const deletedUserCutoffMs = now - deletedUserRetentionDays * 24 * 60 * 60 * 1000;
    const notificationsCutoffMs = now - notificationsRetentionDays * 24 * 60 * 60 * 1000;

    const out = {
      ok: true,
      dryRun,
      params: {
        cancelledRetentionDays,
        deletedUserRetentionDays,
        notificationsRetentionDays,
        maxMatches,
        maxGroupDocs,
      },
      deleted: {
        matches: 0,
        matchMessages: 0,
        inboxLikes: 0,
        inboxAccessRequests: 0,
        outboxAccessRequests: 0,
      },
      scanned: {
        matches: 0,
      },
      notes: [],
    };

    // 1) Old matches cleanup
    const matchColl = db.collection('matchmakingMatches');
    const matchSnaps = await Promise.all([
      matchColl.where('status', '==', 'cancelled').limit(maxMatches).get(),
      matchColl.where('status', '==', 'deleted_user').limit(maxMatches).get(),
    ]);

    for (const snap of matchSnaps) {
      for (const d of snap.docs) {
        out.scanned.matches += 1;
        const m = d.data() || {};
        const status = safeStr(m?.status);
        const updatedAtMs =
          (typeof m?.updatedAtMs === 'number' && Number.isFinite(m.updatedAtMs) ? m.updatedAtMs : 0) ||
          tsToMs(m?.updatedAt) ||
          (typeof m?.cancelledAtMs === 'number' && Number.isFinite(m.cancelledAtMs) ? m.cancelledAtMs : 0) ||
          tsToMs(m?.cancelledAt) ||
          (typeof m?.createdAtMs === 'number' && Number.isFinite(m.createdAtMs) ? m.createdAtMs : 0) ||
          tsToMs(m?.createdAt) ||
          0;

        const cutoff = status === 'deleted_user' ? deletedUserCutoffMs : cancelledCutoffMs;
        if (!updatedAtMs || updatedAtMs >= cutoff) continue;

        // Count messages before deletion for reporting
        let msgCount = 0;
        try {
          const msgs = await d.ref.collection('messages').select().get();
          msgCount = msgs.size;
        } catch {
          // ignore
        }

        if (!dryRun) {
          await deleteMatchDeep({ db, matchRef: d.ref });
        }

        out.deleted.matches += 1;
        out.deleted.matchMessages += msgCount;
      }
    }

    // 2) Notifications cleanup via collectionGroup
    const groups = [
      { key: 'inboxLikes', name: 'inboxLikes' },
      { key: 'inboxAccessRequests', name: 'inboxAccessRequests' },
      { key: 'outboxAccessRequests', name: 'outboxAccessRequests' },
    ];

    for (const g of groups) {
      if (dryRun) {
        // Best-effort count
        try {
          const snap = await db.collectionGroup(g.name).where('createdAtMs', '<', notificationsCutoffMs).limit(maxGroupDocs).get();
          out.deleted[g.key] += snap.size;
        } catch (e) {
          out.notes.push(`group_${g.name}_count_failed_${safeStr(e?.message) || 'error'}`);
        }
        continue;
      }

      try {
        const r = await cleanupCollectionGroup({ db, name: g.name, cutoffMs: notificationsCutoffMs, limitDocs: maxGroupDocs });
        out.deleted[g.key] += r.deleted;
      } catch (e) {
        out.notes.push(`group_${g.name}_delete_failed_${safeStr(e?.message) || 'error'}`);
      }
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(out));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
