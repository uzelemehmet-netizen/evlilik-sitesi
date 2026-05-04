import { test, expect } from 'playwright/test';
import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';
import { getLocalizedProfileText } from '../src/utils/profileText.js';

test.use({
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
});

const { auth, db } = getAdmin();

function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function hasMeaningfulProfileValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.some((item) => hasMeaningfulProfileValue(item));
  if (typeof value === 'object') return Object.values(value).some((item) => hasMeaningfulProfileValue(item));
  return true;
}

function uniqueToken() {
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

function countIdentityItems(profile) {
  const p = profile && typeof profile === 'object' ? profile : {};
  const values = [
    typeof p?.age === 'number' ? p.age : null,
    p?.city,
    p?.country,
    p?.nationality,
    p?.gender,
    p?.lookingForGender,
    p?.lookingForNationality,
  ];
  return values.filter((item) => hasMeaningfulProfileValue(item)).length;
}

function countDetailItems(profile) {
  const details = profile?.details && typeof profile.details === 'object' ? profile.details : {};
  const languages = details?.languages && typeof details.languages === 'object' ? details.languages : {};
  const nativeLang = languages?.native && typeof languages.native === 'object' ? languages.native : {};
  const foreignLang = languages?.foreign && typeof languages.foreign === 'object' ? languages.foreign : {};

  const values = [
    typeof details?.heightCm === 'number' ? details.heightCm : null,
    typeof details?.weightKg === 'number' ? details.weightKg : null,
    details?.occupation,
    details?.education,
    details?.educationDepartment,
    details?.maritalStatus,
    details?.hasChildren,
    typeof details?.childrenCount === 'number' ? details.childrenCount : null,
    details?.childrenLivingSituation,
    details?.liveWithChildrenAfterMarriage,
    details?.incomeLevel,
    details?.religion,
    details?.religiousValues,
    details?.familyApprovalStatus,
    details?.marriageTimeline,
    details?.relocationWillingness,
    details?.preferredLivingCountry,
    nativeLang?.code || nativeLang?.other,
    Array.isArray(foreignLang?.codes) ? foreignLang.codes.filter((item) => hasMeaningfulProfileValue(item)) : [],
    details?.communicationLanguage || details?.communicationLanguageOther,
    details?.smoking,
    details?.alcohol,
  ];

  return values.filter((item) => hasMeaningfulProfileValue(item)).length;
}

function countPartnerItems(profile) {
  const partner = profile?.partnerPreferences && typeof profile.partnerPreferences === 'object' ? profile.partnerPreferences : {};
  const values = [
    partner?.ageMin,
    partner?.ageMax,
    partner?.ageMaxOlderYears,
    partner?.ageMaxYoungerYears,
    partner?.heightMinCm,
    partner?.heightMaxCm,
    partner?.maritalStatus,
    partner?.religion,
    partner?.livingCountry,
    partner?.childrenPreference,
    partner?.educationPreference,
    partner?.occupationPreference,
    partner?.familyValuesPreference,
    Array.isArray(partner?.communicationMethods) ? partner.communicationMethods.filter((item) => hasMeaningfulProfileValue(item)) : [],
    partner?.smokingPreference,
    partner?.alcoholPreference,
  ];
  return values.filter((item) => hasMeaningfulProfileValue(item)).length;
}

function buildViewerEmail(token) {
  return `seed.mypeople.viewer.${token}@example.test`;
}

function buildTargetEmail(token) {
  return `seed.mypeople.target.${token}@example.test`;
}

function buildViewerProfile(token) {
  return {
    fullName: 'Ayse Testci',
    username: `detayalici${token.slice(-6)}`,
    age: 29,
    city: 'Istanbul',
    country: 'Turkiye',
    nationality: 'tr',
    gender: 'female',
    lookingForGender: 'male',
    photoUrls: ['https://example.test/viewer-1.jpg'],
    about: 'Viewer seed profile',
    details: {
      occupation: 'teacher',
      occupationTr: 'Ogretmen',
      maritalStatus: 'single',
    },
    partnerPreferences: {
      ageMin: 28,
      ageMax: 40,
    },
  };
}

function buildTargetProfile(token) {
  return {
    fullName: 'Fatma Detayli',
    username: `detayaday${token.slice(-6)}`,
    age: 33,
    city: 'Ankara',
    country: 'Turkiye',
    nationality: 'tr',
    gender: 'female',
    lookingForGender: 'male',
    lookingForNationality: 'tr',
    photoUrls: [
      'https://example.test/detail-photo-1.jpg',
      'https://example.test/detail-photo-2.jpg',
      'https://example.test/detail-photo-3.jpg',
    ],
    about: 'Detaylı profili olan bir adayım.',
    aboutTr: 'Detaylı profili olan bir adayım.',
    expectations: 'Dürüst ve aile kurmaya hazır bir eş adayı arıyorum.',
    expectationsTr: 'Dürüst ve aile kurmaya hazır bir eş adayı arıyorum.',
    details: {
      heightCm: 168,
      weightKg: 58,
      occupation: 'teacher',
      occupationTr: 'Ogretmen',
      education: 'university',
      educationDepartment: 'Psikoloji',
      maritalStatus: 'divorced',
      hasChildren: 'yes',
      childrenCount: 2,
      childrenLivingSituation: 'withChildren',
      liveWithChildrenAfterMarriage: 'yes',
      incomeLevel: 'medium',
      religion: 'islam',
      religiousValues: 'conservative',
      familyApprovalStatus: 'yes',
      marriageTimeline: 'within1year',
      relocationWillingness: 'yes',
      preferredLivingCountry: 'Turkiye',
      communicationLanguage: 'tr',
      smoking: 'no',
      alcohol: 'no',
      languages: {
        native: { code: 'tr', other: '' },
        foreign: { codes: ['en', 'ar'], other: '' },
      },
    },
    partnerPreferences: {
      ageMin: 32,
      ageMax: 44,
      ageMaxOlderYears: 10,
      ageMaxYoungerYears: 2,
      heightMinCm: 170,
      heightMaxCm: 195,
      maritalStatus: 'single',
      religion: 'islam',
      livingCountry: 'tr',
      childrenPreference: 'accepts_with_children',
      educationPreference: 'university',
      occupationPreference: 'professional',
      familyValuesPreference: 'conservative',
      communicationMethods: ['own_language', 'translation_app'],
      smokingPreference: 'no',
      alcoholPreference: 'no',
    },
  };
}

async function signInWithCustomToken(page, customToken) {
  await page.goto('/login?lang=tr', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async (tokenValue) => {
    const mod = await import('/tests/browser-auth-helper.js');
    return mod.signInWithCustomTokenForTests(tokenValue);
  }, customToken);
}

async function suppressTourNoise(page, uid) {
  await page.addInitScript((tourUid) => {
    try {
      window.localStorage.setItem('uniqah:tour:publicSeen:public-guidance-wedding', '1');
      window.sessionStorage.setItem('uniqah:tour:publicSeen:public-guidance-wedding', '1');
      const entryId = 'e2e';
      window.localStorage.setItem(`uniqah:pwa-nudge:suppressed:${tourUid}`, '1');
      window.sessionStorage.setItem('uniqah:pwa-nudge:entry:uid', String(tourUid));
      window.sessionStorage.setItem('uniqah:pwa-nudge:entry:id', entryId);
      window.sessionStorage.setItem(`uniqah:tour:pwa-install-nudge:${tourUid}:${entryId}:shown`, '1');
    } catch {
      // ignore
    }
  }, uid);
}

async function seedUserWithApplication({ uid, email, fullName, profile, source = 'manual_seed' }) {
  const now = Date.now();
  const applicationId = `app_${uid}`;
  const username = safeStr(profile?.username);
  const lookingForNationality = safeStr(profile?.lookingForNationality) || null;
  const applicationPayload = {
    id: applicationId,
    userId: uid,
    source,
    createdAtMs: now,
    updatedAtMs: now,
    username,
    usernameLower: username.toLowerCase(),
    fullName,
    age: profile?.age,
    city: profile?.city,
    country: profile?.country,
    nationality: profile?.nationality,
    gender: profile?.gender,
    lookingForGender: profile?.lookingForGender,
    lookingForNationality,
    photoUrls: Array.isArray(profile?.photoUrls) ? profile.photoUrls : [],
    about: safeStr(profile?.about),
    aboutTr: safeStr(profile?.aboutTr),
    expectations: safeStr(profile?.expectations),
    expectationsTr: safeStr(profile?.expectationsTr),
    details: profile?.details || {},
    partnerPreferences: profile?.partnerPreferences || {},
  };

  await db.collection('matchmakingUsers').doc(uid).set(
    {
      email,
      authEmail: email,
      authEmailLower: email.toLowerCase(),
      emailLower: email.toLowerCase(),
      emailVerified: true,
      fullName,
      username,
      usernameLower: username.toLowerCase(),
      age: profile?.age,
      city: profile?.city,
      country: profile?.country,
      nationality: profile?.nationality,
      gender: profile?.gender,
      lookingForGender: profile?.lookingForGender,
      lookingForNationality,
      hasSubmittedProfile: true,
      applicationState: 'real',
      applicationId,
      profileLang: 'tr',
      createdAtMs: now,
      updatedAtMs: now,
      photoUrls: Array.isArray(profile?.photoUrls) ? profile.photoUrls : [],
      application: applicationPayload,
      publicProfile: applicationPayload,
      details: profile?.details || {},
      partnerPreferences: profile?.partnerPreferences || {},
    },
    { merge: true }
  );

  await db.collection('matchmakingApplications').doc(applicationId).set(applicationPayload, { merge: true });

  return { applicationId, applicationPayload };
}

async function expectSectionCount(page, sectionTestId, itemTestId, expectedCount) {
  const section = page.getByTestId(sectionTestId);
  if (expectedCount <= 0) {
    await expect(section).toHaveCount(0);
    return;
  }
  await expect(section).toBeVisible();
  await expect(page.getByTestId(itemTestId)).toHaveCount(expectedCount);
}

test('my people photo and detail areas open separately and full detail payload is rendered', async ({ browser }) => {
  test.setTimeout(240000);

  const token = uniqueToken();
  const password = 'Test1234!';
  const viewerEmail = buildViewerEmail(token);
  const targetEmail = buildTargetEmail(token);
  const viewerProfile = buildViewerProfile(token);
  const targetProfile = buildTargetProfile(token);
  let viewerUid = '';
  let targetUid = '';
  const cleanupDocPaths = [];

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const createdViewer = await auth.createUser({
      email: viewerEmail,
      password,
      emailVerified: true,
      displayName: viewerProfile.fullName,
      disabled: false,
    });
    viewerUid = String(createdViewer?.uid || '').trim();

    const createdTarget = await auth.createUser({
      email: targetEmail,
      password,
      emailVerified: true,
      displayName: targetProfile.fullName,
      disabled: false,
    });
    targetUid = String(createdTarget?.uid || '').trim();
    const requestId = `${viewerUid}__${targetUid}`;

    const viewerSeed = await seedUserWithApplication({
      uid: viewerUid,
      email: viewerEmail,
      fullName: viewerProfile.fullName,
      profile: viewerProfile,
    });
    const targetSeed = await seedUserWithApplication({
      uid: targetUid,
      email: targetEmail,
      fullName: targetProfile.fullName,
      profile: targetProfile,
    });

    cleanupDocPaths.push(
      `matchmakingUsers/${viewerUid}`,
      `matchmakingUsers/${targetUid}`,
      `matchmakingApplications/${viewerSeed.applicationId}`,
      `matchmakingApplications/${targetSeed.applicationId}`,
      `matchmakingUsers/${viewerUid}/outboxPreMatchRequests/${requestId}`
    );

    await db.collection('matchmakingUsers').doc(viewerUid).collection('outboxPreMatchRequests').doc(requestId).set(
      {
        id: requestId,
        type: 'people_list',
        status: 'pending',
        fromUid: viewerUid,
        toUid: targetUid,
        targetUid,
        createdAtMs: Date.now(),
        updatedAtMs: Date.now(),
        targetProfile: targetSeed.applicationPayload,
      },
      { merge: true }
    );

    const customToken = await auth.createCustomToken(viewerUid);
    await suppressTourNoise(page, viewerUid);
    await signInWithCustomToken(page, customToken);

    await page.goto('/app/matches?lang=tr', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/app\/matches(\?|$)/, { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /orang saya|kişilerim|my people/i })).toBeVisible({ timeout: 30000 });

    const personCard = page.locator('[data-testid^="person-card-photo-"]').first()
      .locator('xpath=ancestor::div[contains(@class,"overflow-hidden") and contains(@class,"rounded-lg")][1]');
    await expect(personCard).toBeVisible({ timeout: 30000 });

    const photoRegion = personCard.locator('[data-testid^="person-card-photo-"]').first();
    const infoRegion = personCard.locator('[data-testid^="person-card-info-"]').first();

    await photoRegion.dispatchEvent('click');
    await expect(page.getByTestId('image-lightbox')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('person-profile-modal')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('image-lightbox')).toHaveCount(0);

    const profileResponsePromise = page.waitForResponse((response) => {
      if (!response.url().includes('/api/matchmaking-profile-view')) return false;
      if (response.request().method() !== 'POST') return false;
      const body = String(response.request().postData() || '');
      return !/"silent"\s*:\s*true/.test(body);
    }, { timeout: 30000 });

    await infoRegion.dispatchEvent('click');
    const profileResponse = await profileResponsePromise;
    const profileResponseText = await profileResponse.text();
    expect(profileResponse.status(), profileResponseText).toBe(200);
    const profileJson = profileResponseText ? JSON.parse(profileResponseText) : null;
    const profile = profileJson?.profile || null;

    expect(profile).toBeTruthy();
    expect(String(profile?.uid || '')).toBe(targetUid);

    const modal = page.getByTestId('person-profile-modal');
    await expect(modal).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('image-lightbox')).toHaveCount(0);
    await expect(modal.getByRole('button', { name: /kapat|close|tutup/i })).toBeVisible();

    await page.getByTestId('person-profile-overlay').click({ position: { x: 8, y: 8 } });
    await expect(page.getByTestId('person-profile-modal')).toHaveCount(0);

    const reopenProfileResponsePromise = page.waitForResponse((response) => {
      if (!response.url().includes('/api/matchmaking-profile-view')) return false;
      if (response.request().method() !== 'POST') return false;
      const body = String(response.request().postData() || '');
      return !/"silent"\s*:\s*true/.test(body);
    }, { timeout: 30000 });

    await infoRegion.dispatchEvent('click');
    const reopenProfileResponse = await reopenProfileResponsePromise;
    expect(reopenProfileResponse.status()).toBe(200);
    await expect(modal).toBeVisible({ timeout: 30000 });

    const uiLang = await page.evaluate(() => document.documentElement.lang || navigator.language || 'tr');
    const expectedIdentityCount = countIdentityItems(profile);
    const expectedDetailsCount = countDetailItems(profile);
    const expectedPartnerCount = countPartnerItems(profile);
    const expectedModalPhotoCount = Math.min(
      Array.isArray(profile?.photoUrls) ? profile.photoUrls.map((item) => safeStr(item)).filter(Boolean).length : 0,
      6
    );
    const aboutText = getLocalizedProfileText(profile, 'about', uiLang);
    const expectationsText = getLocalizedProfileText(profile, 'expectations', uiLang);

    await expectSectionCount(page, 'person-profile-identity-section', 'person-profile-identity-item', expectedIdentityCount);
    await expectSectionCount(page, 'person-profile-details-section', 'person-profile-details-item', expectedDetailsCount);
    await expectSectionCount(page, 'person-profile-partner-preferences', 'person-profile-partner-item', expectedPartnerCount);

    if (expectedModalPhotoCount > 0) {
      await expect(modal.locator('img')).toHaveCount(expectedModalPhotoCount);
    }

    if (safeStr(aboutText)) {
      await expect(page.getByTestId('person-profile-about-section')).toBeVisible();
      await expect(page.getByTestId('person-profile-about-section').locator('p').last()).toContainText(/\S/);
    } else {
      await expect(page.getByTestId('person-profile-about-section')).toHaveCount(0);
    }

    if (safeStr(expectationsText)) {
      await expect(page.getByTestId('person-profile-expectations-section')).toBeVisible();
      await expect(page.getByTestId('person-profile-expectations-section').locator('p').last()).toContainText(/\S/);
    } else {
      await expect(page.getByTestId('person-profile-expectations-section')).toHaveCount(0);
    }
  } finally {
    await context.close().catch(() => {});

    for (const path of cleanupDocPaths) {
      try {
        await db.doc(path).delete();
      } catch {
        // ignore
      }
    }

    if (viewerUid) {
      try {
        await auth.deleteUser(viewerUid);
      } catch {
        // ignore
      }
    }

    if (targetUid) {
      try {
        await auth.deleteUser(targetUid);
      } catch {
        // ignore
      }
    }
  }
});