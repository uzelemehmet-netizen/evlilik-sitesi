import { chromium } from 'playwright';

const url = process.env.TIKTOK_DEBUG_URL || 'http://127.0.0.1:5173';

const isTikTokUrl = (u) => {
  const s = String(u || '');
  return s.includes('analytics.tiktok.com') || s.includes('tiktok.com/i18n/pixel');
};

const main = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const hits = {
    requests: [],
    failed: [],
    console: [],
  };

  page.on('console', (msg) => {
    hits.console.push({ type: msg.type(), text: msg.text() });
  });

  page.on('request', (req) => {
    const u = req.url();
    if (isTikTokUrl(u)) hits.requests.push({ method: req.method(), url: u, resourceType: req.resourceType() });
  });

  page.on('requestfailed', (req) => {
    const u = req.url();
    if (isTikTokUrl(u)) hits.failed.push({ url: u, errorText: req.failure()?.errorText || '' });
  });

  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  const status = resp?.status();

  // Give async pixel loader a moment.
  await page.waitForTimeout(2500);

  const ttqType = await page.evaluate(() => typeof window.ttq);

  // Try a manual event.
  await page.evaluate(() => {
    try {
      window.ttq?.track?.('TestEvent', { source: 'playwright' });
    } catch {
      // ignore
    }
  });

  await page.waitForTimeout(1500);

  // Print summary
  const out = {
    url,
    httpStatus: status ?? null,
    ttqType,
    tiktokRequests: hits.requests,
    tiktokFailed: hits.failed,
    consoleErrors: hits.console.filter((c) => c.type === 'error'),
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(out, null, 2));

  await browser.close();
};

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('[tiktok-debug] failed', e);
  process.exitCode = 1;
});
