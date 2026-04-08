import { test, expect } from 'playwright/test';

const primaryEmail = String(process.env.E2E_OPENCHAT_PRIMARY_EMAIL || '').trim();
const primaryPassword = String(process.env.E2E_OPENCHAT_PRIMARY_PASSWORD || '').trim();
const primaryUid = String(process.env.E2E_OPENCHAT_PRIMARY_UID || '').trim();
const peerOneUid = String(process.env.E2E_OPENCHAT_PEER1_UID || '').trim();
const peerTwoUid = String(process.env.E2E_OPENCHAT_PEER2_UID || '').trim();

const peerOneUsername = String(process.env.E2E_OPENCHAT_PEER1_USERNAME || 'seed_kadin_01').trim();
const peerTwoUsername = String(process.env.E2E_OPENCHAT_PEER2_USERNAME || 'seed_kadin_02').trim();

function buildMatchId(aUid, bUid) {
  return [String(aUid || '').trim(), String(bUid || '').trim()].filter(Boolean).sort().join('__');
}

function uniqueLongMessage(prefix) {
  const token = Math.random().toString(36).replace(/[^a-z]+/g, '').slice(0, 8) || 'sohbet';
  const safePrefix = String(prefix || '').replace(/[^a-zA-Z\s]+/g, ' ').trim() || 'uzun sohbet';
  const filler = `${safePrefix} ${token} sadece duz metin kullaniyorum ve burada uzun sohbet akisini test ediyorum `.repeat(8);
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

function findPersonCard(page, username) {
  const safeName = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const title = page.getByText(new RegExp(`^${safeName}(,|$)`, 'i')).first();
  return title.locator('xpath=ancestor::div[contains(@class,"overflow-hidden") and contains(@class,"rounded-lg")][1]');
}

async function openDirectChatFromPersonCard(page, username, matchId) {
  await page.goto('/app/matches', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/app\/matches(\?|$)/);
  await expect(page.getByRole('heading', { name: /orang saya|kişilerim|my people/i })).toBeVisible({ timeout: 30000 });

  const card = findPersonCard(page, username);
  await expect(card).toBeVisible({ timeout: 30000 });

  const messageButton = card.getByRole('button', { name: /mesaj|message|pesan/i });
  await expect(messageButton).toBeVisible();

  await Promise.all([
    page.waitForURL(new RegExp(`/app/chat/${matchId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\?|$)`), { timeout: 30000 }),
    messageButton.click(),
  ]);

  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  const input = page.locator('[data-tutorial-id="chat-input"]');
  await expect(input).toBeVisible({ timeout: 30000 });
  await expect(input).toBeEnabled();
  await expect(input).toHaveAttribute('maxLength', '600');
  return input;
}

test('my people message button opens direct long chat instead of short-message flow', async ({ page }) => {
  test.setTimeout(180000);
  test.skip(!primaryEmail || !primaryPassword || !primaryUid || !peerOneUid || !peerTwoUid, 'My People direct chat E2E credentials are missing.');

  const matchOneId = buildMatchId(primaryUid, peerOneUid);
  const matchTwoId = buildMatchId(primaryUid, peerTwoUid);
  const firstMessage = uniqueLongMessage('kisilerim ilk kart');
  const secondMessage = uniqueLongMessage('kisilerim ikinci kart');

  await loginWithEmailPassword(page, primaryEmail, primaryPassword);

  const inputOne = await openDirectChatFromPersonCard(page, peerOneUsername, matchOneId);
  await inputOne.fill(firstMessage);
  await page.locator('[data-tutorial-id="chat-send"]').click();
  await expect(page.getByText(firstMessage)).toBeVisible({ timeout: 30000 });

  const inputTwo = await openDirectChatFromPersonCard(page, peerTwoUsername, matchTwoId);
  await inputTwo.fill(secondMessage);
  await page.locator('[data-tutorial-id="chat-send"]').click();
  await expect(page.getByText(secondMessage)).toBeVisible({ timeout: 30000 });
});