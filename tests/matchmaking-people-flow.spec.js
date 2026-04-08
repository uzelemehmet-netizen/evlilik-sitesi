import { test, expect } from 'playwright/test';

const senderEmail = String(process.env.E2E_SENDER_EMAIL || '').trim();
const senderPassword = String(process.env.E2E_SENDER_PASSWORD || '').trim();
const receiverEmail = String(process.env.E2E_RECEIVER_EMAIL || '').trim();
const receiverPassword = String(process.env.E2E_RECEIVER_PASSWORD || '').trim();
const targetUsername = String(process.env.E2E_TARGET_USERNAME || '').trim();
const senderUsername = String(process.env.E2E_SENDER_USERNAME || '').trim();

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

async function openPoolCard(page, username) {
  await page.goto('/app/pool', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/app\/pool(\?|$)/);
  await expect(page.getByRole('heading', { name: /perantara jodoh|jelajahi|havuz|pool|keşfet|discover|eş adayları|explore/i }).first()).toBeVisible();

  const card = findCardByUsername(page, username);
  await expect(card).toBeVisible({ timeout: 30000 });
  return card;
}

function findCardByUsername(page, username) {
  const safeName = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const title = page.getByText(new RegExp(`^${safeName}(,|$)`, 'i')).first();
  return title.locator('xpath=ancestor::div[contains(@class,"overflow-hidden") and contains(@class,"rounded-lg")][1]');
}

test('people flow works end-to-end with add, message, like and notification visibility', async ({ browser }) => {
  test.setTimeout(300000);
  test.skip(!senderEmail || !senderPassword || !receiverEmail || !receiverPassword || !targetUsername || !senderUsername, 'E2E sender/receiver credentials or usernames are missing.');

  const senderContext = await browser.newContext();
  const receiverContext = await browser.newContext();
  const senderPage = await senderContext.newPage();
  const receiverPage = await receiverContext.newPage();
  const uniqueToken = Math.random().toString(36).replace(/[^a-z]+/g, '').slice(0, 8) || 'samplemsg';
  const messageText = `E2E short message ${uniqueToken}`;

  try {
    await loginWithEmailPassword(senderPage, senderEmail, senderPassword);

    const poolCard = await openPoolCard(senderPage, targetUsername);
    await poolCard.getByRole('button', { name: /kişilerime ekle|add to my people|tambah ke orang saya/i }).click();
    await expect(poolCard.getByRole('button', { name: /kişilerine eklendi|added to my people|ditambahkan ke orang saya/i })).toBeVisible({ timeout: 15000 });

    await senderPage.goto('/app/matches', { waitUntil: 'domcontentloaded' });
    await expect(senderPage.getByRole('heading', { name: /orang saya|kişilerim|my people/i })).toBeVisible();

    const personCard = findCardByUsername(senderPage, targetUsername);
    await expect(personCard).toBeVisible({ timeout: 30000 });
    await expect(personCard.getByRole('button', { name: /beğen|like|suka/i })).toBeVisible();
    await expect(personCard.getByRole('button', { name: /kısa mesaj|short message|pesan singkat/i })).toBeVisible();
    await expect(personCard.getByRole('button', { name: /profil detayları|profile details|detail profil/i })).toBeVisible();

    await personCard.getByRole('button', { name: /kısa mesaj|short message|pesan singkat/i }).click();
    await senderPage.locator('textarea').fill(messageText);
    await senderPage.getByRole('button', { name: /gönder|send|kirim/i }).last().click();
    await expect(senderPage.getByText(/kısa mesaj gönderildi|short message sent|pesan singkat terkirim/i)).toBeVisible({ timeout: 15000 });

    await Promise.all([
      senderPage.waitForURL(/\/app\/match\/.+/, { timeout: 20000 }),
      personCard.getByRole('button', { name: /profil detayları|profile details|detail profil/i }).click(),
    ]);
    await expect(senderPage.getByTestId('match-profile-full-details')).toBeVisible({ timeout: 15000 });
    await senderPage.goto('/app/matches', { waitUntil: 'domcontentloaded' });
    await expect(senderPage.getByRole('heading', { name: /orang saya|kişilerim|my people/i })).toBeVisible();

    await personCard.getByRole('button', { name: /beğen|like|suka/i }).click();
    await expect(senderPage).toHaveURL(/\/app\/match\//, { timeout: 20000 });

    await loginWithEmailPassword(receiverPage, receiverEmail, receiverPassword);
    await receiverPage.goto('/app/matches', { waitUntil: 'domcontentloaded' });
    await expect(receiverPage.getByRole('heading', { name: /orang saya|kişilerim|my people/i })).toBeVisible();

    await receiverPage.getByRole('button', { name: /notifikasi|bildirimler|notifications|permintaan|istekler|requests/i }).click();
    await expect(receiverPage.getByText(/seni kişilerine ekledi|added you to their people list|menambahkan anda ke daftar orangnya/i).first()).toBeVisible({ timeout: 15000 });
    await expect(receiverPage.getByText(new RegExp(senderUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')).last()).toBeVisible({ timeout: 15000 });
    await receiverPage.getByRole('button', { name: /kapat|close|tutup/i }).first().click();

    await receiverPage.getByRole('button', { name: /mesaj|messages|pesan/i }).first().click();
    await expect(receiverPage.getByText(messageText).first()).toBeVisible({ timeout: 15000 });
    await receiverPage.getByRole('button', { name: /kapat|close|tutup/i }).first().click();

    await expect(receiverPage.getByText(/sent you a like|sana beğeni gönderdi|mengirimkan suka kepada anda/i).first()).toBeVisible({ timeout: 15000 });
  } finally {
    await senderContext.close().catch(() => {});
    await receiverContext.close().catch(() => {});
  }
});