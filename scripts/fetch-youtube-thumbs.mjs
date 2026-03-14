import fs from 'node:fs';
import path from 'node:path';

import { youtubeVideosTr } from '../src/data/youtube/tr.js';
import { youtubeVideosEn } from '../src/data/youtube/en.js';
import { youtubeVideosId } from '../src/data/youtube/id.js';

const projectRoot = path.resolve(process.cwd());
const outDir = path.join(projectRoot, 'public', 'youtube-thumbs');

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const quiet = args.has('--quiet');

const log = (...a) => {
  if (!quiet) console.log(...a);
};

const warn = (...a) => {
  if (!quiet) console.warn(...a);
};

function safeReadText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function extractYouTubeIdsFromText(text) {
  const t = String(text || '');
  if (!t) return [];

  const ids = new Set();

  // Matches:
  // - youtu.be/<id>
  // - youtube.com/watch?v=<id>
  // - youtube.com/embed/<id>
  // - youtube.com/shorts/<id>
  const re = /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,32})/g;
  for (const m of t.matchAll(re)) {
    const id = (m && m[1] ? String(m[1]) : '').trim();
    if (id) ids.add(id);
  }

  return Array.from(ids);
}

async function fetchImageBuffer(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        // Some CDNs behave better with a UA.
        'user-agent': 'evlilik-proje-thumb-fetch/1.0',
      },
    });

    if (!res.ok) return null;

    const contentType = String(res.headers.get('content-type') || '').toLowerCase();
    if (!contentType.startsWith('image/')) return null;

    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);

    // Guard against tiny/invalid responses.
    if (!buf || buf.length < 5_000) return null;

    return { buf, contentType };
  } catch {
    return null;
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const ids = new Set();
  for (const v of [...youtubeVideosTr, ...youtubeVideosEn, ...youtubeVideosId]) {
    const id = String(v?.videoId || '').trim();
    if (id) ids.add(id);
  }

  // Also scan a couple of pages for hard-coded YouTube URLs.
  for (const rel of ['src/pages/MatchmakingHub.jsx', 'src/pages/Wedding.jsx', 'src/pages/YouTube.jsx']) {
    const abs = path.join(projectRoot, rel);
    for (const id of extractYouTubeIdsFromText(safeReadText(abs))) ids.add(id);
  }

  // Optional extra IDs: YOUTUBE_THUMB_IDS="id1,id2,id3"
  const extraRaw = String(process.env.YOUTUBE_THUMB_IDS || '').trim();
  if (extraRaw) {
    for (const part of extraRaw.split(/[\s,]+/g)) {
      const id = String(part || '').trim();
      if (id) ids.add(id);
    }
  }

  const allIds = Array.from(ids).sort();
  if (!allIds.length) {
    warn('[youtube-thumbs] No video IDs found; skipping.');
    return;
  }

  log(`[youtube-thumbs] Found ${allIds.length} unique videoId(s). Output: ${path.relative(projectRoot, outDir)}`);

  const names = ['maxresdefault', 'hqdefault', 'mqdefault', 'default'];
  const hosts = ['https://i.ytimg.com/vi', 'https://img.youtube.com/vi'];

  let okCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const videoId of allIds) {
    const dest = path.join(outDir, `${videoId}.jpg`);
    const relDest = path.relative(projectRoot, dest);

    if (!force && fs.existsSync(dest)) {
      skipCount++;
      continue;
    }

    let saved = false;
    for (const name of names) {
      for (const host of hosts) {
        const url = `${host}/${videoId}/${name}.jpg`;
        const img = await fetchImageBuffer(url);
        if (!img) continue;

        try {
          fs.writeFileSync(dest, img.buf);
          log(`[youtube-thumbs] Saved ${relDest} (${img.buf.length} bytes) <- ${url}`);
          okCount++;
          saved = true;
        } catch (e) {
          warn(`[youtube-thumbs] Failed writing ${relDest}:`, e?.message || e);
        }

        break;
      }
      if (saved) break;
    }

    if (!saved) {
      failCount++;
      warn(`[youtube-thumbs] WARN: Could not fetch thumbnail for videoId=${videoId}`);
    }
  }

  log(`[youtube-thumbs] Done. ok=${okCount} skipped=${skipCount} failed=${failCount}`);

  // Never fail the build: UI still has external + placeholder fallbacks.
  // (If you want strict mode later, we can add --strict to exit(1) on failed.)
}

await main();
