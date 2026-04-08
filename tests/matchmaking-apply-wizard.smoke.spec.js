import { test, expect } from 'playwright/test';

const applyPath = '/evlilik/eslestirme-basvuru?w=1';

async function dismissApplyIntroIfPresent(page) {
  for (let index = 0; index < 3; index += 1) {
    const dialog = page.getByRole('dialog').filter({ hasText: /lanjut|devam|next|lewati|skip/i }).last();
    const isVisible = await dialog.isVisible().catch(() => false);
    if (!isVisible) return;

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

async function loginIfConfigured(page) {
  const email = String(process.env.E2E_EMAIL || '').trim();
  const password = String(process.env.E2E_PASSWORD || '').trim();

  if (!email || !password) return false;

  await page.goto(`/login?mode=login&next=${encodeURIComponent(applyPath)}`);

  const emailCta = page.getByRole('button', {
    name: /masuk dengan email\/kata sandi|email\/şifre ile giriş yap|log in with email|email\/password/i,
  });
  await emailCta.click();

  const emailInput = page.locator('input[type="email"]:visible').first();
  const passwordInput = page.locator('input[type="password"]:visible').first();

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.getByRole('button', { name: /masuk|giriş yap|log in/i }).last().click();
  return true;
}

test('matchmaking apply route redirects to login when unauthenticated', async ({ page }) => {
  test.skip(
    Boolean(String(process.env.E2E_EMAIL || '').trim() && String(process.env.E2E_PASSWORD || '').trim()),
    'Auth credentials are configured; authenticated smoke test covers the route instead.',
  );

  await page.goto(applyPath);

  await expect(page).toHaveURL(/\/login(\?|$)/);
  await expect(page.getByRole('heading', { name: /masuk|daftar|giriş|login|sign up/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /google|email|e-posta|kata sandi/i }).first()).toBeVisible();
});

test('matchmaking apply wizard renders step flow for authenticated user', async ({ page }) => {
  test.skip(
    !String(process.env.E2E_EMAIL || '').trim() || !String(process.env.E2E_PASSWORD || '').trim(),
    'E2E_EMAIL/E2E_PASSWORD not set; authenticated wizard smoke test skipped.',
  );

  await loginIfConfigured(page);

  await expect(page).toHaveURL(/\/profilim(\?|$)/);

  await page.getByRole('button', { name: /menu aksi|işlem menüsü|action menu/i }).click();
  await page.getByRole('button', { name: /edit profil|profil|edit profile/i }).click();

  const actionIntroDialog = page.getByRole('dialog');
  if (await actionIntroDialog.isVisible().catch(() => false)) {
    await actionIntroDialog.getByRole('button', {
      name: /saya sudah baca, lanjutkan|okudum, devam et|i have read, continue|i've read, continue/i,
    }).click();
  }

  await expect(page).toHaveURL(/\/evlilik\/eslestirme-basvuru(\?|$)/);
  await dismissApplyIntroIfPresent(page);
  await expect(page.getByRole('heading', { name: /zorunlu bilgiler|informasi wajib|required information/i })).toBeVisible();
  await expect(page.getByText(/adım 1 \/ 3|langkah 1 \/ 3|step 1 \/ 3/i).first()).toBeVisible();
  await expect(page.getByText(/fotoğraflar \(1 zorunlu, en fazla 5\)|foto \(1 wajib, hingga 5\)|photos \(1 required, up to 5\)/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /bitir|selesai|finish/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /devam et|lanjutkan|continue/i })).toBeVisible();

  const fileInputs = page.locator('input[type="file"]');
  await expect(fileInputs.first()).toBeAttached();
  await expect(page.getByText(/zorunlu alanlar tamamlandığında|anda bisa menyelesaikan formulir di sini|required fields are complete/i).first()).toBeVisible();
});