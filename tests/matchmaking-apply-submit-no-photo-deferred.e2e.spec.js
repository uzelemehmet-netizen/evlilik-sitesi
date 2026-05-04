import { test, expect } from 'playwright/test';
import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

test.use({
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
});

const genderConfirmDialogName = /cinsiyet onayı|confirm gender/i;
const { auth, db } = getAdmin();

function buildTinyPngBuffer() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnHCq0AAAAASUVORK5CYII=',
    'base64'
  );
}

function uniqueToken() {
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

function buildRunScopedEmail(token) {
  return `seed.apply.nophoto.${token}@example.test`;
}

function buildRunScopedUsername(token) {
  return `applynp${token.slice(-8)}`;
}

async function dismissApplyIntroIfPresent(page) {
  for (let index = 0; index < 3; index += 1) {
    const dialog = page.getByRole('dialog').filter({ hasText: /lanjut|devam|next|lewati|skip/i }).last();
    const visible = await dialog.isVisible().catch(() => false);
    if (!visible) return;

    const continueButton = dialog.getByRole('button', { name: /lanjut|devam|next/i });
    const skipButton = dialog.getByRole('button', { name: /lewati|atla|skip/i });

    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
      continue;
    }

    if (await skipButton.isVisible().catch(() => false)) {
      await skipButton.click();
      return;
    }
    return;
  }
}

async function clickFirstVisible(locator) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click();
      return true;
    }
  }
  return false;
}

async function dismissBlockingDialogs(page) {
  const dialogButtons = page.getByRole('dialog').locator('button');
  for (let index = 0; index < 10; index += 1) {
    if (await clickFirstVisible(dialogButtons.filter({ hasText: /lewati|atla|skip|nanti|later/i }))) continue;
    if (await clickFirstVisible(dialogButtons.filter({ hasText: /konfirmasi|confirm|onayla/i }))) continue;
    if (await clickFirstVisible(dialogButtons.filter({ hasText: /okudum|i have read|continue|lanjut|devam|tamam/i }))) continue;
    return;
  }
}

function controlAfterLabel(scope, labelRegex) {
  return scope
    .locator('label')
    .filter({ hasText: labelRegex })
    .locator('xpath=following-sibling::*[self::input or self::select or self::textarea][1]')
    .first();
}

