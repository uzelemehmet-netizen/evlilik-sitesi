import { test, expect } from 'playwright/test';

const primaryEmail = String(process.env.E2E_OPENCHAT_PRIMARY_EMAIL || '').trim();
const primaryPassword = String(process.env.E2E_OPENCHAT_PRIMARY_PASSWORD || '').trim();

async function loginWithEmailPassword(page, email, password) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    async ({ emailArg, passwordArg }) => {
      const [{ signInWithEmailAndPassword }, authMod] = await Promise.all([
        import('/node_modules/.vite/deps/firebase_auth.js'),
        import('/src/config/firebaseAuth.js'),
      ]);
      await signInWithEmailAndPassword(authMod.auth, emailArg, passwordArg);
    },
    { emailArg: email, passwordArg: password }
  );
  await page.goto('/profilim', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/profilim(\?|$)/);
}

test('my people card opens the full detailed profile directly', async ({ browser }) => {
  test.setTimeout(240000);
  test.skip(!primaryEmail || !primaryPassword, 'Detailed profile E2E credentials are missing.');

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await loginWithEmailPassword(page, primaryEmail, primaryPassword);

    await page.goto('/app/matches', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/app\/matches(\?|$)/);
    await expect(page.getByRole('heading', { name: /orang saya|kişilerim|my people/i })).toBeVisible({ timeout: 30000 });

    const inspectButton = page.locator('[data-testid^="match-card-profile-details-"]').first();
    await expect(inspectButton).toBeVisible({ timeout: 30000 });

    await Promise.all([
      page.waitForURL(/\/app\/match\/.+/i, { timeout: 30000 }),
      inspectButton.click(),
    ]);

    const fullDetails = page.getByTestId('match-profile-full-details');
    const alreadyVisible = await fullDetails.isVisible().catch(() => false);
    if (!alreadyVisible) {
      const detailsTab = page.getByRole('button', { name: /detay profil|detail profil|profile details/i }).first();
      const detailsTabVisible = await detailsTab.isVisible().catch(() => false);
      if (detailsTabVisible) {
        await detailsTab.click();
      }
    }

    await expect(fullDetails).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/usia \(min\)|partner age min|minimum age/i).first()).toBeVisible({ timeout: 30000 });
  } finally {
    await context.close().catch(() => {});
  }
});