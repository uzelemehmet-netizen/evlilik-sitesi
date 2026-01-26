import { test, expect } from '@playwright/test';

function requiredEnv(name) {
  const v = (process.env[name] || '').trim();
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

test('matchmaking panel loads (seed user)', async ({ page }) => {
  const email = requiredEnv('E2E_EMAIL');
  const password = requiredEnv('E2E_PASSWORD');

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
