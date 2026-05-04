import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { mapMediationMatchRecord, normalizeReasonCode, resolveParticipantByIdentifier, safeStr } from './_adminMediation.js';

function parseDateTimeMs(value, fallbackMs = 0) {
  const raw = safeStr(value);
  if (!raw) return fallbackMs;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : fallbackMs;
}

export default async function adminMediationMatchUpdate(req, res) {
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
    const currentParticipants = current?.participants && typeof current.participants === 'object' ? current.participants : {};
    const nextA = await resolveParticipantByIdentifier(
      db,
      body?.aSourceType || currentParticipants?.a?.sourceType,
      body?.aIdentifier || currentParticipants?.a?.refId
    );
    const nextB = await resolveParticipantByIdentifier(
      db,
      body?.bSourceType || currentParticipants?.b?.sourceType,
      body?.bIdentifier || currentParticipants?.b?.refId
    );

    if (!nextA || !nextB) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: !nextA ? 'participant_a_not_found' : 'participant_b_not_found' }));
      return;
    }

    if (nextA.sourceType === nextB.sourceType && nextA.refId === nextB.refId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'same_participant_not_allowed' }));
      return;
    }

    const isEnded = safeStr(current?.status) === 'ended';
    const matchedAtMs = parseDateTimeMs(body?.matchedAt, typeof current?.matchedAtMs === 'number' ? current.matchedAtMs : Date.now());
    const next = {
      ...current,
      participants: {
        a: nextA,
        b: nextB,
      },
      matchedAtMs,
      note: safeStr(body?.note),
      updatedAtMs: Date.now(),
    };

    if (isEnded) {
      next.endedAtMs = parseDateTimeMs(body?.endedAt, typeof current?.endedAtMs === 'number' ? current.endedAtMs : Date.now());
      next.endReasonCode = normalizeReasonCode(body?.endReasonCode || current?.endReasonCode);
      next.endReasonNote = safeStr(body?.endReasonNote || current?.endReasonNote);
    }

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
