import { test, expect } from 'playwright/test';

const primaryEmail = String(process.env.E2E_OPENCHAT_PRIMARY_EMAIL || '').trim();
const primaryPassword = String(process.env.E2E_OPENCHAT_PRIMARY_PASSWORD || '').trim();
const primaryUid = String(process.env.E2E_OPENCHAT_PRIMARY_UID || '').trim();

const peerEmail = String(process.env.E2E_OPENCHAT_PEER1_EMAIL || '').trim();
const peerPassword = String(process.env.E2E_OPENCHAT_PEER1_PASSWORD || '').trim();
const peerUid = String(process.env.E2E_OPENCHAT_PEER1_UID || '').trim();

const peerTwoEmail = String(process.env.E2E_OPENCHAT_PEER2_EMAIL || '').trim();
const peerTwoPassword = String(process.env.E2E_OPENCHAT_PEER2_PASSWORD || '').trim();
const peerTwoUid = String(process.env.E2E_OPENCHAT_PEER2_UID || '').trim();

function buildMatchId(aUid, bUid) {
  return [String(aUid || '').trim(), String(bUid || '').trim()].filter(Boolean).sort().join('__');
}

function uniqueMessage(prefix) {
  const token = Math.random().toString(36).replace(/[^a-z]+/g, '').slice(0, 8) || 'hub';
  return `${String(prefix || 'mesaj merkezi').trim()} ${token} bu mesaj sadece playwright dogrulamasi icindir ve duz metin icerir`;
}

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

async function authPost(page, endpoint, payload) {
  return page.evaluate(
    async ({ endpointArg, payloadArg }) => {
      const { authFetch } = await import('/src/utils/authFetch.js');
      return authFetch(endpointArg, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payloadArg || {}),
      });
    },
    { endpointArg: endpoint, payloadArg: payload }
  );
}

async function openMessagesHub(page) {
  await page.goto('/app/messages', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/app\/messages(\?|$)/);
}

test('mobile messages hub highlights unread activity and opens the chat thread', async ({ browser }) => {
  test.setTimeout(240000);
  test.skip(
    !primaryEmail || !primaryPassword || !primaryUid || !peerEmail || !peerPassword || !peerUid,
    'Messages hub E2E credentials are missing.'
  );

  const matchId = buildMatchId(primaryUid, peerUid);
  test.skip(!matchId, 'Messages hub E2E match id could not be derived.');

  const primaryContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
  });
  const peerContext = await browser.newContext();
  const primaryPage = await primaryContext.newPage();
  const peerPage = await peerContext.newPage();

  const messageText = uniqueMessage('mesaj merkezi testi');

  try {
    await loginWithEmailPassword(primaryPage, primaryEmail, primaryPassword);
    await authPost(primaryPage, '/api/matchmaking-chat-mark-read', { matchId });

    await loginWithEmailPassword(peerPage, peerEmail, peerPassword);
    const sendResult = await authPost(peerPage, '/api/matchmaking-chat-send', { matchId, text: messageText });
    expect(sendResult?.ok).toBeTruthy();

    await primaryPage.goto('/app/messages', { waitUntil: 'domcontentloaded' });
    await expect(primaryPage).toHaveURL(/\/app\/messages(\?|$)/);

    const alertBadge = primaryPage.locator('.studio-bottom-nav-alert-badge').first();
    await expect(alertBadge).toBeVisible({ timeout: 30000 });
    await expect(alertBadge).not.toHaveText(/^0$/);

    const threadButton = primaryPage.getByTestId(`messages-thread-${matchId}`);
    await expect(threadButton).toBeVisible({ timeout: 30000 });
    await expect(primaryPage.getByTestId(`messages-thread-preview-${matchId}`)).toContainText(messageText, { timeout: 30000 });
    await threadButton.click();

    await expect(primaryPage).toHaveURL(new RegExp(`/app/chat/${matchId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\?|$)`), { timeout: 30000 });
    await expect(primaryPage.getByText(messageText).first()).toBeVisible({ timeout: 30000 });
  } finally {
    await primaryContext.close().catch(() => {});
    await peerContext.close().catch(() => {});
  }
});

