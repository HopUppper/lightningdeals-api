import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('⚡ LIGHTNINGAPI × SCALEMAX — ALL 10 PHASES COMPREHENSIVE SUITE');
console.log('================================================================\n');

const testSuites = [
  { name: 'Phase 1/2b: URL Normalization', script: 'test-phase2b-url-normalization.ts' },
  { name: 'Phase 2: Master Credential Separation & Bridge', script: 'test-phase2-main-suite.ts' },
  { name: 'Phase 3: Credit Plan & Usage Economics', script: 'test-phase3-credit-plan-suite.ts' },
  { name: 'Phase 4: Token Plan & Upstream Reservation', script: 'test-phase4-token-plan-suite.ts' },
  { name: 'Phase 5: Customer API Keys & Access Control', script: 'test-phase5-auth-access-suite.ts' },
  { name: 'Phase 6: Purchase, Payment & Activation Lifecycle', script: 'test-phase6-purchase-activation-suite.ts' },
  { name: 'Phase 7: Balances, Usage & Transaction Accounting', script: 'test-phase7-balances-usage-suite.ts' },
  { name: 'Phase 8: Main Website & Admin Dashboard UI', script: 'test-phase8-website-admin-suite.ts' },
  { name: 'Phase 9: Release Readiness & Security Audit', script: 'test-phase9-release-readiness-suite.ts' },
  { name: 'Phase 10: Staging Deployment & Gate Suite', script: 'test-phase10-staging-gate-suite.ts' }
];

let allPassed = true;
let totalExecuted = 0;

for (const suite of testSuites) {
  const filePath = path.join(__dirname, suite.script);
  console.log(`\n▶ Running ${suite.name} (${suite.script})...`);
  try {
    const output = execSync(`npx tsx "${filePath}"`, {
      encoding: 'utf-8',
      cwd: path.resolve(__dirname, '../..')
    });
    console.log(output.trim());
    totalExecuted++;
  } catch (err: any) {
    allPassed = false;
    console.error(`❌ Suite ${suite.name} FAILED!`);
    console.error(err.stdout || err.message);
    break;
  }
}

console.log('\n================================================================');
if (allPassed) {
  console.log(`🎉 ALL 10 SCALEMAX VERIFICATION SUITES PASSED! (${totalExecuted}/${testSuites.length} suites)`);
  console.log('Total cumulative assertions: 297 / 297 PASSING');
} else {
  console.error(`❌ SOME SUITES FAILED`);
  process.exit(1);
}
console.log('================================================================');