async function confirmGenderIfPresent(page) {
  const dialog = page.getByRole('dialog', { name: genderConfirmDialogName });
  const visible = await dialog.isVisible().catch(() => false);
  if (!visible) return;
  await dialog.getByRole('button', { name: /konfirmasi|onayla|confirm/i }).dispatchEvent('click');
  await expect.poll(async () => dialog.isVisible().catch(() => false)).toBe(false);
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

async function listRealApplicationsForUid(uid) {
  const snap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(10).get();
  return (snap.docs || []).filter((docSnap) => String(docSnap.data()?.source || '').trim() !== 'auto_stub');
}

async function uploadValidApplyPhoto(page) {
  await page.getByRole('button', { name: /^fotograf$/i }).click();
  await page.locator('#mk-photo1').setInputFiles({
    name: 'valid-photo.png',
    mimeType: 'image/png',
    buffer: buildTinyPngBuffer(),
  });
  await page.getByRole('button', { name: /Tamamla/i }).click();
}

test('TR apply form blocks submit when no photo is selected', async ({ page }) => {
  test.setTimeout(240000);

  const token = uniqueToken();
  const email = buildRunScopedEmail(token);
  const candidateEmail = `seed.pool.candidate.${token}@example.test`;
  const password = 'Test1234!';
  const username = buildRunScopedUsername(token);
  const candidateUsername = `havuzaday${token.slice(-6)}`;
  const deletedCandidateUsername = `silinmisaday${token.slice(-6)}`;
  const inboxMessageId = `inbox_${token}`;
  let uid = '';
  let candidateUid = '';
  let candidateAppId = '';
  const deletedCandidateUid = `deleted_candidate_${token}`;
  const deletedCandidateAppId = `deleted_candidate_app_${token}`;

  const createdUser = await auth.createUser({
    email,
    password,
    emailVerified: true,
    displayName: 'Ayse Demir',
    disabled: false,
  });
  uid = String(createdUser?.uid || '').trim();
  const customToken = await auth.createCustomToken(uid);

  const createdCandidateUser = await auth.createUser({
    email: candidateEmail,
    password,
    emailVerified: true,
    displayName: 'Mehmet Kaya',
    disabled: false,
  });
  candidateUid = String(createdCandidateUser?.uid || '').trim();
  candidateAppId = `pool_candidate_${token}`;

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

  await db.collection('matchmakingUsers').doc(candidateUid).set(
    {
      email: candidateEmail,
      emailVerified: true,
      fullName: 'Mehmet Kaya',
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      profileLang: 'tr',
      username: candidateUsername,
      age: 31,
      city: 'Ankara',
      country: 'Turkiye',
      nationality: 'Turkiye',
      gender: 'male',
      lookingForGender: 'female',
      hasSubmittedProfile: true,
      applicationState: 'real',
    },
    { merge: true }
  );

  await db.collection('matchmakingApplications').doc(candidateAppId).set(
    {
      userId: candidateUid,
      source: 'manual_seed',
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      username: candidateUsername,
      usernameLower: candidateUsername.toLowerCase(),
      fullName: 'Mehmet Kaya',
      age: 31,
      city: 'Ankara',
      country: 'Turkiye',
      nationality: 'Turkiye',
      gender: 'male',
      lookingForGender: 'female',
      whatsapp: '+905551119988',
      details: {
        occupation: 'Mühendis',
        occupationTr: 'Mühendis',
        maritalStatus: 'single',
      },
      about: 'Playwright havuz adayi',
    },
    { merge: true }
  );

  await db.collection('matchmakingApplications').doc(deletedCandidateAppId).set(
    {
      userId: deletedCandidateUid,
      source: 'manual_seed',
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      username: deletedCandidateUsername,
      usernameLower: deletedCandidateUsername.toLowerCase(),
      fullName: 'Deleted Candidate',
      age: 23,
      city: 'Izmir',
      country: 'Turkiye',
      nationality: 'Turkiye',
      gender: 'male',
      lookingForGender: 'female',
      whatsapp: '+905551110000',
      details: {
        occupation: 'Silinmiş',
        occupationTr: 'Silinmiş',
        maritalStatus: 'single',
      },
      about: 'Bu aday silinmis hesabi simule eder.',
    },
    { merge: true }
  );

  await db.collection('matchmakingUsers').doc(uid).collection('inboxMessages').doc(inboxMessageId).set(
    {
      toUid: uid,
      fromUid: 'test-peer',
      text: 'Bu mesaj, deferred photo gate testi icin eklendi.',
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

    await page.goto('/evlilik/eslestirme-basvuru?w=1&lang=tr', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/evlilik\/eslestirme-basvuru(\?|$)/, { timeout: 30000 });

    await dismissApplyIntroIfPresent(page);
    await dismissBlockingDialogs(page);

    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    await controlAfterLabel(form, /nama pengguna|kullanıcı adı|username/i).fill(username);
    await controlAfterLabel(form, /nama lengkap|ad soyad|full name/i).fill('Ayse Demir');
    await controlAfterLabel(form, /usia|yaş|age/i).fill('28');
    await controlAfterLabel(form, /kota|şehir|city/i).fill('Istanbul');
    await controlAfterLabel(form, /kewarganegaraan|uyruğunuz nedir|nationality/i).fill('Turkiye');
    await controlAfterLabel(form, /jenis kelamin|cinsiyet|gender/i).selectOption('female');
    await confirmGenderIfPresent(page);
    await dismissBlockingDialogs(page);
    await controlAfterLabel(form, /pekerjaan|meslek|occupation/i).fill('Ogretmen');
    await controlAfterLabel(form, /status pernikahan|medeni durum|marital status/i).selectOption('single');
    const phoneInput = form.locator('input[placeholder*="+90 5xx xxx xx xx"]').first();
    await phoneInput.fill('+905551112233');

    const consentCheckboxes = form.locator('input[type="checkbox"]:visible');
    await consentCheckboxes.nth(0).check();
    await consentCheckboxes.nth(1).check();
    await consentCheckboxes.nth(2).check();
    await dismissBlockingDialogs(page);

    await form.evaluate((el) => el.requestSubmit());

    await expect(page.getByText(/Lütfen bir fotoğraf yükleyin\./i).first()).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/evlilik\/eslestirme-basvuru(\?|$)/, { timeout: 30000 });

    const realApplications = await listRealApplicationsForUid(uid);
    expect(realApplications).toHaveLength(0);
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

      const batch = db.batch();
      for (const docSnap of applicationsSnap.docs || []) batch.delete(docSnap.ref);
      if (candidateAppId) batch.delete(db.collection('matchmakingApplications').doc(candidateAppId));
      batch.delete(db.collection('matchmakingApplications').doc(deletedCandidateAppId));
      for (const docSnap of matchesSnap.docs || []) {
        batch.set(docSnap.ref, { status: 'deleted_user', updatedAtMs: Date.now() }, { merge: true });
      }
      batch.delete(db.collection('matchmakingUsers').doc(uid));
      if (candidateUid) batch.delete(db.collection('matchmakingUsers').doc(candidateUid));
      await batch.commit();
      await auth.deleteUser(uid).catch(() => {});
      if (candidateUid) await auth.deleteUser(candidateUid).catch(() => {});
    }
  }
});

