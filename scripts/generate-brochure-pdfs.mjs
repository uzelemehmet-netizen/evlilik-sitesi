import http from "node:http";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { chromium } from "playwright";

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(projectRoot, "public");
const docsDir = path.join(publicDir, "docs");
const outDir = path.join(docsDir, "pdf");

const gitDiffDisableFlagPath = path.join(projectRoot, ".cache", "brochure-pdf-git-diff.disabled");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
};

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const normalized = path.posix
    .normalize(decoded)
    .replace(/^\/+/, "")
    .replace(/\0/g, "");
  const fsPath = path.join(root, ...normalized.split("/"));
  const resolved = path.resolve(fsPath);
  if (!resolved.startsWith(path.resolve(root))) {
    return null;
  }
  return resolved;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function startStaticServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      let reqPath = url.pathname;
      if (reqPath.endsWith("/")) reqPath += "index.html";

      const target = safeJoin(publicDir, reqPath);
      if (!target) {
        res.writeHead(400);
        res.end("Bad Request");
        return;
      }

      let finalPath = target;
      if (!(await fileExists(finalPath))) {
        // fallback: try .html for extensionless routes
        if (!path.extname(finalPath) && (await fileExists(finalPath + ".html"))) {
          finalPath = finalPath + ".html";
        } else {
          res.writeHead(404);
          res.end("Not Found");
          return;
        }
      }

      const ext = path.extname(finalPath).toLowerCase();
      const mime = MIME[ext] || "application/octet-stream";
      const data = await fs.readFile(finalPath);
      res.writeHead(200, { "Content-Type": mime, "Cache-Control": "no-store" });
      res.end(data);
    } catch (err) {
      res.writeHead(500);
      res.end("Internal Server Error");
      // eslint-disable-next-line no-console
      console.error("[pdf-server]", err);
    }
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Failed to start server");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  return { server, baseUrl };
}

