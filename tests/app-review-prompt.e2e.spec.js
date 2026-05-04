import { test, expect } from 'playwright/test';
import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

test.use({
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
});

const { auth, db } = getAdmin();

const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnHCq0AAAAASUVORK5CYII=';

function uniqueToken() {
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

function buildEmail(token, prefix) {
  return `seed.${prefix}.${token}@example.test`;
}

function buildUsername(token, prefix) {
  return `${prefix}${token.slice(-8)}`;
}

async function seedReviewReadyProfile({ uid, email, username, fullName }) {
  const nowMs = Date.now();
  const applicationId = `review_ready_${uid}`;
  const shared = {
    username,
    usernameLower: username.toLowerCase(),
    fullName,
    age: 29,
    city: 'Istanbul',
    country: 'Turkiye',
    nationality: 'Turkiye',
    gender: 'female',
    lookingForGender: 'male',
    whatsapp: '+905551112233',
    photoUrls: [TINY_PNG_DATA_URL],
    details: {
      occupation: 'Ogretmen',
      maritalStatus: 'single',
    },
    consent18Plus: true,
    consentPrivacy: true,
    consentTerms: true,
    deferredPhotoRequiredForInteraction: false,
  };

  await db.collection('matchmakingApplications').doc(applicationId).set(
    {
      userId: uid,
      source: 'apply_submit',
      status: 'new',
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
      ...shared,
    },
    { merge: true }
  );

  await db.collection('matchmakingUsers').doc(uid).set(
    {
      email,
      authEmail: email,
      emailVerified: true,
      applicationId,
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
      profileLang: 'tr',
      hasSubmittedProfile: true,
      applicationState: 'real',
      ...shared,
      application: {
        ...shared,
      },
      publicProfile: {
        username,
        usernameLower: username.toLowerCase(),
        fullName,
        age: 29,
        city: 'Istanbul',
        country: 'Turkiye',
        nationality: 'Turkiye',
        gender: 'female',
        lookingForGender: 'male',
        photoUrls: [TINY_PNG_DATA_URL],
        deferredPhotoRequiredForInteraction: false,
      },
    },
    { merge: true }
  );

  return { applicationId };
}

async function signInForProfile(page, customToken, uid) {
  await page.goto('/login?lang=tr', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async (tokenValue) => {
    const mod = await import('/tests/browser-auth-helper.js');
    return mod.signInWithCustomTokenForTests(tokenValue);
  }, customToken);

  await expect.poll(async () => {
    return page.evaluate(async () => {
      const { auth } = await import('/src/config/firebaseAuth.js');
      return String(auth.currentUser?.uid || '').trim();
    });
  }, { timeout: 15000 }).toBe(uid);

  await page.addInitScript((tourUid) => {
    try {
      window.localStorage.setItem('uniqah:tour:publicSeen:public-guidance-wedding', '1');
      window.sessionStorage.setItem('uniqah:tour:publicSeen:public-guidance-wedding', '1');
      window.localStorage.setItem(`uniqah:pwa-nudge:suppressed:${tourUid}`, '1');
      window.sessionStorage.setItem('uniqah:pwa-nudge:entry:uid', String(tourUid));
      window.sessionStorage.setItem('uniqah:pwa-nudge:entry:id', 'e2e-review');
      window.sessionStorage.setItem(`uniqah:tour:pwa-install-nudge:${tourUid}:e2e-review:shown`, '1');
    } catch {
      // ignore
    }
  }, uid);

  await page.goto('/profilim?lang=tr', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/profilim(\?|$)/, { timeout: 30000 });
}

async function waitForFeedbackApiReady() {
  await expect.poll(
    async () => {
      try {
        const res = await fetch('http://127.0.0.1:3000/api/matchmaking-feedback-submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{}',
        });
        return res.status;
      } catch {
        return 0;
      }
    },
    { timeout: 20000 }
  ).toBe(401);
}

async function signOutForTests(page) {
  await page
    .evaluate(async () => {
      const mod = await import('/tests/browser-auth-helper.js');
      await mod.signOutForTests();
    })
    .catch(() => {});
}

