import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { getParticipantSnapshotByRef, mapMediationMatchRecord, normalizeReasonCode, safeStr } from './_adminMediation.js';

function parseDateTimeMs(value, fallbackMs) {
  const raw = safeStr(value);
  if (!raw) return fallbackMs;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : fallbackMs;
}

export default async function adminMediationMatchEnd(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);
    const body = normalizeBody(req);
    const matchId = safeStr(body?.matchId);
    if (!matchId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'match_id_required' }));
      return;
    }

    const { db } = getAdmin();
    const ref = db.collection('matchmakingMediationMatches').doc(matchId);
    const snap = await ref.get();
    if (!snap.exists) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'match_not_found' }));
      return;
    }

    const current = snap.data() || {};
    const participants = current?.participants && typeof current.participants === 'object' ? current.participants : {};
    const aCurrent = participants?.a && typeof participants.a === 'object' ? participants.a : null;
    const bCurrent = participants?.b && typeof participants.b === 'object' ? participants.b : null;
    const a = aCurrent ? await getParticipantSnapshotByRef(db, aCurrent.sourceType, aCurrent.refId) : null;
    const b = bCurrent ? await getParticipantSnapshotByRef(db, bCurrent.sourceType, bCurrent.refId) : null;
    const endedAtMs = parseDateTimeMs(body?.endedAt, Date.now());

    const next = {
      ...current,
      status: 'ended',
      endedAtMs,
      endReasonCode: normalizeReasonCode(body?.endReasonCode),
      endReasonNote: safeStr(body?.endReasonNote),
      updatedAtMs: Date.now(),
      participants: {
        a: a || aCurrent || {},
        b: b || bCurrent || {},
      },
    };

    await ref.set(next, { merge: true });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, item: mapMediationMatchRecord(ref.id, next) }));
  } catch (error) {
    res.statusCode = error?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(error?.message || 'server_error') }));
  }
}