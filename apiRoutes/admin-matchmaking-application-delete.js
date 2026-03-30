import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { loadApplicationsForUid, pickBestApp, safeStr } from './_adminMatchmakingProfiles.js';

function firstNonEmpty(...values) {
  for (const value of values) {
    const s = safeStr(value);
    if (s) return s;
  }
  return '';
}

function asObj(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function cleanStringArray(value, max = 5) {
  const list = Array.isArray(value) ? value : [];
  return list.map((item) => safeStr(item)).filter(Boolean).slice(0, max);
}

function getAboutFields(app) {
  const details = asObj(app?.details);
  const publicProfile = asObj(app?.publicProfile);
  const about =
    firstNonEmpty(app?.about, app?.bio, details?.about, details?.bio, publicProfile?.about, publicProfile?.bio) || '';
  const aboutTr = firstNonEmpty(app?.aboutTr, details?.aboutTr, publicProfile?.aboutTr);
  const aboutId = firstNonEmpty(app?.aboutId, details?.aboutId, publicProfile?.aboutId);
  const expectations = firstNonEmpty(app?.expectations, details?.expectations, publicProfile?.expectations);
  const expectationsTr = firstNonEmpty(app?.expectationsTr, details?.expectationsTr, publicProfile?.expectationsTr);
  const expectationsId = firstNonEmpty(app?.expectationsId, details?.expectationsId, publicProfile?.expectationsId);

  return {
    about,
    aboutTr,
    aboutId,
    expectations,
    expectationsTr,
    expectationsId,
  };
}

function buildUserCachePatchFromApplication(app) {
  const details = asObj(app?.details);
  const partnerPreferences = asObj(app?.partnerPreferences);
  const photoUrls = cleanStringArray(app?.photoUrls, 5);
  const photoPaths = cleanStringArray(app?.photoPaths, 5);
  const photoPath = firstNonEmpty(app?.photoPath);
  const username = firstNonEmpty(app?.username);
  const usernameLower = firstNonEmpty(app?.usernameLower, username ? username.toLowerCase() : '');
  const fullName = firstNonEmpty(app?.fullName);
  const city = firstNonEmpty(app?.city);
  const country = firstNonEmpty(app?.country);
  const nationality = firstNonEmpty(app?.nationality);
  const gender = firstNonEmpty(app?.gender);
  const lookingForGender = firstNonEmpty(app?.lookingForGender);
  const lookingForNationality = firstNonEmpty(app?.lookingForNationality);
  const age = typeof app?.age === 'number' && Number.isFinite(app.age) ? app.age : null;
  const profileNo = app?.profileNo !== undefined ? app.profileNo : undefined;
  const profileCode = firstNonEmpty(app?.profileCode);
  const aboutFields = getAboutFields(app);

  return {
    applicationId: safeStr(app?.id),
    ...(username ? { username } : {}),
    ...(usernameLower ? { usernameLower } : {}),
    ...(fullName ? { fullName } : {}),
    ...(typeof age === 'number' ? { age } : {}),
    ...(city ? { city } : {}),
    ...(country ? { country } : {}),
    ...(nationality ? { nationality } : {}),
    ...(gender ? { gender } : {}),
    ...(lookingForGender ? { lookingForGender } : {}),
    ...(lookingForNationality ? { lookingForNationality } : {}),
    application: {
      ...(username ? { username } : {}),
      ...(usernameLower ? { usernameLower } : {}),
      ...(fullName ? { fullName } : {}),
      ...(typeof age === 'number' ? { age } : {}),
      ...(city ? { city } : {}),
      ...(country ? { country } : {}),
      ...(nationality ? { nationality } : {}),
      ...(gender ? { gender } : {}),
      ...(lookingForGender ? { lookingForGender } : {}),
      ...(lookingForNationality ? { lookingForNationality } : {}),
      ...(photoUrls.length ? { photoUrls } : {}),
      ...(photoPaths.length ? { photoPaths } : {}),
      ...(photoPath ? { photoPath } : {}),
      ...(details ? { details } : {}),
      ...(partnerPreferences ? { partnerPreferences } : {}),
      ...(profileNo !== undefined ? { profileNo } : {}),
      ...(profileCode ? { profileCode } : {}),
    },
    publicProfile: {
      ...(username ? { username } : {}),
      ...(usernameLower ? { usernameLower } : {}),
      ...(fullName ? { fullName } : {}),
      ...(typeof age === 'number' ? { age } : {}),
      ...(city ? { city } : {}),
      ...(country ? { country } : {}),
      ...(nationality ? { nationality } : {}),
      ...(gender ? { gender } : {}),
      ...(lookingForGender ? { lookingForGender } : {}),
      ...(lookingForNationality ? { lookingForNationality } : {}),
      ...(photoUrls.length ? { photoUrls } : {}),
      ...(photoPaths.length ? { photoPaths } : {}),
      ...(photoPath ? { photoPath } : {}),
      ...(aboutFields.about ? { about: aboutFields.about, bio: aboutFields.about } : {}),
      ...(aboutFields.aboutTr ? { aboutTr: aboutFields.aboutTr } : {}),
      ...(aboutFields.aboutId ? { aboutId: aboutFields.aboutId } : {}),
      ...(aboutFields.expectations ? { expectations: aboutFields.expectations } : {}),
      ...(aboutFields.expectationsTr ? { expectationsTr: aboutFields.expectationsTr } : {}),
      ...(aboutFields.expectationsId ? { expectationsId: aboutFields.expectationsId } : {}),
    },
    details: {
      ...(aboutFields.about ? { about: aboutFields.about, bio: aboutFields.about } : {}),
      ...(aboutFields.aboutTr ? { aboutTr: aboutFields.aboutTr } : {}),
      ...(aboutFields.aboutId ? { aboutId: aboutFields.aboutId } : {}),
      ...(aboutFields.expectations ? { expectations: aboutFields.expectations } : {}),
      ...(aboutFields.expectationsTr ? { expectationsTr: aboutFields.expectationsTr } : {}),
      ...(aboutFields.expectationsId ? { expectationsId: aboutFields.expectationsId } : {}),
    },
  };
}

function buildUserCacheClearPatch(FieldValue) {
  return {
    applicationId: FieldValue.delete(),
    username: FieldValue.delete(),
    usernameLower: FieldValue.delete(),
    fullName: FieldValue.delete(),
    age: FieldValue.delete(),
    city: FieldValue.delete(),
    country: FieldValue.delete(),
    nationality: FieldValue.delete(),
    gender: FieldValue.delete(),
    lookingForGender: FieldValue.delete(),
    lookingForNationality: FieldValue.delete(),
    photoUrls: FieldValue.delete(),
    photoPaths: FieldValue.delete(),
    photoPath: FieldValue.delete(),
    application: FieldValue.delete(),
    publicProfile: FieldValue.delete(),
    details: FieldValue.delete(),
  };
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
    const applicationId = safeStr(body?.id || body?.applicationId);
    if (!applicationId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'missing_application_id' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const appRef = db.collection('matchmakingApplications').doc(applicationId);
    const appSnap = await appRef.get();
    if (!appSnap.exists) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'application_not_found' }));
      return;
    }

    const app = { id: appSnap.id, ...(appSnap.data() || {}) };
    const userId = firstNonEmpty(app?.userId, app?.uid, app?.userUid, app?.ownerUid);

    await appRef.delete();

    let nextApplicationId = '';
    if (userId) {
      const userRef = db.collection('matchmakingUsers').doc(userId);
      const remainingApps = (await loadApplicationsForUid(db, userId, { limitPerField: 50 })).filter((item) => safeStr(item?.id) !== applicationId);
      const nextBestApp = pickBestApp(remainingApps);

      if (nextBestApp?.id) {
        nextApplicationId = safeStr(nextBestApp.id);
        await userRef.set(
          {
            ...buildUserCachePatchFromApplication(nextBestApp),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await userRef.set(
          {
            ...buildUserCacheClearPatch(FieldValue),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, deleted: true, applicationId, userId: userId || null, nextApplicationId: nextApplicationId || null }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}