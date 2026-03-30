import { test, expect, devices } from 'playwright/test';

const googleButtonName = /google/i;
const emailAuthButtonName = /daftar dengan email\/kata sandi|email\/şifre ile kaydol|masuk dengan email\/kata sandi|email\/şifre ile giriş yap|sign up with email|log in with email|email\/password/i;
const loginSubmitName = /masuk|giriş yap|log in/i;

async function withMobilePage(browser, options, run) {
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    ...options,
  });
  const page = await context.newPage();
  try {
    await run(page, context);
  } finally {
    await context.close();
  }
}

async function expectMobileSignupSurface(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/login(\?|$)/);
  await expect(page.getByRole('button', { name: googleButtonName }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: emailAuthButtonName }).first()).toBeVisible();
}

async function expectNoSameTabGoogleRedirect(page) {
  const googleButton = page.getByRole('button', { name: googleButtonName }).first();
  await expect(googleButton).toBeVisible();

  const popupPromise = page.waitForEvent('popup', { timeout: 4000 }).catch(() => null);
  await googleButton.click();
  const popup = await popupPromise;

  await page.waitForTimeout(1200);
  await expect(page).toHaveURL(/\/login(\?|$)/);

  if (popup) {
    await popup.close().catch(() => {});
  }
}

async function loginWithEmailPassword(page, email, password, locale) {
  await page.goto(`/login?mode=login&lang=${locale}&next=${encodeURIComponent('/profilim')}`);

  await page.getByRole('button', { name: emailAuthButtonName }).click();

  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.getByRole('button', { name: loginSubmitName }).last().click();

  await expect(page).toHaveURL(/\/(profilim|app\/pool)(\?|$)/);
}

async function signupWithEmailPassword(page, locale) {
  const unique = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const email = `mobile.signup.${locale}.${unique}@example.test`;
  const password = 'Test1234!';

  await page.goto(`/login?mode=signup&lang=${locale}`);
  await page.getByRole('button', { name: emailAuthButtonName }).click();

  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const confirmPasswordInput = page.locator('input[type="password"]').nth(1);

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(confirmPasswordInput).toBeVisible();

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await confirmPasswordInput.fill(password);
  await page.locator('form button[type="submit"]').first().click();

  await expect(page).toHaveURL(/\/evlilik\/eslestirme-basvuru(\?|$)/);
  await expect(page.locator('form').first()).toBeVisible();
}

test('TR mobil signup yüzeyi auto-google ile aynı sayfada kalıyor', async ({ browser }) => {
  await withMobilePage(
    browser,
    {
      locale: 'tr-TR',
      timezoneId: 'Europe/Istanbul',
    },
    async (page) => {
      await expectMobileSignupSurface(page, '/login?mode=signup&auto=google&lang=tr');
      await page.waitForTimeout(1500);
      await expect(page).toHaveURL(/\/login\?mode=signup(?:&lang=tr|&[^#]*)?$/);
      expect(page.url()).not.toContain('auto=google');
    },
  );
});

test('ID mobil signup yüzeyi auto-google ile aynı sayfada kalıyor', async ({ browser }) => {
  await withMobilePage(
    browser,
    {
      locale: 'id-ID',
      timezoneId: 'Asia/Jakarta',
    },
    async (page) => {
      await expectMobileSignupSurface(page, '/login?mode=signup&auto=google&lang=id');
      await page.waitForTimeout(1500);
      await expect(page).toHaveURL(/\/login\?mode=signup(?:&lang=id|&[^#]*)?$/);
      expect(page.url()).not.toContain('auto=google');
    },
  );
});

test('TR mobilde Google tıklaması same-tab redirect yapmıyor', async ({ browser }) => {
  await withMobilePage(
    browser,
    {
      locale: 'tr-TR',
      timezoneId: 'Europe/Istanbul',
    },
    async (page) => {
      await expectMobileSignupSurface(page, '/login?mode=signup&lang=tr');
      await expectNoSameTabGoogleRedirect(page);
    },
  );
});

test('ID mobilde Google tıklaması same-tab redirect yapmıyor', async ({ browser }) => {
  await withMobilePage(
    browser,
    {
      locale: 'id-ID',
      timezoneId: 'Asia/Jakarta',
    },
    async (page) => {
      await expectMobileSignupSurface(page, '/login?mode=signup&lang=id');
      await expectNoSameTabGoogleRedirect(page);
    },
  );
});

test('TR mobil email login smoke', async ({ browser }) => {
  const email = String(process.env.E2E_EMAIL || '').trim();
  const password = String(process.env.E2E_PASSWORD || '').trim();
  test.skip(!email || !password, 'E2E_EMAIL/E2E_PASSWORD not set; TR mobile login smoke skipped.');

  await withMobilePage(
    browser,
    {
      locale: 'tr-TR',
      timezoneId: 'Europe/Istanbul',
    },
    async (page) => {
      await loginWithEmailPassword(page, email, password, 'tr');
    },
  );
});

test('TR mobil email signup yeni kullanıcıyı başvuru formuna yönlendiriyor', async ({ browser }) => {
  await withMobilePage(
    browser,
    {
      locale: 'tr-TR',
      timezoneId: 'Europe/Istanbul',
    },
    async (page) => {
      await signupWithEmailPassword(page, 'tr');
    },
  );
});

test('ID mobil email login smoke', async ({ browser }) => {
  const email = String(process.env.E2E_EMAIL || '').trim();
  const password = String(process.env.E2E_PASSWORD || '').trim();
  test.skip(!email || !password, 'E2E_EMAIL/E2E_PASSWORD not set; ID mobile login smoke skipped.');

  await withMobilePage(
    browser,
    {
      locale: 'id-ID',
      timezoneId: 'Asia/Jakarta',
    },
    async (page) => {
      await loginWithEmailPassword(page, email, password, 'id');
    },
  );
});

test('ID mobil email signup yeni kullanıcıyı başvuru formuna yönlendiriyor', async ({ browser }) => {
  await withMobilePage(
    browser,
    {
      locale: 'id-ID',
      timezoneId: 'Asia/Jakarta',
    },
    async (page) => {
      await signupWithEmailPassword(page, 'id');
    },
  );
});