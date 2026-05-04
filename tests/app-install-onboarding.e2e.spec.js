import { test, expect } from 'playwright/test';
import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

test.use({
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
  viewport: { width: 390, height: 844 },
});

const { auth, db, FieldValue } = getAdmin();

const emailAuthButtonName = /daftar dengan email\/kata sandi|email\/şifre ile kaydol|sign up with email|email\/password|e-posta ile kayıt ol/i;
const installButtonName = /uygulamayı yükle|install app|pasang aplikasi/i;
const googleSignupButtonName = /google ile kayıt ol|google ile devam et|sign up with google|daftar dengan google/i;
const continueOnWebButtonName = /web sayfasından devam et|continue on web|lanjut di web/i;
const openAppButtonName = /uygulamaya git|open app|buka aplikasi/i;

function uniqueToken() {
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

function buildRunScopedEmail(baseEmail, token) {
  const normalized = String(baseEmail || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    return `seed.appinstall.${token}@example.test`;
  }

  const atIndex = normalized.lastIndexOf('@');
  const localPart = normalized.slice(0, atIndex).replace(/\+.*$/, '');
  const domain = normalized.slice(atIndex + 1);
  return `${localPart}+${token}@${domain}`;
}

function buildRunScopedUsername(baseUsername, token) {
  const normalized = String(baseUsername || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  const suffix = token.slice(-6);
  if (!normalized) return `seedapp${suffix}`;
  return `${normalized.slice(0, 18)}${suffix}`;
}

function buildTinyPngBuffer() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnHCq0AAAAASUVORK5CYII=',
    'base64',
  );
}

async function expectVisibleWithoutScroll(locator) {
  await expect(locator).toBeVisible();
  const inViewport = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    return rect.top >= 0 && rect.left >= 0 && rect.bottom <= vh && rect.right <= vw;
  });
  expect(inViewport).toBe(true);
}

async function dismissApplyIntroIfPresent(page) {
  for (let index = 0; index < 3; index += 1) {
    const dialog = page.getByRole('dialog').filter({ hasText: /lanjut|devam|next|lewati|skip/i }).last();
    const visible = await dialog.isVisible().catch(() => false);
    if (!visible) return;

    const continueButton = dialog.getByRole('button', { name: /lanjut|devam|next/i });
    const skipButton = dialog.getByRole('button', { name: /lewati|atla|skip/i });

    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
      continue;
    }

    if (await skipButton.isVisible().catch(() => false)) {
      await skipButton.click();
      return;
    }

    return;
  }
}

async function clickFirstVisible(locator) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click();
      return true;
    }
  }
  return false;
}

async function dismissBlockingDialogs(page) {
  for (let index = 0; index < 10; index += 1) {
    if (await clickFirstVisible(page.getByRole('button', { name: /geç|lewati|atla|skip|nanti|later|sonra/i }))) continue;
    if (await clickFirstVisible(page.getByRole('button', { name: /tamam|ok|done|selesai|continue|lanjut|devam/i }))) continue;
    if (await clickFirstVisible(page.getByRole('button', { name: /konfirmasi|confirm|onayla/i }))) continue;
    if (await clickFirstVisible(page.getByRole('button', { name: /okudum|i have read/i }))) continue;
    return;
  }
}

async function signUpWithEmail(page, email, password) {
  await page.getByRole('button', { name: emailAuthButtonName }).click();

  const emailInput = page.locator('input[type="email"]:visible').first();
  const passwordInput = page.locator('input[type="password"]:visible').first();
  const confirmPasswordInput = page.locator('input[type="password"]:visible').nth(1);

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(confirmPasswordInput).toBeVisible();

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await confirmPasswordInput.fill(password);
  const signupResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/public-email-signup') && response.request().method() === 'POST',
    { timeout: 120000 },
  );
  await page.locator('form button[type="submit"]:visible').first().click();
  const signupResponse = await signupResponsePromise;
  expect(signupResponse.status()).toBe(200);
  return signupResponse.json();
}

async function confirmGenderIfPresent(page) {
  const dialog = page.getByRole('dialog', { name: /cinsiyet onayı|confirm gender/i });
  const isVisible = await dialog.isVisible().catch(() => false);
  if (!isVisible) return;

  await dialog.getByRole('button', { name: /konfirmasi|onayla|confirm/i }).click();
  await expect(dialog).toBeHidden();
}

function controlAfterLabel(scope, labelRegex) {
  return scope
    .locator('label')
    .filter({ hasText: labelRegex })
    .locator('xpath=following-sibling::*[self::input or self::select or self::textarea][1]')
    .first();
}

