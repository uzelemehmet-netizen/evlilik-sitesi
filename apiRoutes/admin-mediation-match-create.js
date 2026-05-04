import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { mapMediationMatchRecord, resolveParticipantByIdentifier, safeStr } from './_adminMediation.js';

function parseDateTimeMs(value, fallbackMs) {
  const raw = safeStr(value);
  if (!raw) return fallbackMs;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : fallbackMs;
}

export default async function adminMediationMatchCreate(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireAdmin(req);
    const body = normalizeBody(req);
    const { db } = getAdmin();
    const now = Date.now();

    const a = await resolveParticipantByIdentifier(db, body?.aSourceType, body?.aIdentifier);
    const b = await resolveParticipantByIdentifier(db, body?.bSourceType, body?.bIdentifier);

    if (!a) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'participant_a_not_found' }));
      return;
    }
    if (!b) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'participant_b_not_found' }));
      return;
    }
    if (a.sourceType === b.sourceType && a.refId === b.refId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'same_participant_not_allowed' }));
      return;
    }

    a.label = safeStr(a.label) || safeStr(a.userCode) || safeStr(a.fullName) || safeStr(a.refId);
    b.label = safeStr(b.label) || safeStr(b.userCode) || safeStr(b.fullName) || safeStr(b.refId);

    const matchedAtMs = parseDateTimeMs(body?.matchedAt, now);
    const doc = {
      status: 'active',
      matchedAtMs,
      createdAtMs: now,
      updatedAtMs: now,
      createdByEmail: safeStr(decoded?.email),
      note: safeStr(body?.note),
      participants: { a, b },
    };

    const ref = db.collection('matchmakingMediationMatches').doc();
    await ref.set(doc);

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, item: mapMediationMatchRecord(ref.id, doc) }));
  } catch (error) {
    res.statusCode = error?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(error?.message || 'server_error') }));
  }
}