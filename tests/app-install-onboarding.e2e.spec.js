import { test, expect } from 'playwright/test';

test.use({
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
});

const emailAuthButtonName = /daftar dengan email\/kata sandi|email\/şifre ile kaydol|sign up with email|email\/password/i;
const installButtonName = /uygulamayı yükle|install app|pasang aplikasi/i;
const enableNotificationsButtonName = /bildirimleri aç|enable notifications|aktifkan notifikasi/i;
const continueWithoutNotificationsButtonName = /bildirimi sonra ayarlayıp devam et|continue and set notifications later|lanjutkan, notifikasi diatur nanti|pwa\.tutorial\.continueWithoutNotifications/i;
const openAppButtonName = /uygulamaya git|open app|buka aplikasi|pwa\.tutorial\.openApp/i;

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
  if (!normalized) {
    return `seedapp${suffix}`;
  }
  return `${normalized.slice(0, 18)}${suffix}`;
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
  await page.locator('form button[type="submit"]:visible').first().click();
}

async function confirmGenderIfPresent(page) {
  const dialog = page.getByRole('dialog', { name: /cinsiyet onayı|confirm gender/i });
  const isVisible = await dialog.isVisible().catch(() => false);
  if (!isVisible) return;

  await dialog.getByRole('button', { name: /onayla|confirm/i }).click();
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
  await controlAfterLabel(form, /meslek|occupation/i).fill('Ogretmen');
  await controlAfterLabel(form, /medeni durum|marital status/i).selectOption('single');
  await controlAfterLabel(form, /iletişim numarası|contact number|phone/i).fill('+905551112233');

  await form.getByRole('button', { name: /^fotograf$/i }).click();
  await expect(page.getByRole('dialog', { name: /fotograf|photo/i })).toBeVisible();
  await page.locator('#mk-photo1').setInputFiles({
    name: 'e2e-photo.png',
    mimeType: 'image/png',
    buffer: buildTinyPngBuffer(),
  });
  await page.getByRole('button', { name: /tamamla|done|selesai/i }).click();

  const consentCheckboxes = form.locator('input[type="checkbox"]:visible');
  await consentCheckboxes.nth(0).check();
  await consentCheckboxes.nth(1).check();
  await consentCheckboxes.nth(2).check();

  await form.getByRole('button', { name: /bitir|finish|wizard\.finish/i }).click();
}

test('install link drives new user from tutorial to app welcome, signup, apply and pool', async ({ page, baseURL, context }) => {
  test.setTimeout(240000);

  const token = uniqueToken();
  const email = buildRunScopedEmail(process.env.E2E_SIGNUP_EMAIL, token);
  const password = String(process.env.E2E_SIGNUP_PASSWORD || 'Test1234!').trim();
  const username = buildRunScopedUsername(process.env.E2E_SIGNUP_USERNAME, token);
  const origin = String(baseURL || 'http://127.0.0.1:5173').trim();

  console.log(`[e2e] app-install signup email: ${email}`);
  console.log(`[e2e] app-install username: ${username}`);

  await context.grantPermissions(['notifications'], { origin });

  await page.addInitScript(() => {
    window.__uniqahDeferredPrompt = {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    };
  });

  await page.goto('/uygulama', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: installButtonName })).toBeVisible();

  await page.getByRole('button', { name: installButtonName }).click();
  await expect(page.getByRole('button', { name: enableNotificationsButtonName })).toBeVisible({ timeout: 15000 });

  await page.getByRole('button', { name: enableNotificationsButtonName }).click();

  await page.waitForFunction(() => {
    const text = String(document.body?.innerText || '');
    return /Uygulamaya git|Open app|Buka aplikasi|pwa\.tutorial\.openApp|Bildirimi sonra ayarlayıp devam et|Continue and set notifications later|Lanjutkan, notifikasi diatur nanti|pwa\.tutorial\.continueWithoutNotifications/.test(text);
  }, { timeout: 60000 });

  const continueWithoutNotifications = page.getByRole('button', { name: continueWithoutNotificationsButtonName });
  if (await continueWithoutNotifications.isVisible().catch(() => false)) {
    await continueWithoutNotifications.click();
  }

  await page.getByRole('button', { name: openAppButtonName }).click();
  await expect(page).toHaveURL(/\/app\/welcome(\?|$)/, { timeout: 30000 });

  await page.getByRole('button', { name: /e-posta ile kayıt ol|email\/şifre ile kaydol|sign up with email|daftar dengan email|authPage\.emailSignupCta/i }).click();
  await expect(page).toHaveURL(/\/login\?mode=signup/, { timeout: 30000 });

  await signUpWithEmail(page, email, password);
  await completeRequiredApplicationStep(page, username);

  await page.waitForURL(/\/app\/pool(\?|$)/, { timeout: 120000 });
  await expect(page).toHaveURL(/\/app\/pool(\?|$)/);
});