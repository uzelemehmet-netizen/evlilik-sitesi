const fs = require('fs');

const src = fs.readFileSync('src/i18nResources/tr.js', 'utf8');

let line = 1;
let col = 0;
let i = 0;
let state = 'code';
let quote = null;
let braceDepth = 0;

function fail(msg) {
  console.error(msg);
  process.exitCode = 1;
  process.exit();
}

while (i < src.length) {
  const ch = src[i];
  const next = src[i + 1];

  if (ch === '\n') {
    if (state === 'lineComment') state = 'code';
    line++;
    col = 0;
    i++;
    continue;
  }
  col++;

  if (state === 'code') {
    if (ch === '/' && next === '/') {
      state = 'lineComment';
      i += 2;
      col++;
      continue;
    }
    if (ch === '/' && next === '*') {
      state = 'blockComment';
      i += 2;
      col++;
      continue;
    }

    if (ch === "'" || ch === '"') {
      state = 'string';
      quote = ch;
      i++;
      continue;
    }
    if (ch === '`') {
      state = 'template';
      i++;
      continue;
    }

    if (ch === '{') {
      braceDepth++;
    } else if (ch === '}') {
      braceDepth--;
      if (braceDepth < 0) {
        fail(`braceDepth went negative at ${line}:${col}`);
      }
    }

    i++;
    continue;
  }

  if (state === 'string') {
    if (ch === '\\') {
      i += 2;
      col++;
      continue;
    }
    if (ch === quote) {
      state = 'code';
      quote = null;
      i++;
      continue;
    }
    i++;
    continue;
  }

  if (state === 'template') {
    if (ch === '\\') {
      i += 2;
      col++;
      continue;
    }
    if (ch === '`') {
      state = 'code';
      i++;
      continue;
    }
    if (ch === '$' && next === '{') {
      state = 'code';
      i += 2;
      col++;
      continue;
    }
    i++;
    continue;
  }

  if (state === 'lineComment') {
    i++;
    continue;
  }

  if (state === 'blockComment') {
    if (ch === '*' && next === '/') {
      state = 'code';
      i += 2;
      col++;
      continue;
    }
    i++;
    continue;
  }
}

if (braceDepth !== 0) {
  fail(`braceDepth ended at ${braceDepth} (expected 0)`);
}

console.log('braces ok');