test('messages hub shows profile access requests and allows rejecting them', async ({ browser }) => {
  test.setTimeout(240000);
  test.skip(
    !primaryEmail || !primaryPassword || !primaryUid || !peerEmail || !peerPassword || !peerUid,
    'Messages hub request E2E credentials are missing.'
  );

  const primaryContext = await browser.newContext();
  const peerContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
  });
  const primaryPage = await primaryContext.newPage();
  const peerPage = await peerContext.newPage();
  const requestId = `${primaryUid}__${peerUid}`;

  try {
    await loginWithEmailPassword(peerPage, peerEmail, peerPassword);
    try {
      await authPost(peerPage, '/api/matchmaking-profile-access-respond', { fromUid: primaryUid, decision: 'reject' });
    } catch {
      // previous request may not exist; ignore
    }

    await loginWithEmailPassword(primaryPage, primaryEmail, primaryPassword);
    const reqResult = await authPost(primaryPage, '/api/matchmaking-profile-access-request', { targetUid: peerUid });
    expect(reqResult?.ok).toBeTruthy();
    expect(String(reqResult?.status || '')).toBe('pending');

    await openMessagesHub(peerPage);

    const alertBadge = peerPage.locator('.studio-bottom-nav-alert-badge').first();
    await expect(alertBadge).toBeVisible({ timeout: 30000 });

    const requestCard = peerPage.getByTestId(`messages-request-${requestId}`);
    await expect(requestCard).toBeVisible({ timeout: 30000 });
    await expect(requestCard).toContainText(/profilini görmek için izin istiyor|requests permission to view your profile|meminta izin untuk melihat profil/i);

    const rejectButton = peerPage.getByTestId(`messages-request-reject-${requestId}`);
    await expect(rejectButton).toBeVisible();
    await rejectButton.click();

    await expect(peerPage.getByText(/İstek reddedildi|Request rejected|Permintaan ditolak/i).first()).toBeVisible({ timeout: 30000 });
    await expect(requestCard).toHaveCount(0, { timeout: 30000 });
  } finally {
    await primaryContext.close().catch(() => {});
    await peerContext.close().catch(() => {});
  }
});

test('messages hub shows incoming likes when the sender likes a profile', async ({ browser }) => {
  test.setTimeout(240000);
  test.skip(
    !primaryEmail || !primaryPassword || !primaryUid || !peerTwoEmail || !peerTwoPassword || !peerTwoUid,
    'Messages hub like E2E credentials are missing.'
  );

  const matchId = buildMatchId(primaryUid, peerTwoUid);
  test.skip(!matchId, 'Messages hub like E2E match id could not be derived.');

  const primaryContext = await browser.newContext();
  const peerTwoContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
  });
  const primaryPage = await primaryContext.newPage();
  const peerTwoPage = await peerTwoContext.newPage();

  try {
    await loginWithEmailPassword(primaryPage, primaryEmail, primaryPassword);
    try {
      await authPost(primaryPage, '/api/matchmaking-decision', { matchId, decision: 'revoke' });
    } catch {
      // revoke may not be available for some prior states; continue
    }

    const likeResult = await authPost(primaryPage, '/api/matchmaking-decision', { matchId, decision: 'accept' });
    expect(likeResult?.ok).toBeTruthy();

    await loginWithEmailPassword(peerTwoPage, peerTwoEmail, peerTwoPassword);
    await openMessagesHub(peerTwoPage);

    const alertBadge = peerTwoPage.locator('.studio-bottom-nav-alert-badge').first();
    await expect(alertBadge).toBeVisible({ timeout: 30000 });

    const likeCard = peerTwoPage.getByTestId(`messages-like-${matchId}`);
    await expect(likeCard).toBeVisible({ timeout: 30000 });
    await expect(likeCard).toContainText(/Sana beğeni gönderdi|Sent you a like|Mengirim Anda suka/i);
  } finally {
    await primaryContext.close().catch(() => {});
    await peerTwoContext.close().catch(() => {});
  }
});