test('TR user can still submit when selected photo cannot be processed', async ({ page }) => {
  test.setTimeout(240000);

  const token = uniqueToken();
  const email = `seed.apply.badphoto.${token}@example.test`;
  const password = 'Test1234!';
  const username = `applybp${token.slice(-8)}`;
  let uid = '';

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

  try {
    await page.goto('/login?lang=tr', { waitUntil: 'domcontentloaded' });
    await page.evaluate(async (tokenValue) => {
      const mod = await import('/tests/browser-auth-helper.js');
      return mod.signInWithCustomTokenForTests(tokenValue);
    }, customToken);

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

    await page.goto('/evlilik/eslestirme-basvuru?w=1&lang=tr', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/evlilik\/eslestirme-basvuru(\?|$)/, { timeout: 30000 });

    await dismissApplyIntroIfPresent(page);
    await dismissBlockingDialogs(page);

    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    await controlAfterLabel(form, /nama pengguna|kullanıcı adı|username/i).fill(username);
    await controlAfterLabel(form, /nama lengkap|ad soyad|full name/i).fill('Ayse Demir');
    await controlAfterLabel(form, /usia|yaş|age/i).fill('28');
    await controlAfterLabel(form, /kota|şehir|city/i).fill('Istanbul');
    await controlAfterLabel(form, /kewarganegaraan|uyruğunuz nedir|nationality/i).fill('Turkiye');
    await controlAfterLabel(form, /jenis kelamin|cinsiyet|gender/i).selectOption('female');
    await confirmGenderIfPresent(page);
    await dismissBlockingDialogs(page);
    await controlAfterLabel(form, /pekerjaan|meslek|occupation/i).fill('Ogretmen');
    await controlAfterLabel(form, /status pernikahan|medeni durum|marital status/i).selectOption('single');
    await form.locator('input[placeholder*="+90 5xx xxx xx xx"]').first().fill('+905551112233');

    await form.getByRole('button', { name: /^Fotograf$/i }).click();
    await page.locator('#mk-photo1').setInputFiles({
      name: 'broken-photo.png',
      mimeType: 'image/png',
      buffer: Buffer.from('not-a-real-image-file', 'utf8'),
    });
    await page.getByRole('button', { name: /Tamamla/i }).click();

    const consentCheckboxes = form.locator('input[type="checkbox"]:visible');
    await consentCheckboxes.nth(0).check();
    await consentCheckboxes.nth(1).check();
    await consentCheckboxes.nth(2).check();
    await dismissBlockingDialogs(page);

    const submitResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/matchmaking-application-submit') && response.request().method() === 'POST',
      { timeout: 120000 }
    );

    await form.evaluate((el) => el.requestSubmit());

    const submitResponse = await submitResponsePromise;
    const submitJson = await submitResponse.json();
    expect(submitResponse.status()).toBe(200);
    expect(submitJson?.ok).toBe(true);

    await page.waitForURL(/\/profilim(\?|$)/, { timeout: 120000 });
    const photoManagerDialog = page.getByRole('dialog', { name: /Fotoğraflar/i });
    await expect(photoManagerDialog).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/Başvurunuz kaydedildi, ancak fotoğraflar yüklenemedi/i).first()).toBeVisible({ timeout: 30000 });

    await expect.poll(async () => {
      const realApplications = await listRealApplicationsForUid(uid);
      if (!realApplications.length) return -1;
      return Array.isArray(realApplications[0].data()?.photoUrls) ? realApplications[0].data().photoUrls.length : 0;
    }, { timeout: 120000 }).toBe(0);
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

      const batch = db.batch();
      for (const docSnap of applicationsSnap.docs || []) batch.delete(docSnap.ref);
      for (const docSnap of matchesSnap.docs || []) {
        batch.set(docSnap.ref, { status: 'deleted_user', updatedAtMs: Date.now() }, { merge: true });
      }
      batch.delete(db.collection('matchmakingUsers').doc(uid));
      await batch.commit();
      await auth.deleteUser(uid).catch(() => {});
    }
  }
});

