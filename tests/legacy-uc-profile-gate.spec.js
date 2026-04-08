import { execFileSync } from 'node:child_process';
import path from 'node:path';

import { test, expect } from 'playwright/test';

const viewerEmail = String(process.env.E2E_LEGACY_VIEWER_EMAIL || 'e2e_legacy_uc_gate.viewer@example.test').trim();
const viewerPassword = String(process.env.E2E_LEGACY_VIEWER_PASSWORD || 'Test1234!').trim();
const targetUsername = String(process.env.E2E_LEGACY_TARGET_USERNAME || 'E2E Legacy Candidate').trim();

function ensureLegacyUcFixtures() {
  execFileSync(process.execPath, [path.join(process.cwd(), 'scripts', 'e2e-legacy-uc-gate-setup.mjs')], {
    cwd: process.cwd(),
    stdio: 'pipe',
    env: process.env,
  });
}

async function loginWithEmailPassword(page, email, password) {
  await page.goto(`/login?mode=login&next=${encodeURIComponent('/app/pool')}`, { waitUntil: 'domcontentloaded' });

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
}

function findPoolCardByUsername(page, username) {
  const escaped = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const title = page.getByText(new RegExp(`^${escaped}(,|$)`, 'i')).first();
  return title.locator('xpath=ancestor::div[contains(@class,"overflow-hidden") and contains(@class,"rounded-lg")][1]');
}

test('UC kodlu eski kullanıcı Keşfet ekranında etkileşime devam edebilir', async ({ page }) => {
  test.setTimeout(180000);

  ensureLegacyUcFixtures();

  await loginWithEmailPassword(page, viewerEmail, viewerPassword);
  await expect(page).toHaveURL(/\/app\/pool(\?|$)|\/profilim(\?|$)/);
  if (!/\/app\/pool(\?|$)/.test(page.url())) {
    await page.goto('/app/pool', { waitUntil: 'domcontentloaded' });
  }

  await expect(page.getByRole('heading', { name: /perantara jodoh|eş adayları|explore|jelajahi|keşfet|discover/i }).first()).toBeVisible();

  const targetCard = findPoolCardByUsername(page, targetUsername);
  const targetCardVisible = await targetCard.isVisible({ timeout: 5000 }).catch(() => false);

  const addButton = targetCardVisible
    ? targetCard.getByRole('button', { name: /kişilerime ekle|add to my people|tambah ke orang saya/i }).first()
    : page.getByRole('button', { name: /kişilerime ekle|add to my people|tambah ke orang saya/i }).first();

  await expect(addButton).toBeVisible({ timeout: 15000 });
  await addButton.click();

  await expect(page.getByRole('button', { name: /fotoğraf yükle|upload photo|unggah foto/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /formu doldur|fill the form|isi formulir/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /kişilerine eklendi|added to my people|ditambahkan ke orang saya/i }).first()).toBeVisible({ timeout: 15000 });
});