async function cleanupUserArtifacts(uid) {
  const feedbackSnap = await db.collection('matchmakingFeedback').where('userId', '==', uid).limit(30).get();
  const appsSnap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(20).get();

  const batch = db.batch();
  for (const docSnap of feedbackSnap.docs || []) batch.delete(docSnap.ref);
  for (const docSnap of appsSnap.docs || []) batch.delete(docSnap.ref);
  batch.delete(db.collection('matchmakingUsers').doc(uid));
  await batch.commit();
  await auth.deleteUser(uid).catch(() => {});
}

test('TR user can open review tutorial from profile menu and submit review', async ({ page }) => {
  test.setTimeout(180000);

  const token = uniqueToken();
  const email = buildEmail(token, 'review.manual');
  const password = 'Test1234!';
  const username = buildUsername(token, 'reviewm');
  const fullName = 'Ayse Demir';
  const reviewMessage = `E2E review ${token} uygulama akisi cok net.`;
  let uid = '';

  const createdUser = await auth.createUser({
    email,
    password,
    emailVerified: true,
    displayName: fullName,
    disabled: false,
  });
  uid = String(createdUser?.uid || '').trim();
  const customToken = await auth.createCustomToken(uid);
  await seedReviewReadyProfile({ uid, email, username, fullName });

  try {
    await signInForProfile(page, customToken, uid);
    await waitForFeedbackApiReady();

    const actionMenuButton = page.locator('button[aria-controls="profile-hamburger-menu"]').first();
    await expect(actionMenuButton).toBeVisible({ timeout: 30000 });
    await actionMenuButton.click();

    const reviewMenuButton = page.getByRole('button', { name: 'Uygulamayı değerlendir' }).last();
    await expect(reviewMenuButton).toBeVisible();
    await reviewMenuButton.click();

    const introDialog = page.getByRole('dialog').filter({ hasText: 'Uygulamayı değerlendir' });
    await expect(introDialog).toBeVisible();
    await introDialog.getByRole('button', { name: 'Okudum, aç' }).click();

    await expect(page.getByText('Uygulamamızı değerlendirir misiniz?')).toBeVisible({ timeout: 10000 });

    const stars = page.locator('button').filter({ hasText: '☆' });
    await expect(stars).toHaveCount(5);
    await stars.nth(4).click();

    await page.getByPlaceholder('Neyi beğendiniz, neyi geliştirmeliyiz?').fill(reviewMessage);
    await page.getByRole('button', { name: 'Değerlendirmeyi gönder' }).click();

    await expect(page.getByText('Teşekkürler. Değerlendirmeniz alındı.')).toBeVisible({ timeout: 15000 });

    await expect.poll(async () => {
      const snap = await db.collection('matchmakingFeedback').where('userId', '==', uid).where('kind', '==', 'review').limit(10).get();
      const found = snap.docs
        .map((docSnap) => docSnap.data() || {})
        .find((item) => String(item?.message || '').trim() === reviewMessage);
      return found
        ? {
            rating: found?.review?.rating || 0,
            publicConsent: found?.review?.publicConsent === true,
            source: String(found?.review?.source || '').trim(),
          }
        : null;
    }, { timeout: 20000 }).toEqual({
      rating: 5,
      publicConsent: true,
      source: 'app_review_prompt_v1',
    });
  } finally {
    await signOutForTests(page);
    if (uid) await cleanupUserArtifacts(uid);
  }
});

test('TR user sees review prompt automatically after the 2-day delay on profile page', async ({ page }) => {
  test.setTimeout(180000);

  const token = uniqueToken();
  const email = buildEmail(token, 'review.auto');
  const password = 'Test1234!';
  const username = buildUsername(token, 'reviewa');
  const fullName = 'Fatma Kaya';
  let uid = '';

  const createdUser = await auth.createUser({
    email,
    password,
    emailVerified: true,
    displayName: fullName,
    disabled: false,
  });
  uid = String(createdUser?.uid || '').trim();
  const customToken = await auth.createCustomToken(uid);
  await seedReviewReadyProfile({ uid, email, username, fullName });

  try {
    await page.addInitScript((offsetMs) => {
      const originalDateNow = Date.now.bind(Date);
      Date.now = () => originalDateNow() + Number(offsetMs || 0);
    }, 2 * 24 * 60 * 60 * 1000 + 10 * 1000);

    await signInForProfile(page, customToken, uid);

    await expect(page.getByText('Uygulamamızı değerlendirir misiniz?')).toBeVisible({ timeout: 10000 });
  } finally {
    await signOutForTests(page);
    if (uid) await cleanupUserArtifacts(uid);
  }
});