test('TR user can interact after successful apply and photo restriction does not continue', async ({ page }) => {
  test.setTimeout(240000);

  const token = uniqueToken();
  const email = `seed.apply.withphoto.${token}@example.test`;
  const candidateEmail = `seed.pool.afterapply.${token}@example.test`;
  const password = 'Test1234!';
  const username = `applyok${token.slice(-8)}`;
  const candidateUsername = `havuzsonra${token.slice(-6)}`;
  const candidateAppId = `pool_after_apply_${token}`;
  const inboxMessageId = `inbox_after_apply_${token}`;
  let uid = '';
  let candidateUid = '';

  const createdUser = await auth.createUser({
    email,
    password,
    emailVerified: true,
    displayName: 'Ayse Demir',
    disabled: false,
  });
  uid = String(createdUser?.uid || '').trim();
  const customToken = await auth.createCustomToken(uid);

  const createdCandidateUser = await auth.createUser({
    email: candidateEmail,
    password,
    emailVerified: true,
    displayName: 'Mehmet Kaya',
    disabled: false,
  });
  candidateUid = String(createdCandidateUser?.uid || '').trim();

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

  await db.collection('matchmakingUsers').doc(candidateUid).set(
    {
      email: candidateEmail,
      emailVerified: true,
      fullName: 'Mehmet Kaya',
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      profileLang: 'tr',
      username: candidateUsername,
      age: 31,
      city: 'Ankara',
      country: 'Turkiye',
      nationality: 'Turkiye',
      gender: 'male',
      lookingForGender: 'female',
      hasSubmittedProfile: true,
      applicationState: 'real',
    },
    { merge: true }
  );

  await db.collection('matchmakingApplications').doc(candidateAppId).set(
    {
      userId: candidateUid,
      source: 'manual_seed',
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      username: candidateUsername,
      usernameLower: candidateUsername.toLowerCase(),
      fullName: 'Mehmet Kaya',
      age: 31,
      city: 'Ankara',
      country: 'Turkiye',
      nationality: 'Turkiye',
      gender: 'male',
      lookingForGender: 'female',
      whatsapp: '+905551119988',
      photoUrls: ['/placeholder-logo.svg'],
      details: {
        occupation: 'Muhendis',
        occupationTr: 'Muhendis',
        maritalStatus: 'single',
      },
      about: 'Playwright havuz adayi',
    },
    { merge: true }
  );

  await db.collection('matchmakingUsers').doc(uid).collection('inboxMessages').doc(inboxMessageId).set(
    {
      toUid: uid,
      fromUid: 'test-peer',
      text: 'Bu mesaj, apply sonrasi etkileşim testi icin eklendi.',
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

    await page.goto('/evlilik/eslestirme-basvuru?w=1&lang=tr', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/evlilik\/eslestirme-basvuru(\?|$)/, { timeout: 30000 });

    await dismissApplyIntroIfPresent(page);
    await dismissBlockingDialogs(page);

    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    await controlAfterLabel(form, /nama pengguna|kullanıcı adı|username/i).fill(username);
    await controlAfterLabel(form, /nama lengkap|ad soyad|full name/i).fill('Ayse Demir');
    await controlAfterLabel(form, /usia|yaş|age/i).fill('28');
    await controlAfterLabel(form, /kota|şehir|city/i).fill('Istanbul');
    await controlAfterLabel(form, /kewarganegaraan|uyruğunuz nedir|nationality/i).fill('Turkiye');
    await controlAfterLabel(form, /jenis kelamin|cinsiyet|gender/i).selectOption('female');
    await confirmGenderIfPresent(page);
    await dismissBlockingDialogs(page);
    await controlAfterLabel(form, /pekerjaan|meslek|occupation/i).fill('Ogretmen');
    await controlAfterLabel(form, /status pernikahan|medeni durum|marital status/i).selectOption('single');
    await form.locator('input[placeholder*="+90 5xx xxx xx xx"]').first().fill('+905551112233');

    await uploadValidApplyPhoto(page);

    const consentCheckboxes = form.locator('input[type="checkbox"]:visible');
    await consentCheckboxes.nth(0).check();
    await consentCheckboxes.nth(1).check();
    await consentCheckboxes.nth(2).check();
    await dismissBlockingDialogs(page);

    const submitResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/matchmaking-application-submit') && response.request().method() === 'POST',
      { timeout: 120000 }
    );

    await form.evaluate((el) => el.requestSubmit());

    const submitResponse = await submitResponsePromise;
    const submitJson = await submitResponse.json();
    expect(submitResponse.status()).toBe(200);
    expect(submitJson?.ok).toBe(true);

    await expect.poll(async () => {
      const realApplications = await listRealApplicationsForUid(uid);
      if (!realApplications.length) return 0;
      return Array.isArray(realApplications[0].data()?.photoUrls) ? realApplications[0].data().photoUrls.length : 0;
    }, { timeout: 120000 }).toBeGreaterThan(0);

    await page.goto('/app/pool', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/app\/pool(\?|$)/, { timeout: 30000 });
    await expect(page.getByText(candidateUsername).first()).toBeVisible({ timeout: 30000 });

    await page.goto('/app/messages', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/app\/messages(\?|$)/, { timeout: 30000 });
    const markReadResult = await authPostResult(page, '/api/matchmaking-inbox-message-mark-read', { messageId: inboxMessageId });
    expect(markReadResult.ok).toBe(true);
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

      const batch = db.batch();
      for (const docSnap of applicationsSnap.docs || []) batch.delete(docSnap.ref);
      if (candidateAppId) batch.delete(db.collection('matchmakingApplications').doc(candidateAppId));
      for (const docSnap of matchesSnap.docs || []) {
        batch.set(docSnap.ref, { status: 'deleted_user', updatedAtMs: Date.now() }, { merge: true });
      }
      batch.delete(db.collection('matchmakingUsers').doc(uid));
      if (candidateUid) batch.delete(db.collection('matchmakingUsers').doc(candidateUid));
      await batch.commit();
      await auth.deleteUser(uid).catch(() => {});
      if (candidateUid) await auth.deleteUser(candidateUid).catch(() => {});
    }
  }
});