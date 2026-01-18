import fs from 'fs';
const path = 'index.html';

let content = fs.readFileSync(path, 'utf-8');
content = content.replace('  </head>', '    <meta name="probely-verification" content="ffba07fc-80e6-4fdb-a364-8e2700305878" />\n  </head>');
fs.writeFileSync(path, content, 'utf-8');
console.log('✓ Probely metatagı eklendi');
