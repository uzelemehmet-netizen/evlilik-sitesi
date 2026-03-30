import { test, expect } from 'playwright/test';

async function loginWithEmailPassword(page, email, password) {
  await page.goto(`/login?mode=login&next=${encodeURIComponent('/profilim')}`);

  await page.getByRole('button', {
    name: /masuk dengan email\/kata sandi|email\/şifre ile giriş yap|log in with email|email\/password/i,
  }).click();

  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.getByRole('button', { name: /masuk|giriş yap|log in/i }).last().click();
  await expect(page).toHaveURL(/\/profilim(\?|$)/);
}

async function openCorePages(page) {
  await page.goto('/profilim');
  await expect(page).toHaveURL(/\/profilim(\?|$)/);

  await page.goto('/app/matches');
  await expect(page).toHaveURL(/\/app\/matches(\?|$)/);
  await expect(page.getByRole('heading', { name: /pencocokan saya|eşleşmelerim|my matches/i })).toBeVisible();

  await page.goto('/app/pool');
  await expect(page).toHaveURL(/\/app\/pool(\?|$)/);
  await expect(page.getByRole('heading', { name: /jelajahi|havuz|pool|keşfet|discover/i }).first()).toBeVisible();
}

test('two live accounts can sign in and load matchmaking pages', async ({ browser }) => {
  const femaleEmail = String(process.env.E2E_FEMALE_EMAIL || '').trim();
  const femalePassword = String(process.env.E2E_FEMALE_PASSWORD || '').trim();
  const maleEmail = String(process.env.E2E_MALE_EMAIL || '').trim();
  const malePassword = String(process.env.E2E_MALE_PASSWORD || '').trim();

  test.skip(!femaleEmail || !femalePassword || !maleEmail || !malePassword, 'Two-account credentials are required.');

  const femaleContext = await browser.newContext();
  const maleContext = await browser.newContext();
  const femalePage = await femaleContext.newPage();
  const malePage = await maleContext.newPage();

  try {
    await loginWithEmailPassword(femalePage, femaleEmail, femalePassword);
    await loginWithEmailPassword(malePage, maleEmail, malePassword);

    await openCorePages(femalePage);
    await openCorePages(malePage);

    // Give heartbeat/listener effects a short window to persist last-seen state.
    await femalePage.waitForTimeout(1500);
    await malePage.waitForTimeout(1500);
  } finally {
    await femaleContext.close();
    await maleContext.close();
  }
});