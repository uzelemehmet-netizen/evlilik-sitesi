import { test, expect } from 'playwright/test';

const poolPath = '/app/pool';

async function login(page, nextPath = poolPath) {
  const email = String(process.env.E2E_EMAIL || '').trim();
  const password = String(process.env.E2E_PASSWORD || '').trim();

  await page.goto(`/login?mode=login&next=${encodeURIComponent(nextPath)}`);

  const emailCta = page.getByRole('button', {
    name: /masuk dengan email\/kata sandi|email\/şifre ile giriş yap|log in with email|email\/password/i,
  });
  await emailCta.click();

  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.getByRole('button', { name: /masuk|giriş yap|log in/i }).last().click();
}

async function goToPoolAfterLogin(page) {
  await login(page);

  await expect(page).toHaveURL(/\/(profilim|app\/pool)(\?|$)/);
  if (/\/app\/pool(\?|$)/.test(page.url())) return;

  await page.goto(poolPath);
  await expect(page).toHaveURL(/\/app\/pool(\?|$)/);
}

test('optional details recommendation in pool is dismissible and can continue browsing', async ({ page }) => {
  test.skip(
    !String(process.env.E2E_EMAIL || '').trim() || !String(process.env.E2E_PASSWORD || '').trim(),
    'E2E_EMAIL/E2E_PASSWORD not set; optional-details pool smoke test skipped.',
  );

  await goToPoolAfterLogin(page);
  await expect(page.getByRole('heading', { name: /eş adayları|explore|jelajah/i })).toBeVisible();

  const recommendation = page.getByRole('status').filter({
    hasText: /kalan detayları istersen tamamlayabilirsin|you can finish the remaining details later|detail sisanya bisa anda lengkapi nanti/i,
  });
  const visible = await recommendation.isVisible().catch(() => false);

  test.skip(!visible, 'Optional details recommendation is not shown for this account state.');

  const laterButton = recommendation.getByRole('button', { name: /sonra|later|nanti/i }).first();
  await expect(laterButton).toBeVisible();
  await laterButton.click();
  await expect(recommendation).toBeHidden();
  await expect(page.getByRole('heading', { name: /eş adayları|explore|jelajah/i })).toBeVisible();
});

test('optional details recommendation can send user to wizard details step', async ({ page }) => {
  test.skip(
    !String(process.env.E2E_EMAIL || '').trim() || !String(process.env.E2E_PASSWORD || '').trim(),
    'E2E_EMAIL/E2E_PASSWORD not set; optional-details pool smoke test skipped.',
  );

  await goToPoolAfterLogin(page);

  const recommendation = page.getByRole('status').filter({
    hasText: /kalan detayları istersen tamamlayabilirsin|you can finish the remaining details later|detail sisanya bisa anda lengkapi nanti/i,
  });
  const visible = await recommendation.isVisible().catch(() => false);

  test.skip(!visible, 'Optional details recommendation is not shown for this account state.');

  const okButton = recommendation.getByRole('button', { name: /^ok$|^tamam$/i }).first();
  await expect(okButton).toBeVisible();
  await okButton.click();

  await expect(page).toHaveURL(/\/evlilik\/eslestirme-basvuru(\?|$)/);
  await expect(page.getByText(/adım 2 \/ 3|langkah 2 \/ 3|step 2 \/ 3/i).first()).toBeVisible();
});