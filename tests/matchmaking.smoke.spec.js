import { test, expect } from 'playwright/test';

async function loginWithEmailPassword(page, email, password) {
  await page.goto(`/login?mode=login&next=${encodeURIComponent('/profilim')}`);

  await page.getByRole('button', {
    name: /masuk dengan email\/kata sandi|email\/şifre ile giriş yap|log in with email|email\/password/i,
  }).click();

  const emailInput = page.locator('input[type="email"]:visible').first();
  const passwordInput = page.locator('input[type="password"]:visible').first();

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.getByRole('button', { name: /masuk|giriş yap|log in/i }).last().click();
}

test('matchmaking matches page loads for authenticated user', async ({ page }) => {
  const email = (process.env.E2E_EMAIL || '').trim();
  const password = (process.env.E2E_PASSWORD || '').trim();
  test.skip(!email || !password, 'E2E_EMAIL/E2E_PASSWORD not set; skipping authenticated matchmaking smoke test.');

  await loginWithEmailPassword(page, email, password);

  await expect(page).toHaveURL(/\/profilim(\?|$)/);
  await page.goto('/app/matches');

  await expect(page).toHaveURL(/\/app\/matches(\?|$)/);
  await expect(page.getByRole('heading', { name: /orang saya|kişilerim|my people|pencocokan saya|eşleşmelerim|my matches/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /notifikasi|bildirimler|notifications|permintaan|istekler|requests/i })).toBeVisible();
  await expect(page.getByText(/bagaimana cara kerja|nasıl çalışır|how it works/i).first()).toBeVisible();
});
