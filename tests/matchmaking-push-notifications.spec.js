import fs from 'node:fs';
import path from 'node:path';
import { test, expect, chromium } from 'playwright/test';

const senderEmail = String(process.env.E2E_OPENCHAT_PRIMARY_EMAIL || '').trim();
const senderPassword = String(process.env.E2E_OPENCHAT_PRIMARY_PASSWORD || '').trim();
const senderUid = String(process.env.E2E_OPENCHAT_PRIMARY_UID || '').trim();

const receiverMessageEmail = String(process.env.E2E_OPENCHAT_PEER1_EMAIL || '').trim();
const receiverMessagePassword = String(process.env.E2E_OPENCHAT_PEER1_PASSWORD || '').trim();
const receiverMessageUid = String(process.env.E2E_OPENCHAT_PEER1_UID || '').trim();

const receiverLikeEmail = String(process.env.E2E_OPENCHAT_PEER2_EMAIL || '').trim();
const receiverLikePassword = String(process.env.E2E_OPENCHAT_PEER2_PASSWORD || '').trim();
const receiverLikeUid = String(process.env.E2E_OPENCHAT_PEER2_UID || '').trim();
const receiverLikeUsername = String(process.env.E2E_OPENCHAT_PEER2_USERNAME || 'seed_kadin_02').trim();
const baseURL = String(process.env.E2E_BASE_URL || 'http://127.0.0.1:5173').trim();

