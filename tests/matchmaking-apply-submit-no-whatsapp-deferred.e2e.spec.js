import { test, expect } from 'playwright/test';
import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

test.use({
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
});

const { auth, db } = getAdmin();

function uniqueToken() {
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

function buildRunScopedEmail(token) {
  return `seed.apply.nowhatsapp.${token}@example.test`;
}

function buildRunScopedUsername(token) {
  return `applynw${token.slice(-8)}`;
}

async function authPostResult(page, endpoint, payload) {
  return page.evaluate(
    async ({ endpointArg, payloadArg }) => {
      try {
        const { authFetch } = await import('/src/utils/authFetch.js');
        const data = await authFetch(endpointArg, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payloadArg || {}),
        });
        return { ok: true, data: data || null, error: '' };
      } catch (error) {
        return { ok: false, data: null, error: String(error?.message || '').trim() || 'unknown_error' };
      }
    },
    { endpointArg: endpoint, payloadArg: payload }
  );
}

async function waitForSignedInUser(page, expectedUid) {
  await expect
    .poll(async () => {
      return page.evaluate(async () => {
        const { auth } = await import('/src/config/firebaseAuth.js');
        return String(auth.currentUser?.uid || '').trim();
      });
    }, { timeout: 30000 })
    .toBe(String(expectedUid || '').trim());
}

