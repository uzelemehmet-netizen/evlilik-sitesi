import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asNum(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function asObj(v) {
  return v && typeof v === 'object' ? v : {};
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

    const matchStatus = safeStr(match?.status);
    const isMatchedCouple = matchStatus === 'mutual_accepted' || matchStatus === 'contact_unlocked';

    const aUserId = safeStr(match.aUserId);
    const bUserId = safeStr(match.bUserId);
    const aAppId = safeStr(match.aApplicationId);
    const bAppId = safeStr(match.bApplicationId);

    const otherUserId = userIds.find((x) => x !== uid) || '';
    const otherAppId = otherUserId === aUserId ? aAppId : bAppId;

    // Ön aşama (proposed/pre_match vb.) için: detay profil, karşı tarafın verdiği profileAccessGranted iznine bağlı.
    // Eşleşmiş çiftlerde (mutual_accepted/contact_unlocked) iki taraf da birbirini görür.
    if (!isMatchedCouple) {
      const grantSnap = await db
        .collection('matchmakingUsers')
        .doc(otherUserId)
        .collection('profileAccessGranted')
        .doc(uid)
        .get();

      if (!grantSnap.exists) {
        res.statusCode = 403;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'no_access' }));
        return;
      }
    }

    if (!otherUserId || !otherAppId) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'server_error' }));
      return;
    }

    const [appSnap, otherUserSnap] = await Promise.all([
      db.collection('matchmakingApplications').doc(otherAppId).get(),
      db.collection('matchmakingUsers').doc(otherUserId).get(),
    ]);
    if (!appSnap.exists) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'application_not_found' }));
      return;
    }

    const app = appSnap.data() || {};
    const otherUser = otherUserSnap.exists ? (otherUserSnap.data() || {}) : {};
    const lastSeenAtMs = lastSeenMsFromUserDoc(otherUser);
    const details = asObj(app?.details);
    const partner = asObj(app?.partnerPreferences);

    const languages = asObj(details?.languages);
    const nativeLang = asObj(languages?.native);
    const foreignLang = asObj(languages?.foreign);

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
          lookingForNationality: safeStr(app?.lookingForNationality),
          lookingForGender: safeStr(app?.lookingForGender),
          about: safeStr(app?.about),
          expectations: safeStr(app?.expectations),
          photoUrls: Array.isArray(app?.photoUrls) ? app.photoUrls.filter((u) => typeof u === 'string' && u.trim()) : [],
          details: {
            heightCm: asNum(details?.heightCm),
            weightKg: asNum(details?.weightKg),
            occupation: safeStr(details?.occupation),
            education: safeStr(details?.education),
            educationDepartment: safeStr(details?.educationDepartment),
            maritalStatus: safeStr(details?.maritalStatus),
            hasChildren: safeStr(details?.hasChildren),
            childrenCount: asNum(details?.childrenCount),
            incomeLevel: safeStr(details?.incomeLevel),
            religion: safeStr(details?.religion),
            religiousValues: safeStr(details?.religiousValues),
            familyApprovalStatus: safeStr(details?.familyApprovalStatus),
            marriageTimeline: safeStr(details?.marriageTimeline),
            relocationWillingness: safeStr(details?.relocationWillingness),
            preferredLivingCountry: safeStr(details?.preferredLivingCountry),
            smoking: safeStr(details?.smoking),
            alcohol: safeStr(details?.alcohol),
            languages: {
              native: {
                code: safeStr(nativeLang?.code),
                other: safeStr(nativeLang?.other),
              },
              foreign: {
                codes: Array.isArray(foreignLang?.codes) ? foreignLang.codes.map(safeStr).filter(Boolean) : [],
                other: safeStr(foreignLang?.other),
              },
            },
            communicationLanguage: safeStr(details?.communicationLanguage),
            communicationLanguageOther: safeStr(details?.communicationLanguageOther),
            communicationMethod: safeStr(details?.communicationMethod),
            canCommunicateWithTranslationApp: !!details?.canCommunicateWithTranslationApp,
          },

          // Not: İletişim (whatsapp/email/instagram) ayrı endpoint ile açılıyor.
          partnerPreferences: {
            heightMinCm: asNum(partner?.heightMinCm),
            heightMaxCm: asNum(partner?.heightMaxCm),
            ageMaxOlderYears: asNum(partner?.ageMaxOlderYears),
            ageMaxYoungerYears: asNum(partner?.ageMaxYoungerYears),
            ageMin: asNum(partner?.ageMin),
            ageMax: asNum(partner?.ageMax),
            maritalStatus: safeStr(partner?.maritalStatus),
            religion: safeStr(partner?.religion),
            communicationMethods: Array.isArray(partner?.communicationMethods)
              ? partner.communicationMethods.map(safeStr).filter(Boolean).slice(0, 5)
              : [],
            communicationLanguage: safeStr(partner?.communicationLanguage),
            communicationLanguageOther: safeStr(partner?.communicationLanguageOther),
            canCommunicateWithTranslationApp: !!partner?.canCommunicateWithTranslationApp,
            translationAppPreference: safeStr(partner?.translationAppPreference),
            livingCountry: safeStr(partner?.livingCountry),
            smokingPreference: safeStr(partner?.smokingPreference),
            alcoholPreference: safeStr(partner?.alcoholPreference),
            childrenPreference: safeStr(partner?.childrenPreference),
            educationPreference: safeStr(partner?.educationPreference),
            occupationPreference: safeStr(partner?.occupationPreference),
            familyValuesPreference: safeStr(partner?.familyValuesPreference),
          },

          presence: {
            lastSeenAtMs,
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
