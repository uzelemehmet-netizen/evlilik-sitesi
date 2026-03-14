import { chromium } from 'playwright';
import waitOn from 'wait-on';

function getArgValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx < 0) return null;
  const v = process.argv[idx + 1];
  if (!v || v.startsWith('--')) return null;
  return v;
}

function hasArg(name) {
  return process.argv.includes(name);
}

function parseCsvArg(name) {
  const raw = getArgValue(name);
  if (!raw) return null;
  const items = String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items : null;
}

const baseURL = (getArgValue('--url') || process.env.PERF_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');

const profiles = [
  {
    id: 'desktop',
    label: 'Desktop (no throttling)',
    mode: 'desktop',
  },
  {
    id: 'mobile',
    label: 'Mobile viewport (no throttling)',
    mode: 'mobile',
  },
];

const pagesToMeasure = [
  { path: '/', label: 'Home /' },
  { path: '/eslestirme', label: 'Matchmaking /eslestirme' },
  { path: '/login', label: 'Login /login' },
];

const ms = (n) => (Number.isFinite(n) ? Math.round(n) : null);
const fmtMs = (n) => (n == null ? '-' : `${n}ms`);
const fmtBytes = (b) => {
  if (!Number.isFinite(b)) return '-';
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

const shortUrl = (u) => {
  try {
    const url = new URL(u);
    const p = url.pathname + (url.search ? url.search.slice(0, 80) : '');
    return `${url.origin}${p}`;
  } catch {
    return String(u || '').slice(0, 160);
  }
};

function safeOrigin(u) {
  try {
    const url = new URL(u);
    return url.origin;
  } catch {
    return '';
  }
}

function isHttpUrl(u) {
  try {
    const url = new URL(u);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildNetworkTracker({ page, baseOrigin }) {
  let reqCount = 0;
  let pending = [];
  let records = [];
  let failures = [];
  let navStartAt = Date.now();
  const startAtByRequest = new Map();

  const onRequest = (req) => {
    reqCount += 1;
    try {
      startAtByRequest.set(req, Date.now());
    } catch {
      // ignore
    }
  };

  const onRequestFinished = (req) => {
    pending.push(
      (async () => {
        const url = req.url();
        const res = await req.response().catch(() => null);
        const status = res ? res.status() : null;
        const resourceType = req.resourceType();

        const startedAt = startAtByRequest.get(req) || null;
        const finishedAt = Date.now();
        const durationMs = startedAt != null ? ms(finishedAt - startedAt) : null;
        const finishedWallMs = ms(finishedAt - navStartAt);

        const origin = safeOrigin(url);
        const isThirdParty = !!origin && origin !== baseOrigin;

        records.push({
          url,
          origin,
          isThirdParty,
          resourceType,
          status,
          durationMs,
          finishedWallMs,
        });
      })()
    );
  };

  const onRequestFailed = (req) => {
    const url = req.url();
    const origin = safeOrigin(url);
    failures.push({
      url,
      origin,
      resourceType: req.resourceType(),
      errorText: req.failure()?.errorText || '',
      failedWallMs: ms(Date.now() - navStartAt),
    });
  };

  page.on('request', onRequest);
  page.on('requestfinished', onRequestFinished);
  page.on('requestfailed', onRequestFailed);

  const reset = () => {
    reqCount = 0;
    pending = [];
    records = [];
    failures = [];
    navStartAt = Date.now();
    startAtByRequest.clear();
  };

  const flush = async () => {
    const p = pending;
    pending = [];
    if (!p.length) return;
    await Promise.allSettled(p);
  };

  const summarize = ({ loadResolvedWallMs }) => {
    const loadResolved = Number.isFinite(loadResolvedWallMs) ? loadResolvedWallMs : null;

    const sortedByFinish = records
      .filter((r) => r.finishedWallMs != null)
      .sort((a, b) => (a.finishedWallMs ?? 0) - (b.finishedWallMs ?? 0));

    const loadBlocker =
      loadResolved != null
        ? [...sortedByFinish].reverse().find((r) => (r.finishedWallMs ?? 0) <= loadResolved + 5) || null
        : null;

    const slowestThirdParty = records
      .filter((r) => r.isThirdParty && r.durationMs != null)
      .sort((a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0))
      .slice(0, 3);

    const slowestFirstParty = records
      .filter((r) => !r.isThirdParty && r.durationMs != null)
      .sort((a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0))
      .slice(0, 3);

    return {
      requests: reqCount,
      failures: failures
        // Context kapanırken iptal olanları gürültü yapmasın
        .filter((f) => !String(f.errorText || '').includes('net::ERR_ABORTED'))
        .slice(0, 5),
      loadBlocker,
      slowestThirdParty,
      slowestFirstParty,
    };
  };

  return { reset, flush, summarize };
}

async function collectTiming(page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')?.[0];
    const paint = performance.getEntriesByType('paint') || [];
    const fcp = paint.find((e) => e.name === 'first-contentful-paint');

    const out = {
      nav: nav ? {
        startTime: nav.startTime,
        domContentLoadedEventEnd: nav.domContentLoadedEventEnd,
        loadEventEnd: nav.loadEventEnd,
        responseStart: nav.responseStart,
        requestStart: nav.requestStart,
        connectEnd: nav.connectEnd,
        secureConnectionStart: nav.secureConnectionStart,
        transferSize: nav.transferSize,
        encodedBodySize: nav.encodedBodySize,
        decodedBodySize: nav.decodedBodySize,
      } : null,
      fcp: fcp ? fcp.startTime : null,
    };

    return out;
  });
}

async function measureColdWarm({ browser, profile, url, label, explain = false, blockThirdParty = false, baseOrigin }) {
  const context = await browser.newContext({
    viewport: profile.mode === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 720 },
    userAgent:
      profile.mode === 'mobile'
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
        : undefined,
    // Playwright headless ortamında SW bazen renderer crash tetikleyebiliyor.
    // İlk ziyaret (ad click) cold-load ölçümü için SW'yi bloklamak yeterince yakındır.
    serviceWorkers: 'block',
  });

  if (blockThirdParty) {
    await context.route('**/*', (route) => {
      const u = route.request().url();
      if (!isHttpUrl(u)) return route.continue();
      const origin = safeOrigin(u);
      if (origin && origin !== baseOrigin) return route.abort();
      return route.continue();
    });
  }

  const page = await context.newPage();

  const tracker = buildNetworkTracker({ page, baseOrigin });

  const runNav = async ({ runLabel, navFn }) => {
    tracker.reset();
    const startedAt = Date.now();
    await navFn();
    const loadResolvedAt = Date.now();
    await page.waitForTimeout(250);
    await tracker.flush();
    const endedAt = Date.now();
    const timing = await collectTiming(page);
    const net = explain ? tracker.summarize({ loadResolvedWallMs: loadResolvedAt - startedAt }) : null;

    return {
      label: `${label} (${runLabel})`,
      url,
      profile: profile.label,
      requests: net?.requests ?? null,
      fcpMs: timing?.fcp != null ? ms(timing.fcp) : null,
      dclMs: timing?.nav?.domContentLoadedEventEnd != null ? ms(timing.nav.domContentLoadedEventEnd) : null,
      loadMs: timing?.nav?.loadEventEnd != null ? ms(timing.nav.loadEventEnd) : null,
      wallMs: endedAt - startedAt,
      transferBytesNav: timing?.nav?.transferSize ?? null,
      encodedDataLength: null,
      net,
    };
  };

  const cold = await runNav({
    runLabel: 'cold',
    navFn: async () => page.goto(url, { waitUntil: 'load', timeout: 60_000 }),
  });
  const warm = await runNav({
    runLabel: 'warm',
    navFn: async () => page.reload({ waitUntil: 'load', timeout: 60_000 }),
  });

  await context.close();
  return { cold, warm };
}

function printResult(r) {
  // eslint yok: konsol tablosu
  console.log(
    [
      `- ${r.profile} → ${r.label}`,
      `  FCP: ${fmtMs(r.fcpMs)} | DCL: ${fmtMs(r.dclMs)} | Load: ${fmtMs(r.loadMs)} | Wall: ${fmtMs(r.wallMs)}`,
      `  Requests: ${r.requests ?? '-'} | Transfer(nav): ${fmtBytes(r.transferBytesNav)}`,
    ].join('\n')
  );

  if (r.net) {
    const blocker = r.net.loadBlocker;
    if (blocker) {
      console.log(
        `  Load blocker: ${blocker.resourceType} ${blocker.isThirdParty ? '(3p)' : '(1p)'} ${fmtMs(blocker.durationMs)} ${shortUrl(blocker.url)}`
      );
    }
    if (Array.isArray(r.net.slowestThirdParty) && r.net.slowestThirdParty.length) {
      console.log(
        `  Slowest 3p: ${r.net.slowestThirdParty
          .map((x) => `${x.resourceType}:${fmtMs(x.durationMs)} ${shortUrl(x.url)}`)
          .join(' | ')}`
      );
    }
    if (Array.isArray(r.net.failures) && r.net.failures.length) {
      console.log(
        `  Failed: ${r.net.failures.map((f) => `${f.resourceType} ${shortUrl(f.url)} ${f.errorText || ''}`.trim()).join(' | ')}`
      );
    }
  }
}

async function main() {
  const explain = hasArg('--explain') || hasArg('--net') || hasArg('--explainLoad');
  const blockThirdParty = hasArg('--blockThirdParty') || hasArg('--block3p');
  const profileFilter = parseCsvArg('--profiles');
  const pathFilter = parseCsvArg('--paths');

  await waitOn({ resources: [baseURL], timeout: 60_000 });

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-dev-shm-usage',
      '--no-sandbox',
    ],
  });

  console.log(`PERF baseURL: ${baseURL}`);
  if (blockThirdParty) console.log('PERF mode: blockThirdParty=on');
  if (explain) console.log('PERF mode: explainLoad=on');

  const baseOrigin = new URL(baseURL).origin;

  const profilesToRun = profileFilter
    ? profiles.filter((p) => profileFilter.includes(p.id) || profileFilter.includes(p.mode) || profileFilter.includes(p.label))
    : profiles;

  const pagesToRun = pathFilter
    ? pagesToMeasure.filter((p) => pathFilter.includes(p.path) || pathFilter.includes(p.label))
    : pagesToMeasure;

  for (const profile of profilesToRun) {
    for (const p of pagesToRun) {
      const url = new URL(p.path, baseURL).toString();

      const { cold, warm } = await measureColdWarm({ browser, profile, url, label: p.label, explain, blockThirdParty, baseOrigin });
      printResult(cold);
      printResult(warm);
    }
  }

  await browser.close();
}

main().catch((e) => {
  console.error('perf-check failed:', e);
  process.exitCode = 1;
});
