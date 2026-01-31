import { getAdmin } from './_firebaseAdmin.js';

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

function matchCreatedAtMs(match) {
  const ms = typeof match?.createdAtMs === 'number' && Number.isFinite(match.createdAtMs) ? match.createdAtMs : 0;
  if (ms > 0) return ms;
  const ts = tsToMs(match?.createdAt);
  return ts > 0 ? ts : 0;
}

async function getMatchmakingResetAtMs(db) {
  try {
    const snap = await db.collection('siteSettings').doc('matchmaking').get();
    const d = snap.exists ? (snap.data() || {}) : {};
    const ms =
      (typeof d?.matchmakingResetAtMs === 'number' && Number.isFinite(d.matchmakingResetAtMs) ? d.matchmakingResetAtMs : 0) ||
      tsToMs(d?.matchmakingResetAtMs) ||
      (typeof d?.resetAtMs === 'number' && Number.isFinite(d.resetAtMs) ? d.resetAtMs : 0) ||
      tsToMs(d?.resetAtMs) ||
      0;
    return ms > 0 ? ms : 0;
  } catch {
    return 0;
  }
}

function assertNotResetIgnoredMatch({ match, resetAtMs }) {
  const ms = matchCreatedAtMs(match);
  if (resetAtMs > 0 && ms > 0 && ms < resetAtMs) {
    const err = new Error('match_reset_ignored');
    err.statusCode = 410;
    throw err;
  }
}

export { safeStr, tsToMs, matchCreatedAtMs, getMatchmakingResetAtMs, assertNotResetIgnoredMatch };
