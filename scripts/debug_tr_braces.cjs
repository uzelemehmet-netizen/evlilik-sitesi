const fs = require('fs');

const src = fs.readFileSync('src/i18nResources/tr.js', 'utf8');

let line = 1;
let col = 0;
let i = 0;

let state = 'code';
let quote = null;
let braceDepth = 0;
let parenDepth = 0;
let bracketDepth = 0;
let templateDepth = 0;
let firstReturnedToZero = null;

const startLine = Number(process.argv[2] || 1);
const endLine = Number(process.argv[3] || 999999);

const shouldReport = (l) => l >= startLine && l <= endLine;

function report() {
  if (col === 0 && shouldReport(line)) {
    console.log(
      String(line).padStart(5) +
        ` depth { }=${braceDepth} ( )=${parenDepth} [ ]=${bracketDepth} tpl=${templateDepth}`
    );
  }
}

function fail(reason) {
  console.error(`FAIL @${line}:${col} ${reason}`);
  console.error('STATE', { state, quote, braceDepth, parenDepth, bracketDepth, templateDepth });
  process.exitCode = 2;
  process.exit();
}

report();

while (i < src.length) {
  const ch = src[i];
  const next = src[i + 1];

  if (ch === '\n') {
    if (state === 'lineComment') state = 'code';
    line++;
    col = 0;
    i++;
    report();
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
      templateDepth++;
      i++;
      continue;
    }

    if (ch === '{') braceDepth++;
    else if (ch === '}') {
      braceDepth--;
      if (braceDepth === 0 && firstReturnedToZero === null) {
        firstReturnedToZero = { line, col };
        console.error(`NOTE: braceDepth returned to 0 first time @${line}:${col}`);
      }
      if (braceDepth < 0) fail('braceDepth went negative');
    }
    else if (ch === '(') parenDepth++;
    else if (ch === ')') {
      parenDepth--;
      if (parenDepth < 0) fail('parenDepth went negative');
    }
    else if (ch === '[') bracketDepth++;
    else if (ch === ']') {
      bracketDepth--;
      if (bracketDepth < 0) fail('bracketDepth went negative');
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
      templateDepth--;
      state = templateDepth > 0 ? 'template' : 'code';
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

console.log('END', { braceDepth, parenDepth, bracketDepth, templateDepth });
