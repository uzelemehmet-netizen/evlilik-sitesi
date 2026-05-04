import { test, expect } from 'playwright/test';
import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

test.use({
  locale: 'id-ID',
  timezoneId: 'Asia/Jakarta',
});

const genderConfirmDialogName = /cinsiyet onayı|confirm gender/i;

const { auth, db } = getAdmin();

function uniqueToken() {
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

function buildRunScopedEmail(token) {
  return `seed.apply.id.${token}@example.test`;
}

function buildRunScopedUsername(token) {
  return `applyid${token.slice(-8)}`;
}

function buildTinyPngBuffer() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnHCq0AAAAASUVORK5CYII=',
    'base64'
  );
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
    if (await clickFirstVisible(page.getByRole('button', { name: /lewati|atla|skip|nanti|later/i }))) {
      continue;
    }

    if (await clickFirstVisible(page.getByRole('button', { name: /konfirmasi|confirm|onayla/i }))) {
      continue;
    }

    if (await clickFirstVisible(page.getByRole('button', { name: /okudum|i have read|continue|lanjut|devam/i }))) {
      continue;
    }

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

  await dialog.getByRole('button', { name: /konfirmasi|onayla|confirm/i }).click();
  await expect(dialog).toBeHidden();
}

test('ID user can fill matchmaking apply form and submit successfully', async ({ page }) => {
  test.setTimeout(240000);

  const token = uniqueToken();
  const email = buildRunScopedEmail(token);
  const password = 'Test1234!';
  const username = buildRunScopedUsername(token);
  let uid = '';

  console.log(`[e2e] apply-submit-id email: ${email}`);
  console.log(`[e2e] apply-submit-id username: ${username}`);

  const createdUser = await auth.createUser({
    email,
    password,
    emailVerified: true,
    displayName: 'Siti Nurhaliza',
    disabled: false,
  });
  uid = String(createdUser?.uid || '').trim();
  const customToken = await auth.createCustomToken(uid);

  await db.collection('matchmakingUsers').doc(uid).set(
    {
      email,
      emailVerified: true,
      fullName: 'Siti Nurhaliza',
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      profileLang: 'id',
    },
    { merge: true }
  );

  try {
    await page.goto('/login?lang=id', { waitUntil: 'domcontentloaded' });
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

    await page.goto('/evlilik/eslestirme-basvuru?w=1&lang=id', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/evlilik\/eslestirme-basvuru(\?|$)/, { timeout: 30000 });

    await dismissApplyIntroIfPresent(page);
    await dismissBlockingDialogs(page);

    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    await controlAfterLabel(form, /nama pengguna|kullanıcı adı|username/i).fill(username);
    await controlAfterLabel(form, /nama lengkap|ad soyad|full name/i).fill('Siti Nurhaliza');
    await controlAfterLabel(form, /usia|yaş|age/i).fill('27');
    await controlAfterLabel(form, /kota|şehir|city/i).fill('Jakarta');
    await controlAfterLabel(form, /kewarganegaraan|uyruğunuz nedir|nationality/i).fill('Indonesia');
    await controlAfterLabel(form, /jenis kelamin|cinsiyet|gender/i).selectOption('female');
    await confirmGenderIfPresent(page);
    await dismissBlockingDialogs(page);
    await controlAfterLabel(form, /pekerjaan|meslek|occupation/i).fill('Guru');
    await controlAfterLabel(form, /status pernikahan|medeni durum|marital status/i).selectOption('single');
    await controlAfterLabel(form, /nomor kontak|iletişim numarası|whatsapp|contact number|phone/i).fill('+628123456789');

    await dismissBlockingDialogs(page);
    await form.getByRole('button', { name: /^fotoğraf$|^foto$|^photo$/i }).click();
    const photoDialog = page.getByRole('dialog', { name: /fotoğraf|foto|photo/i });
    await expect(photoDialog).toBeVisible();
    await page.locator('#mk-photo1').setInputFiles({
      name: 'e2e-photo.png',
      mimeType: 'image/png',
      buffer: buildTinyPngBuffer(),
    });
    await photoDialog.getByRole('button', { name: /selesai|tamamla|done/i }).click();

    const consentCheckboxes = form.locator('input[type="checkbox"]:visible');
    await consentCheckboxes.nth(0).check();
    await consentCheckboxes.nth(1).check();
    await consentCheckboxes.nth(2).check();
    await dismissBlockingDialogs(page);

    const submitResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/matchmaking-application-submit') && response.request().method() === 'POST',
      { timeout: 120000 }
    );

    await form.getByRole('button', { name: /selesai|bitir|finish/i }).click();

    const submitResponse = await submitResponsePromise;
    expect(submitResponse.status()).toBe(200);

    const submitJson = await submitResponse.json();
    expect(submitJson?.ok).toBe(true);
    expect(typeof submitJson?.applicationId).toBe('string');

    await page.waitForURL(/\/(profilim|app\/pool|app\/welcome)(\?|$)/, { timeout: 120000 });
    expect(page.url()).toMatch(/\/(profilim|app\/pool|app\/welcome)(\?|$)/);
    console.log(`[e2e] apply-submit-id final url: ${page.url()}`);

    const savedApp = await db.collection('matchmakingApplications').doc(String(submitJson.applicationId)).get();
    expect(savedApp.exists).toBe(true);
    const savedData = savedApp.data() || {};
    expect(String(savedData?.details?.occupation || '')).toBe('Guru');
    expect(String(savedData?.source || '')).toBe('apply_submit');
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

      const batch = db.batch();
      for (const docSnap of applicationsSnap.docs || []) batch.delete(docSnap.ref);
      for (const docSnap of matchesSnap.docs || []) {
        batch.set(docSnap.ref, { status: 'deleted_user', updatedAtMs: Date.now() }, { merge: true });
      }
      batch.delete(db.collection('matchmakingUsers').doc(uid));
      await batch.commit();

      await auth.deleteUser(uid).catch(() => {});
    }
  }
});