import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeLower(v) {
  return String(v || '').toLowerCase().trim();
}

function asNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
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

function lastSeenMsFromUserDoc(userDoc) {
  const ms = typeof userDoc?.lastSeenAtMs === 'number' && Number.isFinite(userDoc.lastSeenAtMs) ? userDoc.lastSeenAtMs : 0;
  if (ms > 0) return ms;
  const ts = tsToMs(userDoc?.lastSeenAt);
  return ts > 0 ? ts : 0;
}

function appCreatedAtMs(app) {
  const ms = typeof app?.createdAtMs === 'number' && Number.isFinite(app.createdAtMs) ? app.createdAtMs : 0;
  if (ms > 0) return ms;
  const ts = tsToMs(app?.createdAt);
  return ts > 0 ? ts : 0;
}

function pickActiveApplication(apps) {
  const list = Array.isArray(apps) ? apps : [];
  if (!list.length) return null;
  const withMs = list.map((a) => ({ a, ms: appCreatedAtMs(a) }));
  withMs.sort((x, y) => (y.ms || 0) - (x.ms || 0));
  return withMs[0]?.a || null;
}

function computeEligibilitySummary({ uid, userDoc, app, nowMs, inactiveHours = 24 }) {
  const cutoffMs = nowMs - inactiveHours * 60 * 60 * 1000;

  const userExists = !!userDoc;
  const blocked = !!userDoc?.blocked;
  const lock = userDoc?.matchmakingLock && typeof userDoc.matchmakingLock === 'object' ? userDoc.matchmakingLock : null;
  const lockActive = !!lock?.active;
  const lockMatchId = lockActive ? String(lock?.matchId || '') : '';

  const cooldownUntilMs = typeof userDoc?.newMatchCooldownUntilMs === 'number' && Number.isFinite(userDoc.newMatchCooldownUntilMs)
    ? userDoc.newMatchCooldownUntilMs
    : 0;
  const cooldownActive = cooldownUntilMs > nowMs;

  const lastSeenAtMs = lastSeenMsFromUserDoc(userDoc);

  const appExists = !!app;
  const appMs = appCreatedAtMs(app);
  const gender = safeLower(app?.gender);
  const lookingForGender = safeLower(app?.lookingForGender);

  const inactive = lastSeenAtMs > 0 ? lastSeenAtMs <= cutoffMs : appMs > 0 && appMs <= cutoffMs;

  const excludedReasons = [];
  if (!userExists) excludedReasons.push('matchmakingUsers doc missing');
  if (blocked) excludedReasons.push('blocked');
  if (lockActive) excludedReasons.push('matchmakingLock.active');
  if (cooldownActive) excludedReasons.push('cooldown_active');
  if (!appExists) excludedReasons.push('no matchmakingApplication');
  if (appExists && (!gender || !lookingForGender)) excludedReasons.push('application missing gender/lookingForGender');
  if (inactive) excludedReasons.push(`inactive_${inactiveHours}h`);

  return {
    uid: String(uid),
    user: userDoc
      ? {
          blocked,
          lockActive,
          lockMatchId,
          cooldownUntilMs,
          lastSeenAtMs,
        }
      : null,
    application: app
      ? {
          id: String(app?.id || ''),
          createdAtMs: appMs,
          gender,
          lookingForGender,
          nationality: safeLower(app?.nationality || ''),
          lookingForNationality: safeLower(app?.lookingForNationality || ''),
        }
      : null,
    derived: {
      inactive,
      cooldownActive,
      eligibleForNewMatches: excludedReasons.length === 0,
      excludedReasons,
    },
  };
}

