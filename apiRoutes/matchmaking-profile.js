import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { ensureEligibleOrThrow } from './_matchmakingEligibility.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asNum(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

// Eligibility kontrolü artık ortak helper üzerinden.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireIdToken(req);
    const uid = decoded.uid;

    const body = normalizeBody(req);
    const matchId = safeStr(body?.matchId);

    if (!matchId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db } = getAdmin();

    const [meSnap, matchSnap] = await Promise.all([
      db.collection('matchmakingUsers').doc(uid).get(),
      db.collection('matchmakingMatches').doc(matchId).get(),
    ]);

    const me = meSnap.exists ? (meSnap.data() || {}) : {};

    if (!matchSnap.exists) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'not_found' }));
      return;
    }

    const match = matchSnap.data() || {};
    const userIds = Array.isArray(match.userIds) ? match.userIds.map(String).filter(Boolean) : [];
    if (userIds.length !== 2 || !userIds.includes(uid)) {
      res.statusCode = 403;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'forbidden' }));
      return;
    }

    const aUserId = safeStr(match.aUserId);
    const bUserId = safeStr(match.bUserId);
    const aAppId = safeStr(match.aApplicationId);
    const bAppId = safeStr(match.bApplicationId);

    // Viewer'ın cinsiyetini kendi application doc'undan al
    const myAppId = uid === aUserId ? aAppId : bAppId;
    let myGender = '';
    if (myAppId) {
      const myAppSnap = await db.collection('matchmakingApplications').doc(myAppId).get();
      myGender = myAppSnap.exists ? safeStr((myAppSnap.data() || {})?.gender) : '';
    }

    try {
      ensureEligibleOrThrow(me, myGender);
    } catch (e) {
      res.statusCode = e?.statusCode || 402;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: String(e?.message || 'membership_required') }));
      return;
    }

    const otherUserId = userIds.find((x) => x !== uid) || '';
    const otherAppId = otherUserId === aUserId ? aAppId : bAppId;

    if (!otherUserId || !otherAppId) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'server_error' }));
      return;
    }

    const appSnap = await db.collection('matchmakingApplications').doc(otherAppId).get();
    if (!appSnap.exists) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'application_not_found' }));
      return;
    }

    const app = appSnap.data() || {};
    const details = app?.details || {};

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        profile: {
          profileNo: asNum(app?.profileNo),
          profileCode: safeStr(app?.profileCode),
          username: safeStr(app?.username),
          fullName: safeStr(app?.fullName),
          age: asNum(app?.age),
          city: safeStr(app?.city),
          country: safeStr(app?.country),
          nationality: safeStr(app?.nationality),
          gender: safeStr(app?.gender),
          about: safeStr(app?.about),
          expectations: safeStr(app?.expectations),
          photoUrls: Array.isArray(app?.photoUrls) ? app.photoUrls.filter((u) => typeof u === 'string' && u.trim()) : [],
          details: {
            heightCm: asNum(details?.heightCm),
            weightKg: asNum(details?.weightKg),
            occupation: safeStr(details?.occupation),
            education: safeStr(details?.education),
            maritalStatus: safeStr(details?.maritalStatus),
            hasChildren: safeStr(details?.hasChildren),
            childrenCount: asNum(details?.childrenCount),
            religion: safeStr(details?.religion),
            religiousValues: safeStr(details?.religiousValues),
            smoking: safeStr(details?.smoking),
            alcohol: safeStr(details?.alcohol),
            languages: details?.languages || null,
            canCommunicateWithTranslationApp: !!details?.canCommunicateWithTranslationApp,
          },
        },
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
