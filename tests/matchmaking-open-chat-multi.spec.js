import { test, expect } from 'playwright/test';

const primaryEmail = String(process.env.E2E_OPENCHAT_PRIMARY_EMAIL || '').trim();
const primaryPassword = String(process.env.E2E_OPENCHAT_PRIMARY_PASSWORD || '').trim();
const primaryUid = String(process.env.E2E_OPENCHAT_PRIMARY_UID || '').trim();

const peerOneEmail = String(process.env.E2E_OPENCHAT_PEER1_EMAIL || '').trim();
const peerOnePassword = String(process.env.E2E_OPENCHAT_PEER1_PASSWORD || '').trim();
const peerOneUid = String(process.env.E2E_OPENCHAT_PEER1_UID || '').trim();

const peerTwoEmail = String(process.env.E2E_OPENCHAT_PEER2_EMAIL || '').trim();
const peerTwoPassword = String(process.env.E2E_OPENCHAT_PEER2_PASSWORD || '').trim();
const peerTwoUid = String(process.env.E2E_OPENCHAT_PEER2_UID || '').trim();

function buildMatchId(aUid, bUid) {
  return [String(aUid || '').trim(), String(bUid || '').trim()].filter(Boolean).sort().join('__');
}

function uniqueLongMessage(prefix) {
  const token = Math.random().toString(36).replace(/[^a-z]+/g, '').slice(0, 8) || 'sohbet';
  const safePrefix = String(prefix || '').replace(/[^a-zA-Z\s]+/g, ' ').trim() || 'uzun sohbet';
  const filler = `${safePrefix} ${token} selam bu uzun sohbet denemesinde sadece duz metin kullaniyorum ve iletisim bilgisi paylasmiyorum `.repeat(8);
  return filler.slice(0, 320);
}

async function loginWithEmailPassword(page, email, password) {
  await page.goto(`/login?mode=login&next=${encodeURIComponent('/profilim')}`, { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', {
    name: /masuk dengan email\/kata sandi|email\/şifre ile giriş yap|log in with email|email\/password/i,
  }).click();

  const emailInput = page.locator('input[type="email"]:visible').first();
  const passwordInput = page.locator('input[type="password"]:visible').first();

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.getByRole('button', { name: /masuk|giriş yap|log in/i }).last().click();
  await expect(page).toHaveURL(/\/profilim(\?|$)/);
}

async function openChat(page, matchId) {
  await page.goto(`/app/chat/${matchId}`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(new RegExp(`/app/chat/${matchId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\?|$)`));
  const input = page.locator('[data-tutorial-id="chat-input"]');
  await expect(input).toBeVisible({ timeout: 30000 });
  await expect(input).toBeEnabled();
  await expect(input).toHaveAttribute('maxLength', '600');
  return input;
}

async function sendLongMessage(page, matchId, text) {
  const input = await openChat(page, matchId);
  await input.fill(text);
  const sendButton = page.locator('[data-tutorial-id="chat-send"]');
  await expect(sendButton).toBeEnabled();
  await sendButton.click();
  await expect(page.getByText(text)).toBeVisible({ timeout: 30000 });
}

test('same user can long-message multiple matches without active lock', async ({ browser }) => {
  test.setTimeout(300000);
  test.skip(
    !primaryEmail || !primaryPassword || !primaryUid || !peerOneEmail || !peerOnePassword || !peerOneUid || !peerTwoEmail || !peerTwoPassword || !peerTwoUid,
    'Open chat E2E credentials are missing.'
  );

  const matchOneId = buildMatchId(primaryUid, peerOneUid);
  const matchTwoId = buildMatchId(primaryUid, peerTwoUid);
  test.skip(!matchOneId || !matchTwoId, 'Open chat E2E match ids could not be derived.');

  const primaryContext = await browser.newContext();
  const peerOneContext = await browser.newContext();
  const peerTwoContext = await browser.newContext();
  const primaryPage = await primaryContext.newPage();
  const peerOnePage = await peerOneContext.newPage();
  const peerTwoPage = await peerTwoContext.newPage();

  const primaryToOne = uniqueLongMessage('ilk sohbet');
  const primaryToTwo = uniqueLongMessage('ikinci sohbet');
  const peerOneReply = uniqueLongMessage('ilk cevap');
  const peerTwoReply = uniqueLongMessage('ikinci cevap');

  try {
    await loginWithEmailPassword(primaryPage, primaryEmail, primaryPassword);
    await sendLongMessage(primaryPage, matchOneId, primaryToOne);
    await sendLongMessage(primaryPage, matchTwoId, primaryToTwo);

    await openChat(primaryPage, matchOneId);
    await expect(primaryPage.getByText(primaryToOne)).toBeVisible({ timeout: 30000 });
    await openChat(primaryPage, matchTwoId);
    await expect(primaryPage.getByText(primaryToTwo)).toBeVisible({ timeout: 30000 });

    await loginWithEmailPassword(peerOnePage, peerOneEmail, peerOnePassword);
    await openChat(peerOnePage, matchOneId);
    await expect(peerOnePage.getByText(primaryToOne)).toBeVisible({ timeout: 30000 });
    await sendLongMessage(peerOnePage, matchOneId, peerOneReply);

    await loginWithEmailPassword(peerTwoPage, peerTwoEmail, peerTwoPassword);
    await openChat(peerTwoPage, matchTwoId);
    await expect(peerTwoPage.getByText(primaryToTwo)).toBeVisible({ timeout: 30000 });
    await sendLongMessage(peerTwoPage, matchTwoId, peerTwoReply);

    await openChat(primaryPage, matchOneId);
    await expect(primaryPage.getByText(peerOneReply)).toBeVisible({ timeout: 30000 });

    await openChat(primaryPage, matchTwoId);
    await expect(primaryPage.getByText(peerTwoReply)).toBeVisible({ timeout: 30000 });
  } finally {
    await primaryContext.close().catch(() => {});
    await peerOneContext.close().catch(() => {});
    await peerTwoContext.close().catch(() => {});
  }
});