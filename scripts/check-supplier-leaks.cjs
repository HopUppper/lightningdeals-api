const fs = require('fs');
const path = require('path');

function searchDir(dir, filter) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'admin' && f !== 'node_modules' && f !== '.git' && f !== 'dist' && f !== 'brain') {
        results = results.concat(searchDir(full, filter));
      }
    } else if (filter(full)) {
      results.push(full);
    }
  }
  return results;
}

const allFiles = [
  ...searchDir('src/pages', f => f.endsWith('.tsx') || f.endsWith('.ts')),
  ...searchDir('src/components', f => f.endsWith('.tsx') || f.endsWith('.ts')),
  ...searchDir('src/pages/dashboard', f => f.endsWith('.tsx') || f.endsWith('.ts')),
  'server/gateway.ts',
  'server/tools.ts',
  'server/index.ts',
  'server/keyService.ts'
];

console.log('Total files to inspect:', allFiles.length);

for (const file of allFiles) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  const matches = [];
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/scalemax|opusmax/i.test(line)) {
      matches.push({ line: idx + 1, text: line.trim() });
    }
  });
  if (matches.length > 0) {
    console.log('\n=== FILE: ' + file + ' (' + matches.length + ' matches) ===');
    matches.slice(0, 10).forEach(m => console.log('  L' + m.line + ': ' + m.text));
  }
}
