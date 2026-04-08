import { test, expect } from 'playwright/test';

const primaryEmail = String(process.env.E2E_OPENCHAT_PRIMARY_EMAIL || '').trim();
const primaryPassword = String(process.env.E2E_OPENCHAT_PRIMARY_PASSWORD || '').trim();
const primaryUid = String(process.env.E2E_OPENCHAT_PRIMARY_UID || '').trim();
const peerOneUid = String(process.env.E2E_OPENCHAT_PEER1_UID || '').trim();
const peerOneUsername = String(process.env.E2E_OPENCHAT_PEER1_USERNAME || 'seed_kadin_01').trim();

function buildMatchId(aUid, bUid) {
  return [String(aUid || '').trim(), String(bUid || '').trim()].filter(Boolean).sort().join('__');
}

function uniqueLongMessage(prefix) {
  const token = Math.random().toString(36).replace(/[^a-z]+/g, '').slice(0, 8) || 'sohbet';
  const safePrefix = String(prefix || '').replace(/[^a-zA-Z\s]+/g, ' ').trim() || 'uzun sohbet';
  const filler = `${safePrefix} ${token} bu mesaj matches kartindan acilan sinirsiz sohbet testidir ve sadece duz metin icerir `.repeat(8);
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

function findMatchCard(page, username) {
  const safeName = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const title = page.getByText(new RegExp(`^${safeName}(,|$)`, 'i')).first();
  return title.locator('xpath=ancestor::div[contains(@class,"overflow-hidden") and contains(@class,"rounded-lg")][1]');
}

test('matches card message button opens unrestricted long chat', async ({ page }) => {
  test.setTimeout(180000);
  test.skip(!primaryEmail || !primaryPassword || !primaryUid || !peerOneUid, 'Matches direct chat E2E credentials are missing.');

  const matchId = buildMatchId(primaryUid, peerOneUid);
  const messageText = uniqueLongMessage('matches karti');

  await loginWithEmailPassword(page, primaryEmail, primaryPassword);
  await page.goto('/app/matches', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/app\/matches(\?|$)/);
  await expect(page.getByRole('heading', { name: /orang saya|kişilerim|my people|pencocokan saya|eşleşmelerim|my matches/i })).toBeVisible({ timeout: 30000 });

  const card = findMatchCard(page, peerOneUsername);
  await expect(card).toBeVisible({ timeout: 30000 });

  const messageButton = card.locator('[data-tutorial-id="match-open-message"]').first();
  await expect(messageButton).toBeVisible();

  await Promise.all([
    page.waitForURL(new RegExp(`/app/chat/${matchId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\?|$)`), { timeout: 30000 }),
    messageButton.click(),
  ]);

  const input = page.locator('[data-tutorial-id="chat-input"]');
  await expect(input).toBeVisible({ timeout: 30000 });
  await expect(input).toBeEnabled();
  await expect(input).toHaveAttribute('maxLength', '600');
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);

  await input.fill(messageText);
  await page.locator('[data-tutorial-id="chat-send"]').click();
  await expect(page.getByText(messageText)).toBeVisible({ timeout: 30000 });
});