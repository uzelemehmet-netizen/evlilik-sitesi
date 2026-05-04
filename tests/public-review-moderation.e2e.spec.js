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
  await page
    .evaluate(async () => {
      const mod = await import('/tests/browser-auth-helper.js');
      await mod.signOutForTests();
    })
    .catch(() => {});
}

test('admin can publish and later unpublish a review from the public welcome page', async ({ page }) => {
  test.setTimeout(180000);

  const token = uniqueToken();
  const reviewId = `review_moderation_${token}`;
  const reviewMessage = `Public review moderation e2e ${token}`;
  let createdAdminUid = '';
  let adminWasCreated = false;

  const adminUser = await ensureAdminUser();
  createdAdminUid = adminUser.uid;
  adminWasCreated = adminUser.created;
  const adminCustomToken = await auth.createCustomToken(createdAdminUid);

  await db.collection('matchmakingFeedback').doc(reviewId).set({
    kind: 'review',
    message: reviewMessage,
    text: reviewMessage,
    status: 'new',
    userId: `review_user_${token}`,
    userEmail: `review.user.${token}@example.test`,
    review: {
      rating: 5,
      publicConsent: true,
      publicVisible: false,
      featured: false,
      source: 'seed_public_review_test',
      reviewerName: 'Ays***',
      reviewerCity: 'Istanbul',
      reviewerCountry: 'Turkiye',
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  try {
    await signInWithCustomToken(page, adminCustomToken);
    await waitForBrowserUser(page, ADMIN_EMAIL);

    const moderationResult = await page.evaluate(
      async ({ id, message }) => {
        const { authFetch } = await import('/src/utils/authFetch.js');

        const listed = await authFetch('/api/admin-feedback-list', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ kind: 'review', q: id, includeLowSignal: true, limit: 10 }),
        });

        const alertsListed = await authFetch('/api/admin-feedback-list', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ q: id, status: 'new', includeLowSignal: false, limit: 10 }),
        });

        await authFetch('/api/admin-feedback-update', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id, publicVisible: true }),
        });

        await authFetch('/api/admin-feedback-update', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id, featured: true }),
        });

        return {
          listed: Array.isArray(listed?.items) && listed.items.some((item) => String(item?.id || '').trim() === id && String(item?.message || '').trim() === message),
          hiddenFromAlerts: !(Array.isArray(alertsListed?.items) && alertsListed.items.some((item) => String(item?.id || '').trim() === id)),
        };
      },
      { id: reviewId, message: reviewMessage }
    );

    expect(moderationResult).toEqual({ listed: true, hiddenFromAlerts: true });

    await expect.poll(async () => {
      const snap = await db.collection('matchmakingFeedback').doc(reviewId).get();
      return snap.data()?.review?.publicVisible === true;
    }, { timeout: 15000 }).toBe(true);

    await expect.poll(async () => {
      const snap = await db.collection('matchmakingFeedback').doc(reviewId).get();
      return snap.data()?.review?.featured === true;
    }, { timeout: 15000 }).toBe(true);

    await signOutForTests(page);

    await page.goto('/app/welcome?lang=tr', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Kullanıcı yorumları')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(reviewMessage)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Ays***')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Öne çıkan')).toBeVisible({ timeout: 15000 });

    await signInWithCustomToken(page, adminCustomToken);
    await waitForBrowserUser(page, ADMIN_EMAIL);

    await page.evaluate(
      async ({ id }) => {
        const { authFetch } = await import('/src/utils/authFetch.js');
        await authFetch('/api/admin-feedback-update', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id, publicVisible: false }),
        });
      },
      { id: reviewId }
    );

    await expect.poll(async () => {
      const snap = await db.collection('matchmakingFeedback').doc(reviewId).get();
      return snap.data()?.review?.publicVisible === false;
    }, { timeout: 15000 }).toBe(true);

    await signOutForTests(page);

    await page.goto('/app/welcome?lang=tr', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(reviewMessage)).toHaveCount(0);
  } finally {
    await signOutForTests(page);
    await db.collection('matchmakingFeedback').doc(reviewId).delete().catch(() => {});
    if (adminWasCreated && createdAdminUid) {
      await auth.deleteUser(createdAdminUid).catch(() => {});
    }
  }
});