async function listBrochurePages() {
  const entries = await fs.readdir(docsDir);

  const pages = [];

  // V2 tur broşürleri
  for (const name of entries) {
    if (/^tur-brosuru-.*-v2\.html$/i.test(name)) {
      pages.push({
        inPath: `/docs/${name}`,
        outName: name.replace(/\.html$/i, ".pdf"),
      });
    }
  }

  // Bali özel broşürü (legacy)
  if (entries.includes("bali-tatil-brosuru.html")) {
    pages.push({ inPath: "/docs/bali-tatil-brosuru.html", outName: "bali-tatil-brosuru.pdf" });
  }

  // Ön kayıt bilgi paketi (opsiyonel ama sitede PDF diye geçiyor)
  if (entries.includes("on-kayit-bilgi-paketi.html")) {
    pages.push({ inPath: "/docs/on-kayit-bilgi-paketi.html", outName: "on-kayit-bilgi-paketi.pdf" });
  }

  pages.sort((a, b) => a.outName.localeCompare(b.outName));
  return pages;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function isStrictMode() {
  return process.argv.includes("--strict") || process.env.BROCHURE_PDF_STRICT === "1";
}

function isForceMode() {
  return process.argv.includes("--force") || process.env.BROCHURE_PDF_FORCE === "1";
}

function isSkipAllMode() {
  return process.argv.includes("--skip") || process.env.BROCHURE_PDF_SKIP === "1";
}

function isResetGitDiffDisableFlagMode() {
  return process.argv.includes("--reset-git-diff");
}

function getGitDiffTimeoutMs() {
  const fromEnv = Number(process.env.BROCHURE_PDF_GIT_DIFF_TIMEOUT_MS);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return Math.floor(fromEnv);
  return 1500;
}

function isGitDiffModeDisabled() {
  return process.argv.includes("--no-git-diff") || process.env.BROCHURE_PDF_GIT_DIFF === "0";
}

async function isGitDiffTemporarilyDisabled() {
  try {
    await fs.access(gitDiffDisableFlagPath);
    return true;
  } catch {
    return false;
  }
}

function isRelevantPdfSource(file) {
  const p = String(file || "").replace(/\\/g, "/").replace(/^\//, "");
  if (!p) return false;
  // PDF kaynakları (HTML/CSS/asset) burada toplanıyor
  if (!p.startsWith("public/docs/")) return false;

  // Üretilen çıktı klasörü ve PDF dosyalarını kaynak sayma
  if (p.startsWith("public/docs/pdf/")) return false;
  if (p.toLowerCase().endsWith(".pdf")) return false;

  return true;
}

async function getGitChangedFiles() {
  // Çalışma ağacı (unstaged) + staged + untracked
  const out = new Set();
  const timeout = getGitDiffTimeoutMs();

  if (await isGitDiffTemporarilyDisabled()) return [];

  try {
    const { stdout } = await execFileAsync(
      "git",
      ["rev-parse", "--is-inside-work-tree"],
      {
        cwd: projectRoot,
        windowsHide: true,
        timeout,
      }
    );
    if (!String(stdout || "").trim().startsWith("true")) return [];
  } catch {
    return [];
  }

  const cmds = [
    ["diff", "--name-only"],
    ["diff", "--name-only", "--cached"],
    ["ls-files", "--others", "--exclude-standard"],
  ];

  for (const args of cmds) {
    try {
      const { stdout } = await execFileAsync("git", args, {
        cwd: projectRoot,
        windowsHide: true,
        timeout,
      });
      String(stdout || "")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((f) => out.add(f));
    } catch {
      // Git bu ortamda yavaş/kitleniyor olabilir: bir sonraki oturuma kadar devre dışı bırak.
      try {
        await fs.mkdir(path.dirname(gitDiffDisableFlagPath), { recursive: true });
        await fs.writeFile(
          gitDiffDisableFlagPath,
          `disabledAt=${new Date().toISOString()}\nreason=git-command-failed-or-timed-out\n`,
          "utf8"
        );
        // eslint-disable-next-line no-console
        console.warn(
          `[pdf] Git diff kontrolü yavaş/başarısız oldu (timeout=${timeout}ms). ` +
            "Bu kontrol bir sonraki yeniden açmaya kadar devre dışı bırakıldı. " +
            "Tekrar açmak için: node scripts/generate-brochure-pdfs.mjs --reset-git-diff"
        );
      } catch {
        // ignore
      }
      return [];
    }
  }

  return Array.from(out);
}

async function isUpToDate({ inFsPath, outFsPath, extraDeps = [] }) {
  try {
    const [inStat, outStat] = await Promise.all([fs.stat(inFsPath), fs.stat(outFsPath)]);
    const inTime = inStat.mtimeMs || 0;
    let latestSourceTime = inTime;

    for (const dep of extraDeps) {
      try {
        const st = await fs.stat(dep);
        latestSourceTime = Math.max(latestSourceTime, st.mtimeMs || 0);
      } catch {
        // ignore missing deps
      }
    }

    const outTime = outStat.mtimeMs || 0;
    return outTime >= latestSourceTime;
  } catch {
    return false;
  }
}

function isPlaywrightSetupError(err) {
  const msg = String(err?.message || err || "");
  return (
    msg.includes("Executable doesn't exist") ||
    msg.includes("browserType.launch") ||
    msg.includes("playwright install") ||
    msg.includes(".cache/ms-playwright") ||
    msg.includes("error while loading shared libraries") ||
    msg.includes("libnspr4.so") ||
    msg.includes("libnss3.so")
  );
}

async function main() {
  await ensureDir(outDir);

  if (isResetGitDiffDisableFlagMode()) {
    try {
      await fs.unlink(gitDiffDisableFlagPath);
      // eslint-disable-next-line no-console
      console.log("[pdf] Git diff disable flag temizlendi.");
    } catch {
      // ignore
    }
  }

  const pages = await listBrochurePages();
  if (pages.length === 0) {
    // eslint-disable-next-line no-console
    console.log("[pdf] No brochure pages found under public/docs");
    return;
  }

  if (isSkipAllMode()) {
    // eslint-disable-next-line no-console
    console.log('[pdf] Skipped (BROCHURE_PDF_SKIP=1 or --skip)');
    return;
  }

  const strict = isStrictMode();
  const force = isForceMode();

  // Eğer dokümanlarda değişiklik yoksa Playwright başlatmadan çık (performans için)
  if (!force && !isGitDiffModeDisabled() && !(await isGitDiffTemporarilyDisabled())) {
    const changed = await getGitChangedFiles();
    const relevant = changed.filter(isRelevantPdfSource);
    if (changed.length > 0 && relevant.length === 0) {
      // eslint-disable-next-line no-console
      console.log('[pdf] Skipping: no changes under public/docs (git diff clean for PDFs)');
      return;
    }
  }

  let server;
  let baseUrl;
  let browser;
  let context;

  try {
    try {
      browser = await chromium.launch();
      context = await browser.newContext({ locale: "tr-TR" });
    } catch (err) {
      if (isPlaywrightSetupError(err) && !strict) {
        // eslint-disable-next-line no-console
        console.warn(
          "[pdf] Playwright tarayıcısı bulunamadı; PDF üretimi atlandı. (Build kırılmadı)\n" +
            "[pdf] Çözüm (tarayıcı): npx playwright install chromium\n" +
            "[pdf] Çözüm (Linux bağımlılıkları): sudo npx playwright install-deps chromium\n" +
            "[pdf] Alternatif: npm run playwright:install (ve WSL/Linux için npm run playwright:install:deps)\n" +
            "[pdf] Zorunlu kılmak için: node scripts/generate-brochure-pdfs.mjs --strict (veya BROCHURE_PDF_STRICT=1)"
        );
        return;
      }
      throw err;
    }

    ({ server, baseUrl } = await startStaticServer());

    // eslint-disable-next-line no-console
    console.log(
      `[pdf] Generating brochure PDFs into ${path.relative(projectRoot, outDir)} (force=${force ? 'yes' : 'no'})`
    );

    for (const item of pages) {
      const page = await context.newPage();
      const url = `${baseUrl}${item.inPath}`;
      const outPath = path.join(outDir, item.outName);

      const inFsPath = safeJoin(publicDir, item.inPath);
      const cssDep = path.join(docsDir, 'tur-brosuru-v2.css');

      if (!force && inFsPath && (await fileExists(outPath))) {
        const ok = await isUpToDate({ inFsPath, outFsPath: outPath, extraDeps: [cssDep] });
        if (ok) {
          // eslint-disable-next-line no-console
          console.log(`[pdf] Skipping up-to-date: ${item.outName}`);
          await page.close();
          continue;
        }
      }

      // eslint-disable-next-line no-console
      console.log(`[pdf] ${item.inPath} -> docs/pdf/${item.outName}`);

      await page.goto(url, { waitUntil: "networkidle" });

      // A4 + arkaplanlar açık; CSS print ayarları devreye girsin
      await page.emulateMedia({ media: "print" });
      await page.pdf({
        path: outPath,
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });

      await page.close();
    }
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[pdf] Failed:", err);
  process.exitCode = 1;
});