test('TR user can submit without whatsapp and messaging remains unlocked even if old deferred fields are present', async ({ page }) => {
  test.setTimeout(240000);

  const token = uniqueToken();
  const email = buildRunScopedEmail(token);
  const password = 'Test1234!';
  const username = buildRunScopedUsername(token);
  const inboxMessageId = `inbox_${token}`;
  let uid = '';
  let applicationId = '';

  const createdUser = await auth.createUser({
    email,
    password,
    emailVerified: true,
    displayName: 'Ayse Demir',
    disabled: false,
  });
  uid = String(createdUser?.uid || '').trim();
  const customToken = await auth.createCustomToken(uid);

  await db.collection('matchmakingUsers').doc(uid).set(
    {
      email,
      emailVerified: true,
      fullName: 'Ayse Demir',
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      profileLang: 'tr',
    },
    { merge: true }
  );

  await db.collection('matchmakingUsers').doc(uid).collection('inboxMessages').doc(inboxMessageId).set(
    {
      toUid: uid,
      fromUid: 'test-peer',
      text: 'Bu mesaj whatsapp zorunlulugu olmadan okunabilir olmali.',
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
    },
    { merge: true }
  );

  try {
    await page.goto('/login?lang=tr', { waitUntil: 'domcontentloaded' });
    await page.evaluate(async (tokenValue) => {
      const mod = await import('/tests/browser-auth-helper.js');
      return mod.signInWithCustomTokenForTests(tokenValue);
    }, customToken);
    await waitForSignedInUser(page, uid);

    await page.addInitScript((tourUid) => {
      try {
        window.localStorage.setItem('uniqah:tour:publicSeen:public-guidance-wedding', '1');
        window.sessionStorage.setItem('uniqah:tour:publicSeen:public-guidance-wedding', '1');
        const entryId = 'e2e';
        window.localStorage.setItem(`uniqah:pwa-nudge:suppressed:${tourUid}`, '1');
        window.sessionStorage.setItem('uniqah:pwa-nudge:entry:uid', String(tourUid));
        window.sessionStorage.setItem('uniqah:pwa-nudge:entry:id', entryId);
        window.sessionStorage.setItem(`uniqah:tour:pwa-install-nudge:${tourUid}:${entryId}:shown`, '1');
      } catch {
        // ignore
      }
    }, uid);

    const submitPayload = {
      profileNo: 900000 + Math.floor(Math.random() * 1000),
      profileCode: `MK-T-${token.slice(-6)}`,
      username,
      usernameLower: username,
      fullName: 'Ayse Demir',
      age: 28,
      city: 'Istanbul',
      country: 'Turkiye',
      nationality: 'tr',
      gender: 'female',
      lookingForNationality: 'id',
      lookingForGender: 'male',
      details: {
        occupation: 'Ogretmen',
        maritalStatus: 'single',
      },
      photoUrls: ['https://example.com/deferred-whatsapp-photo.jpg'],
      lang: 'tr',
      source: 'site',
    };

    const submitResult = await authPostResult(page, '/api/matchmaking-application-submit', {
      docId: username,
      payload: submitPayload,
    });
    expect(submitResult.ok).toBe(true);
    applicationId = String(submitResult.data?.applicationId || '').trim() || username;

    const savedApp = await db.collection('matchmakingApplications').doc(applicationId).get();
    const savedUser = await db.collection('matchmakingUsers').doc(uid).get();
    expect(savedApp.exists).toBe(true);
    expect(savedUser.exists).toBe(true);
    expect(Number(savedApp.data()?.deferredWhatsappRequiredAfterMs || 0)).toBe(0);
    expect(Number(savedUser.data()?.deferredWhatsappRequiredAfterMs || 0)).toBe(0);
    expect(Number(savedUser.data()?.application?.deferredWhatsappRequiredAfterMs || 0)).toBe(0);
    expect(Number(savedUser.data()?.publicProfile?.deferredWhatsappRequiredAfterMs || 0)).toBe(0);
    expect(String(savedApp.data()?.whatsapp || '').trim()).toBe('');
    expect(String(savedUser.data()?.whatsapp || '').trim()).toBe('');

    const initialMarkRead = await authPostResult(page, '/api/matchmaking-inbox-message-mark-read', { messageId: inboxMessageId });
    expect(initialMarkRead.ok).toBe(true);

    await db.collection('matchmakingApplications').doc(applicationId).set(
      { deferredWhatsappRequiredAfterMs: Date.now() - 60_000, updatedAtMs: Date.now() },
      { merge: true }
    );
    await db.collection('matchmakingUsers').doc(uid).set(
      {
        deferredWhatsappRequiredAfterMs: Date.now() - 60_000,
        application: { deferredWhatsappRequiredAfterMs: Date.now() - 60_000 },
        publicProfile: { deferredWhatsappRequiredAfterMs: Date.now() - 60_000 },
        updatedAtMs: Date.now(),
      },
      { merge: true }
    );

    await page.goto('/profilim', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/profilim(\?|$)/, { timeout: 30000 });
    await expect(page.getByText(/WhatsApp numaranı sisteme kaydetmen gerekiyor/i)).toHaveCount(0);

    const markReadWithLegacyFields = await authPostResult(page, '/api/matchmaking-inbox-message-mark-read', { messageId: inboxMessageId });
    expect(markReadWithLegacyFields.ok).toBe(true);
  } finally {
    await page.evaluate(async () => {
      const mod = await import('/tests/browser-auth-helper.js');
      await mod.signOutForTests();
    }).catch(() => {});

    if (uid) {
      const [applicationsSnap, matchesSnap] = await Promise.all([
        db.collection('matchmakingApplications').where('userId', '==', uid).limit(25).get(),
        db.collection('matchmakingMatches').where('userIds', 'array-contains', uid).limit(25).get().catch(() => ({ docs: [] })),
      ]);

      const cleanupBatch = db.batch();
      for (const docSnap of applicationsSnap.docs || []) cleanupBatch.delete(docSnap.ref);
      for (const docSnap of matchesSnap.docs || []) {
        cleanupBatch.set(docSnap.ref, { status: 'deleted_user', updatedAtMs: Date.now() }, { merge: true });
      }
      cleanupBatch.delete(db.collection('matchmakingUsers').doc(uid));
      await cleanupBatch.commit();
      await auth.deleteUser(uid).catch(() => {});
    }
  }
});