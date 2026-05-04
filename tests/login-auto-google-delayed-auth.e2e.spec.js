import { test, expect } from 'playwright/test';
import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

test.use({
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
  viewport: { width: 390, height: 844 },
});

const { auth, db } = getAdmin();

function uniqueToken() {
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

test('login auto-google callback with delayed auth lands directly on apply form', async ({ page }) => {
  test.setTimeout(180000);

  const token = uniqueToken();
  const email = `seed.login.autogoogle.${token}@example.test`;
  const createdUser = await auth.createUser({
    email,
    password: 'Test1234!',
    emailVerified: true,
    displayName: 'Login Auto Google Test',
    disabled: false,
  });
  const uid = String(createdUser?.uid || '').trim();
  const customToken = await auth.createCustomToken(uid);

  await db.collection('matchmakingUsers').doc(uid).set(
    {
      email,
      emailVerified: true,
      fullName: 'Login Auto Google Test',
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      profileLang: 'tr',
    },
    { merge: true }
  );

  try {
    await page.addInitScript(({ tokenValue }) => {
      try {
        const search = '?mode=signup&auto=google&lang=tr';
        window.sessionStorage.setItem('auth_intent', 'signup');
        window.sessionStorage.setItem('auth_provider', 'google');
        window.sessionStorage.setItem('uniqah:auto_google_v1', '1');
        window.sessionStorage.setItem(
          'auth_post_auth_nav_v1',
          JSON.stringify({ target: '/evlilik/eslestirme-basvuru?w=1', state: null, atMs: Date.now() })
        );
        window.sessionStorage.setItem(
          'auth_redirect_start_v1',
          JSON.stringify({
            atMs: Date.now(),
            provider: 'google',
            intent: 'signup',
            host: window.location.hostname,
            path: '/login',
            search,
          })
        );
        window.setTimeout(async () => {
          try {
            const mod = await import('/tests/browser-auth-helper.js');
            await mod.signInWithCustomTokenForTests(tokenValue);
          } catch {
            // ignore
          }
        }, 350);
      } catch {
        // ignore
      }
    }, { tokenValue: customToken });

    await page.goto('/login?mode=signup&auto=google&lang=tr', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/evlilik\/eslestirme-basvuru(\?|$)/, { timeout: 30000 });
    await expect(page.locator('form').first()).toBeVisible({ timeout: 30000 });
    await expect(page).not.toHaveURL(/\/login(\?|$)/);
  } finally {
    await page.evaluate(async () => {
      try {
        const mod = await import('/tests/browser-auth-helper.js');
        await mod.signOutForTests();
      } catch {
        // ignore
      }
    }).catch(() => {});

    if (uid) {
      await db.collection('matchmakingUsers').doc(uid).delete().catch(() => {});
      await auth.deleteUser(uid).catch(() => {});
    }
  }
});