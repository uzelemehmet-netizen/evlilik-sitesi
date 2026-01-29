const fs = require('fs');

const src = fs.readFileSync('src/i18nResources/tr.js', 'utf8');

let line = 1;
let col = 0;
let i = 0;
let state = 'code';
let quote = null;
let braceDepth = 0;
let sawRootOpen = false;

function isRootOpenTokenAhead() {
  // cheap check: look back a bit for "export default" and ahead for "{" on same line
  return false;
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
      if (!sawRootOpen) sawRootOpen = true;
    } else if (ch === '}') {
      braceDepth--;
      if (sawRootOpen && braceDepth === 0) {
        console.log(`Root object closes at ~${line}:${col}`);
        process.exit(0);
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

console.log('Never closed early');
