import { chromium } from 'playwright';

const baseURL = process.env.PERF_BASE_URL || 'http://127.0.0.1:4173/';

const argv = process.argv.slice(2);
const argSet = new Set(argv);
const jsOff = argSet.has('--jsOff');
const blockSw = argSet.has('--blockSw');
const wait = argv.includes('--wait') ? Number(argv[argv.indexOf('--wait') + 1]) : 2000;

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-gpu', '--disable-software-rasterizer', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    javaScriptEnabled: !jsOff,
    serviceWorkers: blockSw ? 'block' : 'allow',
  });

  const page = await context.newPage();

  page.on('crash', () => {
    console.log('PAGE_CRASH');
  });

  try {
    const resp = await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    console.log('STATUS', resp?.status?.());
    console.log('TITLE', await page.title());
    await page.waitForTimeout(wait);
    console.log('STILL_ALIVE');
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((e) => {
  console.error('SMOKE_FAIL', e);
  process.exitCode = 1;
});