function createUserDataDir(label) {
  const slug = String(label || 'push')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const dir = path.join(process.cwd(), 'test-results', '.push-profiles', `${slug}-${unique}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function buildMatchId(aUid, bUid) {
  return [String(aUid || '').trim(), String(bUid || '').trim()].filter(Boolean).sort().join('__');
}

function uniqueLongMessage(prefix) {
  const token = Math.random().toString(36).replace(/[^a-z]+/g, '').slice(0, 8) || 'sohbet';
  const safePrefix = String(prefix || '').replace(/[^a-zA-Z\s]+/g, ' ').trim() || 'yeni mesaj';
  const filler = `${safePrefix} ${token} bu sohbet dogrulamasinda sadece duz metin kullaniliyor ve guvenli icerik gonderiliyor `.repeat(7);
  return filler.slice(0, 280);
}

async function sendMatchMessageViaApi(page, matchId, text) {
  return page.evaluate(
    async ({ matchIdArg, textArg }) => {
      const { authFetch } = await import('/src/utils/authFetch.js');
      return authFetch('/api/matchmaking-chat-send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: matchIdArg, text: textArg }),
      });
    },
    { matchIdArg: matchId, textArg: text }
  );
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

async function enablePush(page) {
  await page.goto('/profilim?debugPush=1', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/profilim(\?|$)/);

  const result = await page.evaluate(async () => {
    const mod = await import('/src/utils/pushNotifications.js');
    return mod.enablePushForCurrentUser();
  });

  expect(result?.ok).toBeTruthy();

  await page.waitForFunction(() => {
    try {
      const token = String(window.localStorage.getItem('pushToken') || '').trim();
      return token.length > 20;
    } catch {
      return false;
    }
  }, { timeout: 60000 });

  const token = await page.evaluate(() => String(window.localStorage.getItem('pushToken') || ''));
  expect(token.length).toBeGreaterThan(20);
}

async function clearPushEvents(page) {
  await page.evaluate(() => {
    window.__pushEvents = [];
  });
}

async function expectPushEvent(page, titleNeedle, bodyNeedle = '') {
  await page.waitForFunction(
    ({ titleNeedleArg, bodyNeedleArg }) => {
      const list = Array.isArray(window.__pushEvents) ? window.__pushEvents : [];
      return list.some((item) => {
        const title = String(item?.title || '');
        const body = String(item?.body || '');
        return title.includes(titleNeedleArg) && (!bodyNeedleArg || body.includes(bodyNeedleArg));
      });
    },
    { titleNeedleArg: titleNeedle, bodyNeedleArg: bodyNeedle },
    { timeout: 60000 }
  );
}

function installNotificationSpy(context) {
  return context.addInitScript(() => {
    window.__pushEvents = [];

    const pushEvent = (title, options) => {
      try {
        const list = Array.isArray(window.__pushEvents) ? window.__pushEvents : [];
        list.push({
          title: String(title || ''),
          body: String(options?.body || ''),
          url: String(options?.data?.url || ''),
        });
        window.__pushEvents = list;
      } catch {
        // ignore
      }
    };

    try {
      const originalShow = ServiceWorkerRegistration.prototype.showNotification;
      ServiceWorkerRegistration.prototype.showNotification = function patchedShowNotification(title, options) {
        pushEvent(title, options);
        if (typeof originalShow === 'function') {
          return originalShow.call(this, title, options);
        }
        return Promise.resolve();
      };
    } catch {
      // ignore
    }

    try {
      navigator.serviceWorker?.addEventListener?.('message', (event) => {
        const data = event?.data || {};
        if (data?.type !== 'push-debug-notification') return;
        pushEvent(data?.title, {
          body: data?.body,
          data: { url: data?.url },
        });
      });
    } catch {
      // ignore
    }

    try {
      const OriginalNotification = window.Notification;
      let permissionState = String(OriginalNotification?.permission || 'default');

      function WrappedNotification(title, options) {
        pushEvent(title, options);
        return new OriginalNotification(title, options);
      }
      Object.defineProperty(WrappedNotification, 'permission', {
        configurable: true,
        enumerable: true,
        get() {
          return permissionState;
        },
      });
      WrappedNotification.requestPermission = async (...args) => {
        const result = await OriginalNotification.requestPermission.call(OriginalNotification, ...args);
        permissionState = String(result || permissionState || 'default');
        return result;
      };
      WrappedNotification.prototype = OriginalNotification.prototype;
      window.Notification = WrappedNotification;
    } catch {
      // ignore
    }
  });
}

function findMatchCard(page, username) {
  const safeName = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const title = page.getByText(new RegExp(`^${safeName}(,|$)`, 'i')).first();
  return title.locator('xpath=ancestor::div[contains(@class,"overflow-hidden") and contains(@class,"rounded-lg")][1]');
}

test('message and like actions emit push notifications to users with push enabled', async () => {
  test.setTimeout(300000);
  test.skip(
    !senderEmail || !senderPassword || !senderUid || !receiverMessageEmail || !receiverMessagePassword || !receiverMessageUid || !receiverLikeEmail || !receiverLikePassword || !receiverLikeUid,
    'Push notification E2E credentials are missing.'
  );

  const senderUserDataDir = createUserDataDir('sender');
  const receiverMessageUserDataDir = createUserDataDir('receiver-message');
  const receiverLikeUserDataDir = createUserDataDir('receiver-like');

  const senderContext = await chromium.launchPersistentContext(senderUserDataDir, { headless: false });
  const receiverMessageContext = await chromium.launchPersistentContext(receiverMessageUserDataDir, { headless: false });
  const receiverLikeContext = await chromium.launchPersistentContext(receiverLikeUserDataDir, { headless: false });

  await Promise.all([
    senderContext.grantPermissions(['notifications'], { origin: baseURL }),
    receiverMessageContext.grantPermissions(['notifications'], { origin: baseURL }),
    receiverLikeContext.grantPermissions(['notifications'], { origin: baseURL }),
  ]);

  await Promise.all([
    installNotificationSpy(receiverMessageContext),
    installNotificationSpy(receiverLikeContext),
  ]);

  const senderPage = await senderContext.newPage();
  const receiverMessagePage = await receiverMessageContext.newPage();
  const receiverLikePage = await receiverLikeContext.newPage();

  const matchMessageId = buildMatchId(senderUid, receiverMessageUid);
  const messageText = uniqueLongMessage('mesaj bildirimi');

  try {
    await loginWithEmailPassword(receiverMessagePage, receiverMessageEmail, receiverMessagePassword);
    await enablePush(receiverMessagePage);
    await clearPushEvents(receiverMessagePage);

    await loginWithEmailPassword(receiverLikePage, receiverLikeEmail, receiverLikePassword);
    await enablePush(receiverLikePage);
    await clearPushEvents(receiverLikePage);

    await loginWithEmailPassword(senderPage, senderEmail, senderPassword);
    const sendResult = await sendMatchMessageViaApi(senderPage, matchMessageId, messageText);
    expect(sendResult?.ok).toBeTruthy();
    expect(String(sendResult?.messageId || '')).not.toBe('');

    await expectPushEvent(receiverMessagePage, 'Yeni mesaj');

    await senderPage.goto('/app/matches', { waitUntil: 'domcontentloaded' });
    const likeCard = findMatchCard(senderPage, receiverLikeUsername);
    await expect(likeCard).toBeVisible({ timeout: 30000 });
    await clearPushEvents(receiverLikePage);
    await likeCard.locator('[data-tutorial-id="match-like"]').first().click();

    await expectPushEvent(receiverLikePage, 'Yeni beğeni');
  } finally {
    await senderContext.close().catch(() => {});
    await receiverMessageContext.close().catch(() => {});
    await receiverLikeContext.close().catch(() => {});
    fs.rmSync(senderUserDataDir, { recursive: true, force: true });
    fs.rmSync(receiverMessageUserDataDir, { recursive: true, force: true });
    fs.rmSync(receiverLikeUserDataDir, { recursive: true, force: true });
  }
});