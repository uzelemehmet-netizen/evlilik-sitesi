import { test, expect } from 'playwright/test';

test('public legal pages are accessible without login', async ({ page }) => {
  const loginResp = await page.goto('/login');
  expect(loginResp?.ok()).toBeTruthy();

  // Legal links should be visible on the login/signup page (language-agnostic)
  await expect(page.locator('a[href="/privacy"]').first()).toBeVisible();
  await expect(page.locator('a[href="/documents"]').first()).toBeVisible();
  await expect(page.locator('a[href="/docs/kvkk-aydinlatma-metni.html"]').first()).toBeVisible();
  await expect(page.locator('a[href="/docs/site-kurallari.html"]').first()).toBeVisible();

  // SPA legal routes
  const privacyResp = await page.goto('/privacy');
  expect(privacyResp?.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/privacy(\?|$)/);

  const docsHubResp = await page.goto('/documents');
  expect(docsHubResp?.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/documents(\?|$)/);

  // Static documents (open in same tab here)
  const kvkkResp = await page.goto('/docs/kvkk-aydinlatma-metni.html');
  expect(kvkkResp?.ok()).toBeTruthy();
  await expect(page.locator('body')).toBeVisible();

  const rulesResp = await page.goto('/docs/site-kurallari.html');
  expect(rulesResp?.ok()).toBeTruthy();
  await expect(page.locator('body')).toBeVisible();

  const contractResp = await page.goto('/docs/matchmaking-kullanim-sozlesmesi.html');
  expect(contractResp?.ok()).toBeTruthy();
  await expect(page.locator('body')).toBeVisible();
});
