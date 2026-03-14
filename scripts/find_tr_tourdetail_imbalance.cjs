const fs = require('fs');

const filePath = 'src/i18nResources/tr.js';
const src = fs.readFileSync(filePath, 'utf8');
const lines = src.split(/\r?\n/);

const START = 1833; // tourDetail starts here (1-based)
const END = 2369; // where we think it ends

let line = 1;
let col = 0;
let i = 0;
let state = 'code';
let quote = null;
let braceDepth = 0;

function logIfInteresting() {
  if (line > START && line < END && braceDepth === 1) {
    const text = (lines[line - 1] || '').trimEnd();
    console.log(`${line}: depth=1 :: ${text}`);
  }
}

logIfInteresting();

while (i < src.length) {
  const ch = src[i];
  const next = src[i + 1];

  if (ch === '\n') {
    if (state === 'lineComment') state = 'code';
    line++;
    col = 0;
    i++;
    logIfInteresting();
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

    if (ch === '{') braceDepth++;
    else if (ch === '}') braceDepth--;

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
