import { test, expect } from 'playwright/test';
import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

const { auth, db } = getAdmin();

function uniqueToken() {
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

function buildMatchId(aUid, bUid) {
  return [String(aUid || '').trim(), String(bUid || '').trim()].filter(Boolean).sort().join('__');
}

async function signInWithEmailPassword(page, email, password, expectedUid) {
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
  await expect
    .poll(async () => page.evaluate(async () => {
      const authMod = await import('/src/config/firebaseAuth.js');
      return String(authMod.auth?.currentUser?.uid || '').trim();
    }), { timeout: 30000 })
    .toBe(String(expectedUid || '').trim());
  await page.goto('/profilim', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/profilim(\?|$)/, { timeout: 30000 });
}

async function signOut(page) {
  await page.evaluate(async () => {
    const mod = await import('/tests/browser-auth-helper.js');
    await mod.signOutForTests();
  }).catch(() => {});
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

async function openChat(page, matchId) {
  await page.goto(`/app/chat/${matchId}`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(new RegExp(`/app/chat/${matchId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\?|$)`), { timeout: 30000 });
  const input = page.locator('[data-tutorial-id="chat-input"]');
  await expect(input).toBeVisible({ timeout: 30000 });
  return input;
}

async function sendChatMessage(page, matchId, text) {
  const result = await authPostResult(page, '/api/matchmaking-chat-send', { matchId, text });
  expect(result.ok, result.error || 'matchmaking-chat-send failed').toBe(true);
}

async function sendChatMessageFromUi(page, matchId, text) {
  const input = await openChat(page, matchId);
  await input.fill(String(text || ''));

  const sendButton = page.locator('[data-tutorial-id="chat-send"]');
  await expect(sendButton).toBeEnabled({ timeout: 30000 });
  await sendButton.click();

  await expect(page.getByText(String(text || '')).first()).toBeVisible({ timeout: 30000 });
}

async function createUserWithProfile({ email, fullName, username, gender, lookingForGender, age, city }) {
  const password = 'Test1234!';
  const createdUser = await auth.createUser({
    email,
    password,
    emailVerified: true,
    displayName: fullName,
    disabled: false,
  });

  const uid = String(createdUser?.uid || '').trim();
  const appId = `app_${uid}`;
  const now = Date.now();
  const photoUrl = `https://example.test/${uid}.jpg`;

  const applicationCache = {
    username,
    usernameLower: username.toLowerCase(),
    fullName,
    age,
    city,
    country: 'Turkiye',
    nationality: 'Turkiye',
    gender,
    lookingForGender,
    whatsapp: '+905550001122',
    photoUrls: [photoUrl],
    details: {
      occupation: 'Ogretmen',
      occupationTr: 'Ogretmen',
      maritalStatus: 'single',
    },
    about: `${fullName} test profili`,
  };

  await db.collection('matchmakingUsers').doc(uid).set(
    {
      email,
      authEmail: email,
      authEmailLower: email.toLowerCase(),
      emailLower: email.toLowerCase(),
      emailVerified: true,
      fullName,
      username,
      usernameLower: username.toLowerCase(),
      age,
      city,
      country: 'Turkiye',
      nationality: 'Turkiye',
      gender,
      lookingForGender,
      hasSubmittedProfile: true,
      applicationState: 'real',
      applicationId: appId,
      createdAtMs: now,
      updatedAtMs: now,
      application: applicationCache,
      details: {
        about: `${fullName} test profili`,
      },
    },
    { merge: true }
  );

  await db.collection('matchmakingApplications').doc(appId).set(
    {
      id: appId,
      userId: uid,
      source: 'manual_seed',
      createdAtMs: now,
      updatedAtMs: now,
      ...applicationCache,
    },
    { merge: true }
  );

  return { uid, appId, password, email };
}

async function createMatch({ aUid, aAppId, bUid, bAppId, createdAtMs }) {
  const matchId = buildMatchId(aUid, bUid);
  const now = createdAtMs || Date.now();
  await db.collection('matchmakingMatches').doc(matchId).set(
    {
      userIds: [aUid, bUid].sort(),
      aUserId: aUid,
      bUserId: bUid,
      aApplicationId: aAppId,
      bApplicationId: bAppId,
      status: 'mutual_accepted',
      interactionMode: 'chat',
      chatEnabledAtMs: now,
      createdAtMs: now,
      updatedAtMs: now,
      chatUnreadByUid: {
        [aUid]: 0,
        [bUid]: 0,
      },
    },
    { merge: true }
  );
  return matchId;
}

async function seedLegacyNumericFragments({ matchId, uid, fragments }) {
  const list = Array.isArray(fragments) ? fragments : [];
  for (let index = 0; index < list.length; index += 1) {
    const text = String(list[index] || '').trim();
    if (!text) continue;
    const createdAtMs = Date.now() - (list.length - index) * 60000;
    await db.collection('matchmakingMatches').doc(matchId).collection('messages').add({
      matchId,
      userId: uid,
      text,
      createdAtMs,
    });
  }
}

async function cleanupUsersAndMatches({ uids, appIds, matchIds }) {
  const safeUids = Array.from(new Set((uids || []).filter(Boolean)));
  const safeAppIds = Array.from(new Set((appIds || []).filter(Boolean)));
  const safeMatchIds = Array.from(new Set((matchIds || []).filter(Boolean)));

  for (const matchId of safeMatchIds) {
    const messagesSnap = await db.collection('matchmakingMatches').doc(matchId).collection('messages').get().catch(() => ({ docs: [] }));
    if (messagesSnap?.docs?.length) {
      const batch = db.batch();
      for (const docSnap of messagesSnap.docs) batch.delete(docSnap.ref);
      await batch.commit();
    }
    await db.collection('matchmakingMatches').doc(matchId).delete().catch(() => {});
  }

  if (safeAppIds.length || safeUids.length) {
    const batch = db.batch();
    for (const appId of safeAppIds) batch.delete(db.collection('matchmakingApplications').doc(appId));
    for (const uid of safeUids) batch.delete(db.collection('matchmakingUsers').doc(uid));
    await batch.commit().catch(() => {});
  }

  for (const uid of safeUids) {
    await auth.deleteUser(uid).catch(() => {});
  }
}

async function waitForStoredMessage({ matchId, userId, text }) {
  await expect
    .poll(async () => {
      const snap = await db.collection('matchmakingMatches').doc(matchId).collection('messages').get();
      return (snap.docs || []).some((docSnap) => {
        const data = docSnap.data() || {};
        return String(data?.userId || '').trim() === String(userId || '').trim() && String(data?.text || '').trim() === String(text || '').trim();
      });
    }, { timeout: 30000 })
    .toBe(true);
}

async function createSignedInPage(browser, user) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signInWithEmailPassword(page, user.email, user.password, user.uid);
  return { context, page };
}

async function closeSignedInPage(page, context) {
  await signOut(page);
  await context.close().catch(() => {});
}

test('clean users can send and read chat messages normally', async ({ browser }) => {
  test.setTimeout(240000);

  const token = uniqueToken();
  const senderEmail = `seed.chat.clean.sender.${token}@example.test`;
  const receiverEmail = `seed.chat.clean.receiver.${token}@example.test`;

  const sender = await createUserWithProfile({
    email: senderEmail,
    fullName: 'Ali Test',
    username: `alitest${token.slice(-6)}`,
    gender: 'male',
    lookingForGender: 'female',
    age: 30,
    city: 'Istanbul',
  });

  const receiver = await createUserWithProfile({
    email: receiverEmail,
    fullName: 'Ayse Test',
    username: `aysetest${token.slice(-6)}`,
    gender: 'female',
    lookingForGender: 'male',
    age: 27,
    city: 'Ankara',
  });

  const matchId = await createMatch({ aUid: sender.uid, aAppId: sender.appId, bUid: receiver.uid, bAppId: receiver.appId });

  const senderText = 'Merhaba, duz yazida sohbet sorunsuz gidiyor mu diye test ediyorum.';
  const receiverReply = 'Evet, mesajini gordum ve sorunsuz cevap yazabiliyorum.';

  try {
    {
      const { context, page } = await createSignedInPage(browser, sender);
      try {
        await sendChatMessage(page, matchId, senderText);
        await openChat(page, matchId);
        await expect(page.getByText(senderText).first()).toBeVisible({ timeout: 30000 });
      } finally {
        await closeSignedInPage(page, context);
      }
    }

    await waitForStoredMessage({ matchId, userId: sender.uid, text: senderText });

    {
      const { context, page } = await createSignedInPage(browser, receiver);
      try {
        await openChat(page, matchId);
        await sendChatMessage(page, matchId, receiverReply);
      } finally {
        await closeSignedInPage(page, context);
      }
    }

    await waitForStoredMessage({ matchId, userId: receiver.uid, text: receiverReply });

    {
      const { context, page } = await createSignedInPage(browser, sender);
      try {
        await openChat(page, matchId);
      } finally {
        await closeSignedInPage(page, context);
      }
    }
  } finally {
    await cleanupUsersAndMatches({
      uids: [sender.uid, receiver.uid],
      appIds: [sender.appId, receiver.appId],
      matchIds: [matchId],
    });
  }
});

test('chat message input sends end to end through the visible UI controls', async ({ browser }) => {
  test.setTimeout(240000);

  const token = uniqueToken();
  const senderEmail = `seed.chat.ui.sender.${token}@example.test`;
  const receiverEmail = `seed.chat.ui.receiver.${token}@example.test`;

  const sender = await createUserWithProfile({
    email: senderEmail,
    fullName: 'Selim Test',
    username: `selimtest${token.slice(-6)}`,
    gender: 'male',
    lookingForGender: 'female',
    age: 30,
    city: 'Istanbul',
  });

  const receiver = await createUserWithProfile({
    email: receiverEmail,
    fullName: 'Elif Test',
    username: `eliftest${token.slice(-6)}`,
    gender: 'female',
    lookingForGender: 'male',
    age: 28,
    city: 'Ankara',
  });

  const matchId = await createMatch({ aUid: sender.uid, aAppId: sender.appId, bUid: receiver.uid, bAppId: receiver.appId });

  const senderText = 'Bu mesaj gorunen mesaj kutusundan gonderiliyor ve e2e regresyon testi icin kullaniliyor.';
  const receiverReply = 'Karsi taraf da ayni mesaj alanindan cevap verebiliyor.';

  try {
    {
      const { context, page } = await createSignedInPage(browser, sender);
      try {
        await sendChatMessageFromUi(page, matchId, senderText);
      } finally {
        await closeSignedInPage(page, context);
      }
    }

    await waitForStoredMessage({ matchId, userId: sender.uid, text: senderText });

    {
      const { context, page } = await createSignedInPage(browser, receiver);
      try {
        await openChat(page, matchId);
        await expect(page.getByText(senderText).first()).toBeVisible({ timeout: 30000 });
        await sendChatMessageFromUi(page, matchId, receiverReply);
      } finally {
        await closeSignedInPage(page, context);
      }
    }

    await waitForStoredMessage({ matchId, userId: receiver.uid, text: receiverReply });

    {
      const { context, page } = await createSignedInPage(browser, sender);
      try {
        await openChat(page, matchId);
        await expect(page.getByText(receiverReply).first()).toBeVisible({ timeout: 30000 });
      } finally {
        await closeSignedInPage(page, context);
      }
    }
  } finally {
    await cleanupUsersAndMatches({
      uids: [sender.uid, receiver.uid],
      appIds: [sender.appId, receiver.appId],
      matchIds: [matchId],
    });
  }
});

test('historical split-phone fragments do not block later normal chat messages', async ({ browser }) => {
  test.setTimeout(240000);

  const token = uniqueToken();
  const senderEmail = `seed.chat.legacy.sender.${token}@example.test`;
  const receiverEmail = `seed.chat.legacy.receiver.${token}@example.test`;

  const sender = await createUserWithProfile({
    email: senderEmail,
    fullName: 'Mehmet Test',
    username: `mehmettest${token.slice(-6)}`,
    gender: 'male',
    lookingForGender: 'female',
    age: 32,
    city: 'Bursa',
  });

  const receiver = await createUserWithProfile({
    email: receiverEmail,
    fullName: 'Fatma Test',
    username: `fatmatest${token.slice(-6)}`,
    gender: 'female',
    lookingForGender: 'male',
    age: 29,
    city: 'Konya',
  });

  const matchId = await createMatch({ aUid: sender.uid, aAppId: sender.appId, bUid: receiver.uid, bAppId: receiver.appId });
  await seedLegacyNumericFragments({ matchId, uid: sender.uid, fragments: ['089603', '516930'] });

  const senderText = 'Tamam, burada yazarak devam edelim. Normal mesajlar artik gitmeli.';
  const receiverReply = 'Mesajini gordum, ben de okuyup cevap verebiliyorum.';

  try {
    {
      const { context, page } = await createSignedInPage(browser, sender);
      try {
        await sendChatMessage(page, matchId, senderText);
        await openChat(page, matchId);
        await expect(page.getByText(senderText).first()).toBeVisible({ timeout: 30000 });
      } finally {
        await closeSignedInPage(page, context);
      }
    }

    {
      const { context, page } = await createSignedInPage(browser, receiver);
      try {
        await openChat(page, matchId);
        await expect(page.getByText(senderText).first()).toBeVisible({ timeout: 30000 });
        await sendChatMessage(page, matchId, receiverReply);
      } finally {
        await closeSignedInPage(page, context);
      }
    }

    await waitForStoredMessage({ matchId, userId: receiver.uid, text: receiverReply });

    {
      const { context, page } = await createSignedInPage(browser, sender);
      try {
        await openChat(page, matchId);
      } finally {
        await closeSignedInPage(page, context);
      }
    }
  } finally {
    await cleanupUsersAndMatches({
      uids: [sender.uid, receiver.uid],
      appIds: [sender.appId, receiver.appId],
      matchIds: [matchId],
    });
  }
});

test('users can share phone numbers in chat without blocking later replies', async ({ browser }) => {
  test.setTimeout(240000);

  const token = uniqueToken();
  const senderEmail = `seed.chat.contact.sender.${token}@example.test`;
  const receiverEmail = `seed.chat.contact.receiver.${token}@example.test`;

  const sender = await createUserWithProfile({
    email: senderEmail,
    fullName: 'Hasan Test',
    username: `hasantest${token.slice(-6)}`,
    gender: 'male',
    lookingForGender: 'female',
    age: 31,
    city: 'Istanbul',
  });

  const receiver = await createUserWithProfile({
    email: receiverEmail,
    fullName: 'Zeynep Test',
    username: `zeyneptest${token.slice(-6)}`,
    gender: 'female',
    lookingForGender: 'male',
    age: 26,
    city: 'Izmir',
  });

  const matchId = await createMatch({ aUid: sender.uid, aAppId: sender.appId, bUid: receiver.uid, bAppId: receiver.appId });

  const senderText = 'Numaram +90 555 000 11 22, istersen buradan da yazabilirsin.';
  const receiverReply = 'Numarani gordum, mesajlasma bloklanmadan cevap yazabiliyorum.';

  try {
    {
      const { context, page } = await createSignedInPage(browser, sender);
      try {
        await sendChatMessage(page, matchId, senderText);
        await openChat(page, matchId);
        await expect(page.getByText(senderText).first()).toBeVisible({ timeout: 30000 });
      } finally {
        await closeSignedInPage(page, context);
      }
    }

    {
      const { context, page } = await createSignedInPage(browser, receiver);
      try {
        await openChat(page, matchId);
        await sendChatMessage(page, matchId, receiverReply);
      } finally {
        await closeSignedInPage(page, context);
      }
    }

    await waitForStoredMessage({ matchId, userId: receiver.uid, text: receiverReply });

    {
      const { context, page } = await createSignedInPage(browser, sender);
      try {
        await openChat(page, matchId);
      } finally {
        await closeSignedInPage(page, context);
      }
    }
  } finally {
    await cleanupUsersAndMatches({
      uids: [sender.uid, receiver.uid],
      appIds: [sender.appId, receiver.appId],
      matchIds: [matchId],
    });
  }
});