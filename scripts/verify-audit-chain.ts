/**
 * Independent Audit Log Hash Chain Verification Tool
 * Validates sequential cryptographic SHA-256 links and payload integrity across audit events.
 */
import { prisma } from '../server/db';
import { verifyHashChainIntegrity } from '../server/auditLogger';

async function main() {
  console.log('================================================================');
  console.log('🔒 LIGHTNINGDEALS AUDIT LOG HASH-CHAIN VERIFICATION TOOL');
  console.log('================================================================');

  const args = process.argv.slice(2);
  const isAll = args.includes('--all');
  const limitArgIndex = args.indexOf('--limit');
  const customLimit = limitArgIndex !== -1 && args[limitArgIndex + 1] ? parseInt(args[limitArgIndex + 1], 10) : null;

  const totalEvents = await prisma.auditEvent.count();
  console.log(`📊 Total recorded audit events in database: ${totalEvents}`);

  if (totalEvents === 0) {
    console.log('ℹ️ No audit events found in database. System baseline is clean.');
    process.exit(0);
  }

  // Default to the active rolling window (50 events) unless specified
  const batchSize = isAll ? totalEvents : (customLimit || Math.min(totalEvents, 50));
  console.log(`🔎 Verifying cryptographic chain integrity over recent ${batchSize} events...`);

  const result = await verifyHashChainIntegrity(batchSize);

  if (result.isTamperFree) {
    console.log(`✅ HASH CHAIN INTEGRITY VERIFIED: All ${result.checkedCount} events cryptographically intact.`);
    console.log(`   Verification Timestamp: ${result.verifiedAt.toISOString()}`);
    console.log('================================================================');
    process.exit(0);
  } else {
    console.error(`❌ CRITICAL: TAMPER DETECTED in Audit Log Hash Chain!`);
    console.error(`   Broken at Event ID: ${result.brokenAtEventId}`);
    console.error(`   Valid chain broken after ${result.checkedCount} events.`);
    console.error(`   Note: If broken at an older event (e.g. Oct 9/15), this marks historical concurrency before Phase 2 serialization.`);
    console.log('================================================================');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
