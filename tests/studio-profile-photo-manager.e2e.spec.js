import { test, expect } from 'playwright/test';
import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

test.use({
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
});

const genderConfirmDialogName = /cinsiyet onayı|confirm gender/i;
const { auth, db } = getAdmin();

function buildTinyPngBuffer() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnHCq0AAAAASUVORK5CYII=',
    'base64'
  );
}

function uniqueToken() {
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

function buildRunScopedEmail(token) {
  return `seed.profile.photo.${token}@example.test`;
}

function buildRunScopedUsername(token) {
  return `profilepm${token.slice(-8)}`;
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
  const dialogButtons = page.getByRole('dialog').locator('button');
  for (let index = 0; index < 10; index += 1) {
    if (await clickFirstVisible(dialogButtons.filter({ hasText: /lewati|atla|skip|nanti|later/i }))) continue;
    if (await clickFirstVisible(dialogButtons.filter({ hasText: /konfirmasi|confirm|onayla/i }))) continue;
    if (await clickFirstVisible(dialogButtons.filter({ hasText: /okudum|i have read|continue|lanjut|devam|tamam/i }))) continue;
    return;
  }
}

function controlAfterLabel(scope, labelRegex) {
  return scope
    .locator('label')
    .filter({ hasText: labelRegex })
    .locator('xpath=following-sibling::*[self::input or self::select or self::textarea][1]')
    .first();
}

async function confirmGenderIfPresent(page) {
  const dialog = page.getByRole('dialog', { name: genderConfirmDialogName });
  const visible = await dialog.isVisible().catch(() => false);
  if (!visible) return;
  await dialog.getByRole('button', { name: /konfirmasi|onayla|confirm/i }).dispatchEvent('click');
  await expect.poll(async () => dialog.isVisible().catch(() => false)).toBe(false);
}

test('TR user can make another existing slot the profile photo from the photo manager', async ({ page }) => {
  test.setTimeout(240000);

  const token = uniqueToken();
  const email = buildRunScopedEmail(token);
  const password = 'Test1234!';
  const username = buildRunScopedUsername(token);
  let uid = '';
  let applicationId = '';

  const createdUser = await auth.createUser({
    email,
    password,
    emailVerified: true,
    displayName: 'Ayse Demir',
    disabled: false,
  });
  uid = String(createdUser?.uid || '').trim();
  const customToken = await auth.createCustomToken(uid);

  await db.collection('matchmakingUsers').doc(uid).set(
    {
      email,
      emailVerified: true,
      fullName: 'Ayse Demir',
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      profileLang: 'tr',
    },
    { merge: true }
  );

  try {
    await page.goto('/login?lang=tr', { waitUntil: 'domcontentloaded' });
    await page.addInitScript(() => {
      try {
        const proto = HTMLInputElement.prototype;
        const originalClick = proto.click;
        proto.showPicker = function showPickerForE2E() {
          window.__e2eShowPickerCalls = (window.__e2eShowPickerCalls || 0) + 1;
          return originalClick.call(this);
        };
      } catch {
        // ignore
      }
    });
    await page.evaluate(async (tokenValue) => {
      const mod = await import('/tests/browser-auth-helper.js');
      return mod.signInWithCustomTokenForTests(tokenValue);
    }, customToken);

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

    await page.goto('/evlilik/eslestirme-basvuru?w=1&lang=tr', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/evlilik\/eslestirme-basvuru(\?|$)/, { timeout: 30000 });

    await dismissApplyIntroIfPresent(page);
    await dismissBlockingDialogs(page);

    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    await page.getByRole('button', { name: /^fotograf$/i }).click();
    const applyPhotoDialog = page.getByRole('dialog', { name: /^fotograf$/i });
    await expect(applyPhotoDialog).toBeVisible();
    await page.locator('#mk-photo1').setInputFiles({
      name: 'apply-initial-photo.png',
      mimeType: 'image/png',
      buffer: buildTinyPngBuffer(),
    });
    await applyPhotoDialog.getByRole('button', { name: /tamamla/i }).click();
    await expect(applyPhotoDialog).toBeHidden();

    await controlAfterLabel(form, /nama pengguna|kullanıcı adı|username/i).fill(username);
    await controlAfterLabel(form, /nama lengkap|ad soyad|full name/i).fill('Ayse Demir');
    await controlAfterLabel(form, /usia|yaş|age/i).fill('28');
    await controlAfterLabel(form, /kota|şehir|city/i).fill('Istanbul');
    await controlAfterLabel(form, /kewarganegaraan|uyruğunuz nedir|nationality/i).fill('Turkiye');
    await controlAfterLabel(form, /jenis kelamin|cinsiyet|gender/i).selectOption('female');
    await confirmGenderIfPresent(page);
    await dismissBlockingDialogs(page);
    await controlAfterLabel(form, /pekerjaan|meslek|occupation/i).fill('Ogretmen');
    await controlAfterLabel(form, /status pernikahan|medeni durum|marital status/i).selectOption('single');
    await form.locator('input[placeholder*="+90 5xx xxx xx xx"]').first().fill('+905551112233');

    const consentCheckboxes = form.locator('input[type="checkbox"]:visible');
    await consentCheckboxes.nth(0).check();
    await consentCheckboxes.nth(1).check();
    await consentCheckboxes.nth(2).check();
    await dismissBlockingDialogs(page);

    const submitResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/matchmaking-application-submit') && response.request().method() === 'POST',
      { timeout: 120000 }
    );

    await form.evaluate((el) => el.requestSubmit());

    const submitResponse = await submitResponsePromise;
    const submitText = await submitResponse.text();
    const submitJson = submitText ? JSON.parse(submitText) : null;
    expect(submitResponse.status()).toBe(200);
    if (submitJson) expect(submitJson?.ok).toBe(true);

    await page.waitForURL(/\/profilim(\?|$)/, { timeout: 120000 });

    const applicationsSnap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(10).get();
    const appDocs = applicationsSnap.docs || [];
    expect(appDocs.length).toBeGreaterThan(0);
    applicationId = appDocs[0].id;

    await page.evaluate(() => {
      window.history.pushState(
        {
          usr: {
            openPhotoManager: true,
          },
          key: 'e2e-open-photo-manager-initial',
        },
        '',
        '/profilim'
      );
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    });

    const photoManagerDialog = page.getByRole('dialog', { name: /Fotoğraflar/i });
    await expect(photoManagerDialog).toBeVisible();
    await expect(photoManagerDialog.locator('#photo-slot-1')).toBeAttached();

    await page.evaluate(() => {
      try {
        delete HTMLInputElement.prototype.showPicker;
      } catch {
        HTMLInputElement.prototype.showPicker = undefined;
      }
    });

    await page.locator('#photo-slot-1').setInputFiles({
      name: 'second-photo.png',
      mimeType: 'image/png',
      buffer: buildTinyPngBuffer(),
    });
    await expect(photoManagerDialog.getByText('second-photo.png')).toBeVisible();

    await page.locator('#photo-slot-2').setInputFiles({
      name: 'third-photo.png',
      mimeType: 'image/png',
      buffer: buildTinyPngBuffer(),
    });
    await expect(photoManagerDialog.getByText('third-photo.png')).toBeVisible();

    const expandSlotsResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/matchmaking-photo-update-request') && response.request().method() === 'POST',
      { timeout: 120000 }
    );
    await photoManagerDialog.getByRole('button', { name: /Kaydet|Save|Simpan/i }).click();
    const expandSlotsResponse = await expandSlotsResponsePromise;
    expect(expandSlotsResponse.status()).toBe(200);
    const expandSlotsJson = await expandSlotsResponse.json();
    expect(expandSlotsJson?.ok).toBe(true);
    await expect(photoManagerDialog).toBeHidden();

    await expect.poll(async () => {
      const nextAppSnap = await db.collection('matchmakingApplications').doc(applicationId).get();
      return (Array.isArray(nextAppSnap.data()?.photoUrls) ? nextAppSnap.data().photoUrls.length : 0) >= 2;
    }, { timeout: 120000 }).toBe(true);

    const beforeReorderSnap = await db.collection('matchmakingApplications').doc(applicationId).get();
    const currentPhotoUrls = Array.isArray(beforeReorderSnap.data()?.photoUrls) ? beforeReorderSnap.data().photoUrls : [];
    expect(currentPhotoUrls.length).toBeGreaterThanOrEqual(2);
    const expectedReorderedUrls = [currentPhotoUrls[1], currentPhotoUrls[0], ...currentPhotoUrls.slice(2)];

    const managePhotosButton = page.getByRole('button', { name: /Fotoğraf Ekle\/Değiştir|Add\/Change Photos|Tambah\/Ubah foto/i });
    await expect(managePhotosButton).toBeVisible({ timeout: 30000 });
    await managePhotosButton.click();
    await expect(photoManagerDialog).toBeVisible();

    const setPrimaryButton = photoManagerDialog.getByRole('button', { name: /Profil fotoğrafı yap|Use as profile photo|Jadikan foto profil/i }).first();
    await expect(setPrimaryButton).toBeVisible();
    await setPrimaryButton.click();

    const reorderedRequestPromise = page.waitForRequest(
      (request) => request.url().includes('/api/matchmaking-photo-update-request') && request.method() === 'POST',
      { timeout: 120000 }
    );
    const reorderedResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/matchmaking-photo-update-request') && response.request().method() === 'POST',
      { timeout: 120000 }
    );

    await photoManagerDialog.getByRole('button', { name: /Kaydet|Save|Simpan/i }).click();

    const reorderedRequest = await reorderedRequestPromise;
    const reorderedBody = reorderedRequest.postDataJSON();
    expect(reorderedBody).toMatchObject({
      applicationId,
      photoUrls: expectedReorderedUrls,
    });

    const reorderedResponse = await reorderedResponsePromise;
    expect(reorderedResponse.status()).toBe(200);
    const reorderedJson = await reorderedResponse.json();
    expect(reorderedJson?.ok).toBe(true);
    await expect(photoManagerDialog).toBeHidden();

    await expect.poll(async () => {
      const nextAppSnap = await db.collection('matchmakingApplications').doc(applicationId).get();
      return nextAppSnap.data()?.photoUrls || [];
    }, { timeout: 120000 }).toEqual(expectedReorderedUrls);

    await expect.poll(async () => {
      const nextUserSnap = await db.collection('matchmakingUsers').doc(uid).get();
      return nextUserSnap.data()?.publicProfile?.photoUrls || [];
    }, { timeout: 120000 }).toEqual(expectedReorderedUrls);

    await managePhotosButton.click();
    await expect(photoManagerDialog).toBeVisible();
    await expect(photoManagerDialog.locator('img[alt="Profil fotoğrafı"]').first()).toHaveAttribute(
      'src',
      currentPhotoUrls[1]
    );
  } finally {
    await page.evaluate(async () => {
      const mod = await import('/tests/browser-auth-helper.js');
      await mod.signOutForTests();
    }).catch(() => {});

    if (uid) {
      const [applicationsSnap, matchesSnap] = await Promise.all([
        db.collection('matchmakingApplications').where('userId', '==', uid).limit(25).get(),
        db.collection('matchmakingMatches').where('userIds', 'array-contains', uid).limit(25).get().catch(() => ({ docs: [] })),
      ]);

      const cleanupBatch = db.batch();
      for (const docSnap of applicationsSnap.docs || []) cleanupBatch.delete(docSnap.ref);
      for (const docSnap of matchesSnap.docs || []) {
        cleanupBatch.set(docSnap.ref, { status: 'deleted_user', updatedAtMs: Date.now() }, { merge: true });
      }
      cleanupBatch.delete(db.collection('matchmakingUsers').doc(uid));
      await cleanupBatch.commit().catch(() => {});
      await auth.deleteUser(uid).catch(() => {});
    }
  }
});