async function completeRequiredApplicationStep(page, username) {
  await dismissApplyIntroIfPresent(page);
  await dismissBlockingDialogs(page);

  await expect(page).toHaveURL(/\/evlilik\/eslestirme-basvuru(\?|$)/);
  const form = page.locator('form').first();

  await expect(form).toBeVisible();
  await expect(controlAfterLabel(form, /kullanıcı adı|username/i)).toBeVisible();

  await controlAfterLabel(form, /kullanıcı adı|username/i).fill(username);
  await controlAfterLabel(form, /ad soyad|full name/i).fill('E2E Test Kullanici');
  await controlAfterLabel(form, /^yaş$|^age$/i).fill('29');
  await controlAfterLabel(form, /şehir|city/i).fill('Istanbul');
  await controlAfterLabel(form, /uyruğunuz nedir|nationality/i).fill('Turk');
  await controlAfterLabel(form, /cinsiyet|gender/i).selectOption('female');
  await confirmGenderIfPresent(page);
  await dismissBlockingDialogs(page);
  await controlAfterLabel(form, /meslek|occupation/i).fill('Ogretmen');
  await controlAfterLabel(form, /medeni durum|marital status/i).selectOption('single');
  const phoneInput = form.locator('input[placeholder*="+90 5xx xxx xx xx"]').first();
  await phoneInput.fill('+905551112233');
  await expect(phoneInput).toHaveValue('+905551112233');

  await form.getByRole('button', { name: /^fotograf$|^fotoğraf$|^photo$|^foto$/i }).click();
  const photoDialog = page.getByRole('dialog', { name: /fotograf|fotoğraf|photo|foto/i });
  await expect(photoDialog).toBeVisible();
  await page.locator('#mk-photo1').setInputFiles({
    name: 'e2e-photo.png',
    mimeType: 'image/png',
    buffer: buildTinyPngBuffer(),
  });
  await photoDialog.getByRole('button', { name: /tamamla|done|selesai|tamam/i }).click();

  const consentCheckboxes = form.locator('input[type="checkbox"]:visible');
  await consentCheckboxes.nth(0).check();
  await consentCheckboxes.nth(1).check();
  await consentCheckboxes.nth(2).check();
  await dismissBlockingDialogs(page);

  const submitResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/matchmaking-application-submit') && response.request().method() === 'POST',
    { timeout: 120000 },
  );

  const submitButton = form.getByRole('button', { name: /bitir|finish|wizard\.finish|selesai|tamam/i }).last();
  await expect(submitButton).toBeVisible();
  await submitButton.evaluate((button) => button.click());
  const submitResponse = await submitResponsePromise;
  expect(submitResponse.status()).toBe(200);
  return submitResponse.json();
}

async function resolveUidByEmail(email) {
  try {
    const userRecord = await auth.getUserByEmail(email);
    return String(userRecord?.uid || '').trim();
  } catch {
    return '';
  }
}

async function hideSyntheticTestUser(email, explicitUid = '') {
  const uid = explicitUid || (await resolveUidByEmail(email));
  if (!uid) return;

  const nowMs = Date.now();
  const now = FieldValue.serverTimestamp();
  const [applicationsSnap, matchesSnap] = await Promise.all([
    db.collection('matchmakingApplications').where('userId', '==', uid).limit(25).get(),
    db.collection('matchmakingMatches').where('userIds', 'array-contains', uid).limit(25).get().catch(() => ({ docs: [] })),
  ]);

  const batch = db.batch();
  for (const docSnap of applicationsSnap.docs || []) {
    batch.set(
      docSnap.ref,
      {
        isSyntheticTestUser: true,
        testAccount: true,
        hiddenAt: now,
        hiddenAtMs: nowMs,
        hiddenReason: 'e2e_cleanup',
        source: 'seed',
        seedTag: 'e2e_hidden',
        seedBatchId: 'e2e_hidden',
        status: 'hidden_test_user',
        userCode: FieldValue.delete(),
        userCodeNo: FieldValue.delete(),
        updatedAt: now,
        updatedAtMs: nowMs,
      },
      { merge: true },
    );
  }

  for (const docSnap of matchesSnap.docs || []) {
    batch.set(
      docSnap.ref,
      {
        status: 'deleted_user',
        updatedAt: now,
        updatedAtMs: nowMs,
        deletedUserIds: {
          [uid]: now,
        },
      },
      { merge: true },
    );
  }

  batch.set(
    db.collection('matchmakingUsers').doc(uid),
    {
      isSyntheticTestUser: true,
      testAccount: true,
      hiddenAt: now,
      hiddenAtMs: nowMs,
      hiddenReason: 'e2e_cleanup',
      source: 'seed',
      seedTag: 'e2e_hidden',
      seedBatchId: 'e2e_hidden',
      userCode: FieldValue.delete(),
      userCodeNo: FieldValue.delete(),
      userCodeGender: FieldValue.delete(),
      userCodeAssignedAtMs: FieldValue.delete(),
      'publicProfile.userCode': FieldValue.delete(),
      'publicProfile.userCodeNo': FieldValue.delete(),
      updatedAt: now,
      updatedAtMs: nowMs,
    },
    { merge: true },
  );

  await batch.commit();
  await auth.updateUser(uid, { disabled: true }).catch(() => {});
  await auth.revokeRefreshTokens(uid).catch(() => {});
}

