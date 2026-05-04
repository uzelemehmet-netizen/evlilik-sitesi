import { test, expect } from 'playwright/test';
import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

test.use({
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
  viewport: { width: 390, height: 844 },
});

const { auth, db, FieldValue } = getAdmin();

function uniqueToken() {
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

function buildEmail(token) {
  return `seed.appwelcome.${token}@example.test`;
}

test('app welcome signup marker routes authenticated user to apply form', async ({ page }) => {
  test.setTimeout(180000);

  const token = uniqueToken();
  const email = buildEmail(token);
  const createdUser = await auth.createUser({
    email,
    password: 'Test1234!',
    emailVerified: true,
    displayName: 'App Welcome Test',
    disabled: false,
  });
  const uid = String(createdUser?.uid || '').trim();
  const customToken = await auth.createCustomToken(uid);

  await db.collection('matchmakingUsers').doc(uid).set(
    {
      email,
      emailVerified: true,
      fullName: 'App Welcome Test',
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      profileLang: 'tr',
    },
    { merge: true }
  );

  try {
    await page.goto('/app/welcome', { waitUntil: 'domcontentloaded' });

    await page.evaluate(() => {
      sessionStorage.setItem('app_welcome_google_signup_v1', '1');
      sessionStorage.setItem(
        'auth_post_auth_nav_v1',
        JSON.stringify({ target: '/evlilik/eslestirme-basvuru?w=1', state: null, atMs: Date.now() })
      );
    });

    await page.evaluate(async (tokenValue) => {
      const mod = await import('/tests/browser-auth-helper.js');
      return mod.signInWithCustomTokenForTests(tokenValue);
    }, customToken);

    await page.waitForURL(/\/evlilik\/eslestirme-basvuru(\?|$)/, { timeout: 30000 });
    await expect(page.locator('form').first()).toBeVisible({ timeout: 30000 });
  } finally {
    await page.evaluate(async () => {
      const mod = await import('/tests/browser-auth-helper.js');
      await mod.signOutForTests();
    }).catch(() => {});

    if (uid) {
      await db.collection('matchmakingUsers').doc(uid).set(
        {
          hiddenAt: FieldValue.serverTimestamp(),
          hiddenAtMs: Date.now(),
          hiddenReason: 'e2e_cleanup',
          isSyntheticTestUser: true,
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: Date.now(),
        },
        { merge: true }
      ).catch(() => {});
      await auth.deleteUser(uid).catch(() => {});
    }
  }
});