function pairCompatibility(a, b) {
  const reasons = [];

  const aApp = a?.application || null;
  const bApp = b?.application || null;

  if (!aApp || !bApp) {
    reasons.push('missing_application');
    return { ok: false, reasons };
  }

  const aGender = safeLower(aApp.gender);
  const bGender = safeLower(bApp.gender);
  const aWant = safeLower(aApp.lookingForGender);
  const bWant = safeLower(bApp.lookingForGender);

  if (!aGender || !bGender) reasons.push('missing_gender');
  if (!aWant || !bWant) reasons.push('missing_lookingForGender');

  if (aGender && bGender && aGender === bGender) reasons.push('same_gender');

  if (aWant && bGender && aWant !== bGender) reasons.push('a_lookingForGender_mismatch');
  if (bWant && aGender && bWant !== aGender) reasons.push('b_lookingForGender_mismatch');

  const aWantNat = safeLower(aApp.lookingForNationality);
  const bWantNat = safeLower(bApp.lookingForNationality);
  const aNat = safeLower(aApp.nationality);
  const bNat = safeLower(bApp.nationality);

  if (aWantNat && aWantNat !== 'other' && bNat && aWantNat !== bNat) reasons.push('a_lookingForNationality_mismatch');
  if (bWantNat && bWantNat !== 'other' && aNat && bWantNat !== aNat) reasons.push('b_lookingForNationality_mismatch');

  // Havuz uygunluğu (basit): iki tarafta da eligibility true olmalı.
  if (!a?.derived?.eligibleForNewMatches) reasons.push('a_not_eligible_for_pool');
  if (!b?.derived?.eligibleForNewMatches) reasons.push('b_not_eligible_for_pool');

  return { ok: reasons.length === 0, reasons };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);

    const body = normalizeBody(req);
    const emailsRaw = Array.isArray(body?.emails) ? body.emails : [];
    const emails = emailsRaw.map((e) => String(e || '').trim()).filter(Boolean).slice(0, 10);

    const inactiveHours = asNum(body?.inactiveHours) ?? 24;
    const includeMatches = !!body?.includeMatches;

    if (emails.length === 0) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { auth, db } = getAdmin();
    const nowMs = Date.now();

    const results = [];

    for (const email of emails) {
      const key = safeLower(email);
      try {
        const userRecord = await auth.getUserByEmail(email);
        const uid = String(userRecord.uid || '');

        const userSnap = await db.collection('matchmakingUsers').doc(uid).get();
        const userDoc = userSnap.exists ? (userSnap.data() || {}) : null;

        let apps = [];
        try {
          const appsSnap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(5).get();
          apps = appsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        } catch {
          apps = [];
        }

        const activeApp = pickActiveApplication(apps);

        const summary = computeEligibilitySummary({ uid, userDoc, app: activeApp, nowMs, inactiveHours });

        const out = { email: key, uid, ...summary };

        if (includeMatches) {
          try {
            const matchesSnap = await db
              .collection('matchmakingMatches')
              .where('userIds', 'array-contains', uid)
              .orderBy('createdAt', 'desc')
              .limit(20)
              .get();
            out.matches = matchesSnap.docs.map((d) => {
              const m = d.data() || {};
              return {
                id: d.id,
                status: safeLower(m?.status || ''),
                cancelledReason: safeLower(m?.cancelledReason || ''),
                createdAtMs: typeof m?.createdAtMs === 'number' ? m.createdAtMs : tsToMs(m?.createdAt),
                proposedExpiresAtMs: typeof m?.proposedExpiresAtMs === 'number' ? m.proposedExpiresAtMs : 0,
              };
            });
          } catch {
            out.matches = { error: 'matches_query_failed' };
          }
        }

        results.push(out);
      } catch (e) {
        results.push({ email: key, error: String(e?.message || 'not_found') });
      }
    }

    let pair = null;
    if (results.length === 2 && results[0]?.uid && results[1]?.uid) {
      pair = {
        aEmail: results[0].email,
        bEmail: results[1].email,
        aUid: results[0].uid,
        bUid: results[1].uid,
        compatibility: pairCompatibility(results[0], results[1]),
      };

      // Match doc mevcut mu?
      try {
        const ids = [String(results[0].uid), String(results[1].uid)].sort();
        const matchId = `${ids[0]}__${ids[1]}`;
        const snap = await getAdmin().db.collection('matchmakingMatches').doc(matchId).get();
        if (snap.exists) {
          const m = snap.data() || {};
          pair.existingMatch = {
            id: matchId,
            status: safeLower(m?.status || ''),
            cancelledReason: safeLower(m?.cancelledReason || ''),
            createdAtMs: typeof m?.createdAtMs === 'number' ? m.createdAtMs : tsToMs(m?.createdAt),
          };
        } else {
          pair.existingMatch = null;
        }
      } catch {
        pair.existingMatch = { error: 'match_lookup_failed' };
      }
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, nowMs, inactiveHours, results, pair }, null, 2));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