test('install link opens install CTA first, then app welcome opens directly at Google signup level', async ({ page, baseURL, context }) => {
  test.setTimeout(240000);

  const token = uniqueToken();
  const email = buildRunScopedEmail(process.env.E2E_SIGNUP_EMAIL, token);
  const password = String(process.env.E2E_SIGNUP_PASSWORD || 'Test1234!').trim();
  const username = buildRunScopedUsername(process.env.E2E_SIGNUP_USERNAME, token);
  const origin = String(baseURL || 'http://127.0.0.1:5173').trim();
  let uid = '';

  console.log(`[e2e] app-install signup email: ${email}`);
  console.log(`[e2e] app-install username: ${username}`);

  await context.grantPermissions(['notifications'], { origin });

  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('uniqah:tour:publicSeen:public-guidance-wedding', '1');
      window.sessionStorage.setItem('uniqah:tour:publicSeen:public-guidance-wedding', '1');
    } catch {
      // ignore
    }

    window.__uniqahDeferredPrompt = {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    };
  });

  try {
    await page.goto('/uygulama', { waitUntil: 'domcontentloaded' });
    const installButton = page.getByRole('button', { name: installButtonName });
    await expectVisibleWithoutScroll(installButton);

    await installButton.click();
    const continueOnWebButton = page.getByRole('button', { name: continueOnWebButtonName }).last();
    const openAppButton = page.getByRole('button', { name: openAppButtonName });

    if (await continueOnWebButton.isVisible().catch(() => false)) {
      await expectVisibleWithoutScroll(continueOnWebButton);
      await continueOnWebButton.click();
    }

    await expectVisibleWithoutScroll(openAppButton);
    await openAppButton.click();
    await expect(page).toHaveURL(/\/app\/welcome(\?|$)/, { timeout: 30000 });

    const googleSignupButton = page.getByRole('button', { name: googleSignupButtonName });
    await expectVisibleWithoutScroll(googleSignupButton);

    const signupJson = await signUpWithEmail(page, email, password);
    uid = String(signupJson?.uid || '').trim();
    expect(uid).toBeTruthy();

    await expect(page).toHaveURL(/\/evlilik\/eslestirme-basvuru(\?|$)/, { timeout: 30000 });

    await page.evaluate((tourUid) => {
      try {
        const entryId = 'e2e';
        window.localStorage.setItem(`uniqah:pwa-nudge:suppressed:${tourUid}`, '1');
        window.sessionStorage.setItem('uniqah:pwa-nudge:entry:uid', String(tourUid));
        window.sessionStorage.setItem('uniqah:pwa-nudge:entry:id', entryId);
        window.sessionStorage.setItem(`uniqah:tour:pwa-install-nudge:${tourUid}:${entryId}:shown`, '1');
      } catch {
        // ignore
      }
    }, uid);

    await dismissBlockingDialogs(page);

    await expect.poll(
      async () => {
        const savedUser = await db.collection('matchmakingUsers').doc(uid).get();
        const savedUserData = savedUser.data() || {};
        return String(savedUserData?.userCode || savedUserData?.publicProfile?.userCode || '');
      },
      { timeout: 30000 },
    ).toBe('');

    const bootstrapApps = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(10).get();
    for (const docSnap of bootstrapApps.docs || []) {
      const appData = docSnap.data() || {};
      expect(String(appData?.userCode || '')).toBe('');
    }
  } finally {
    await page.evaluate(async () => {
      const mod = await import('/tests/browser-auth-helper.js');
      await mod.signOutForTests();
    }).catch(() => {});

    await hideSyntheticTestUser(email, uid).catch(() => {});
  }
});