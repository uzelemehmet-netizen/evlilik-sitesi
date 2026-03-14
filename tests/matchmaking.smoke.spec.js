import { test, expect } from 'playwright/test';

test('matchmaking panel loads (seed user)', async ({ page }) => {
  const email = (process.env.E2E_EMAIL || '').trim();
  const password = (process.env.E2E_PASSWORD || '').trim();
  test.skip(!email || !password, 'E2E_EMAIL/E2E_PASSWORD not set; skipping seeded matchmaking smoke test.');

  await page.goto('/login');

  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();

  await expect(page).toHaveURL(/\/profilim(\?|$)/);
  await expect(page.getByTestId('matchmaking-panel')).toBeVisible();

  // Matches list should exist (seed creates at least one proposed match)
  await expect(page.getByTestId('matches-list')).toBeVisible();
  const cards = page.locator('[data-testid^="match-card-"]');
  await expect(cards.first()).toBeVisible();
});
