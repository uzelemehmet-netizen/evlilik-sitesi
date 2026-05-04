import { test, expect } from 'playwright/test';
import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

test.use({
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
});

const ADMIN_EMAIL = 'uzelemehmet@gmail.com';
const { auth, db, FieldValue } = getAdmin();

function uniqueToken() {
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

async function ensureAdminUser() {
  try {
    const existing = await auth.getUserByEmail(ADMIN_EMAIL);
    return { uid: String(existing?.uid || '').trim(), created: false };
  } catch (error) {
    if (String(error?.code || '').trim() !== 'auth/user-not-found') throw error;
  }

  const created = await auth.createUser({
    email: ADMIN_EMAIL,
    emailVerified: true,
    displayName: 'Admin Test',
    disabled: false,
  });

  return { uid: String(created?.uid || '').trim(), created: true };
}

async function signInWithCustomToken(page, customToken) {
  await page.goto('/login?lang=tr', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async (tokenValue) => {
    const mod = await import('/tests/browser-auth-helper.js');
    return mod.signInWithCustomTokenForTests(tokenValue);
  }, customToken);
}

async function waitForBrowserUser(page, expectedEmail) {
  await expect.poll(
    async () => {
      return page.evaluate(async () => {
        const { auth } = await import('/src/config/firebaseAuth.js');
        return String(auth.currentUser?.email || '').trim().toLowerCase();
      });
    },
    { timeout: 15000 }
  ).toBe(String(expectedEmail || '').trim().toLowerCase());
}

async function signOutForTests(page) {
  await page.evaluate(async () => {
    const mod = await import('/tests/browser-auth-helper.js');
    await mod.signOutForTests();
  }).catch(() => {});
}

test('admin alerts list excludes review prompt entries', async ({ page }) => {
  test.setTimeout(120000);

  const token = uniqueToken();
  const reviewId = `review_alert_filter_${token}`;
  let createdAdminUid = '';
  let adminWasCreated = false;

  const adminUser = await ensureAdminUser();
  createdAdminUid = adminUser.uid;
  adminWasCreated = adminUser.created;
  const adminCustomToken = await auth.createCustomToken(createdAdminUid);

  await db.collection('matchmakingFeedback').doc(reviewId).set({
    kind: 'review',
    message: '',
    text: '',
    status: 'new',
    userId: `review_user_${token}`,
    userEmail: `review.user.${token}@example.test`,
    step: 'app_review_prompt',
    pagePath: '/app/pool',
    review: {
      rating: 4,
      publicConsent: true,
      publicVisible: false,
      featured: false,
      skipped: false,
      source: 'app_review_prompt_v1',
      openSource: 'pool_banner',
      reviewerName: 'Tes***',
      reviewerDisplayName: 'Test',
      reviewerCity: 'Istanbul',
      reviewerCountry: 'Turkiye',
      reviewerUserCode: 'UC-TEST',
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  try {
    await signInWithCustomToken(page, adminCustomToken);
    await waitForBrowserUser(page, ADMIN_EMAIL);

    const result = await page.evaluate(async ({ id }) => {
      const { authFetch } = await import('/src/utils/authFetch.js');

      const alerts = await authFetch('/api/admin-feedback-list', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'new', includeLowSignal: false, limit: 50 }),
      });

      const reviews = await authFetch('/api/admin-feedback-list', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'review', includeLowSignal: true, limit: 50 }),
      });

      return {
        inAlerts: Array.isArray(alerts?.items) && alerts.items.some((item) => String(item?.id || '').trim() === id),
        inReviews: Array.isArray(reviews?.items) && reviews.items.some((item) => String(item?.id || '').trim() === id),
      };
    }, { id: reviewId });

    expect(result).toEqual({ inAlerts: false, inReviews: true });
  } finally {
    await signOutForTests(page);
    await db.collection('matchmakingFeedback').doc(reviewId).delete().catch(() => {});
    if (adminWasCreated && createdAdminUid) {
      await auth.deleteUser(createdAdminUid).catch(() => {});
    }
  }
});