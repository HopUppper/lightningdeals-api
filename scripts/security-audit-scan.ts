import * as fs from 'fs';
import * as path from 'path';

interface LeakFinding {
  file: string;
  line: number;
  snippet: string;
  category: 'PUBLIC_FRONTEND' | 'PUBLIC_API_BACKEND' | 'ADMIN_PORTAL' | 'SERVER_INTERNAL_ROUTING';
  severity: 'CRITICAL_PUBLIC_LEAK' | 'HIGH_LEAK' | 'LEGITIMATE_ADMIN' | 'LEGITIMATE_INTERNAL';
  matchedPattern: string;
}

const PATTERNS = [
  /scalemax\.pro/i,
  /opusmax\.pro/i,
  /scalemax/i,
  /opus\s*max/i,
  /minimax/i,
  /abab-6\.5/i,
];

const IGNORED_DIRS = ['node_modules', '.git', 'dist', '.agents'];

function scanDir(dir: string, findings: LeakFinding[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_DIRS.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDir(fullPath, findings);
    } else if (
      entry.isFile() &&
      /\.(ts|tsx|js|jsx|html|json|md)$/i.test(entry.name) &&
      !entry.name.endsWith('.log') &&
      !entry.name.includes('security-audit-scan') &&
      !entry.name.includes('test-production-readiness-audit') &&
      !entry.name.includes('test-multi-provider-scalemax-suite')
    ) {
      scanFile(fullPath, findings);
    }
  }
}

function scanFile(filePath: string, findings: LeakFinding[]) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const normPath = filePath.replace(/\\/g, '/');

  // Categorize
  let category: LeakFinding['category'] = 'SERVER_INTERNAL_ROUTING';
  if (normPath.startsWith('src/pages/admin/')) {
    category = 'ADMIN_PORTAL';
  } else if (normPath.startsWith('src/') || normPath.startsWith('public/') || normPath.endsWith('.html')) {
    category = 'PUBLIC_FRONTEND';
  } else if (normPath.startsWith('server/')) {
    // Check if it's in public API routes (e.g. paymentRoutes, checkout, public models catalog)
    if (normPath.includes('paymentRoutes') || normPath.includes('plans.ts')) {
      category = 'PUBLIC_API_BACKEND';
    } else {
      category = 'SERVER_INTERNAL_ROUTING';
    }
  }

  lines.forEach((lineText, idx) => {
    for (const pat of PATTERNS) {
      if (pat.test(lineText)) {
        // Skip comments that are sanitizing or regex replacers
        const isSanitizerRegex = /replace\(\/.*scalemax/i.test(lineText) || /replace\(\/.*opusmax/i.test(lineText);

        let severity: LeakFinding['severity'] = 'LEGITIMATE_INTERNAL';
        if (category === 'PUBLIC_FRONTEND') {
          severity = 'CRITICAL_PUBLIC_LEAK';
        } else if (category === 'PUBLIC_API_BACKEND') {
          severity = 'HIGH_LEAK';
        } else if (category === 'ADMIN_PORTAL') {
          severity = 'LEGITIMATE_ADMIN';
        }

        findings.push({
          file: normPath,
          line: idx + 1,
          snippet: lineText.trim().slice(0, 140),
          category,
          severity,
          matchedPattern: pat.toString(),
        });
        break; // one match per line is enough
      }
    }
  });
}

function main() {
  const findings: LeakFinding[] = [];
  scanDir('.', findings);

  console.log(`=== REPOSITORY-WIDE VENDOR IDENTITY AUDIT SCAN ===`);
  console.log(`Total Findings: ${findings.length}\n`);

  const criticals = findings.filter((f) => f.severity === 'CRITICAL_PUBLIC_LEAK');
  const highs = findings.filter((f) => f.severity === 'HIGH_LEAK');
  const admins = findings.filter((f) => f.severity === 'LEGITIMATE_ADMIN');
  const internals = findings.filter((f) => f.severity === 'LEGITIMATE_INTERNAL');

  console.log(`🚨 CRITICAL PUBLIC FRONTEND LEAKS (${criticals.length}):`);
  criticals.forEach((f) => console.log(`  [${f.file}:${f.line}] ${f.snippet}`));

  console.log(`\n⚠️ HIGH SEVERITY PUBLIC API / BACKEND STOREFRONT LEAKS (${highs.length}):`);
  highs.forEach((f) => console.log(`  [${f.file}:${f.line}] ${f.snippet}`));

  console.log(`\n🔒 AUTHORIZED ADMIN PORTAL OCCURRENCES (${admins.length}) (Must remain for admin control):`);
  const adminFiles = Array.from(new Set(admins.map((f) => f.file)));
  adminFiles.forEach((file) => {
    const count = admins.filter((f) => f.file === file).length;
    console.log(`  - ${file} (${count} references)`);
  });

  console.log(`\n⚙️ SERVER INTERNAL OCCURRENCES (${internals.length}) (Gateway routing, proxying & sanitizers):`);
  const internalFiles = Array.from(new Set(internals.map((f) => f.file)));
  internalFiles.forEach((file) => {
    const count = internals.filter((f) => f.file === file).length;
    console.log(`  - ${file} (${count} references)`);
  });
}

main();
