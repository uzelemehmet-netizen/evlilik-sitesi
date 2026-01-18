import { getAdmin, requireIdToken } from './_firebaseAdmin.js';
import { ensureEligibleOrThrow } from './_matchmakingEligibility.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
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

    const body = typeof req?.body === 'object' ? req.body : JSON.parse(req?.body || '{}');
    const matchId = safeStr(body?.matchId);

    if (!matchId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db } = getAdmin();
    const matchRef = db.collection('matchmakingMatches').doc(matchId);
    const matchSnap = await matchRef.get();

    if (!matchSnap.exists) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'not_found' }));
      return;
    }

    const match = matchSnap.data() || {};
    const st = String(match.status || '');
    if (st !== 'contact_unlocked') {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'not_confirmed' }));
      return;
    }

    const mode = typeof match?.interactionMode === 'string' ? match.interactionMode : '';
    if (mode !== 'contact') {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'not_confirmed' }));
      return;
    }

    const userIds = Array.isArray(match.userIds) ? match.userIds.map(String) : [];
    if (!userIds.includes(uid) || userIds.length !== 2) {
      res.statusCode = 403;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'forbidden' }));
      return;
    }

    const otherUserId = userIds.find((x) => x !== uid) || '';
    if (!otherUserId) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'server_error' }));
      return;
    }

    const [meSnap, otherSnap] = await Promise.all([
      db.collection('matchmakingUsers').doc(uid).get(),
      db.collection('matchmakingUsers').doc(otherUserId).get(),
    ]);

    const me = meSnap.exists ? (meSnap.data() || {}) : {};
    const other = otherSnap.exists ? (otherSnap.data() || {}) : {};

    // Cinsiyet bazlı eligibility (match application doc'larından okunur)
    const aUid = safeStr(match?.aUserId);
    const bUid = safeStr(match?.bUserId);
    const aAppId = safeStr(match?.aApplicationId);
    const bAppId = safeStr(match?.bApplicationId);
    const [aAppSnap, bAppSnap] = await Promise.all([
      aAppId ? db.collection('matchmakingApplications').doc(aAppId).get() : Promise.resolve(null),
      bAppId ? db.collection('matchmakingApplications').doc(bAppId).get() : Promise.resolve(null),
    ]);
    const aGender = aAppSnap && aAppSnap.exists ? safeStr((aAppSnap.data() || {})?.gender) : '';
    const bGender = bAppSnap && bAppSnap.exists ? safeStr((bAppSnap.data() || {})?.gender) : '';

    const myGender = uid === aUid ? aGender : bGender;
    const otherGender = uid === aUid ? bGender : aGender;

    ensureEligibleOrThrow(me, myGender);
    ensureEligibleOrThrow(other, otherGender);

    // Uygulama dokümanından iletişim bilgilerini çek (client’a hiç açmadan)
    const aUserId = aUid;
    const bUserId = bUid;

    const otherAppId = otherUserId === aUserId ? aAppId : bAppId;
    if (!otherAppId) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'missing_application' }));
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

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        contact: {
          whatsapp: safeStr(app.whatsapp),
          email: safeStr(app.email),
          instagram: safeStr(app.instagram),
        },
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
