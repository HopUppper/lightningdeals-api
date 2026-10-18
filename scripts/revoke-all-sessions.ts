import { prisma } from '../server/db';
import { recordAuditEvent } from '../server/auditLogger';

/**
 * Emergency Session Revocation Tool
 *
 * Usage:
 *   npx tsx scripts/revoke-all-sessions.ts [--admin-only]
 *
 * Actions:
 *   1. Marks all active sessions in UserSession as revoked (isRevoked = true).
 *   2. Updates passwordChangedAt to current timestamp on all admin accounts
 *      (or all users if --admin-only is not set), which immediately causes
 *      all previously issued JWTs to fail verification in authenticateJwt.
 *   3. Records a CRITICAL audit event.
 */

async function main() {
  const args = process.argv.slice(2);
  const adminOnly = args.includes('--admin-only');

  console.log('================================================================');
  console.log('🚨 EMERGENCY SECURITY OPERATION: SESSION & TOKEN REVOCATION');
  console.log('================================================================\n');

  const now = new Date();

  // Atomic transaction: Invalidate active database sessions AND bump passwordChangedAt
  const sessionFilter = adminOnly ? { user: { role: 'admin' } } : {};
  const userFilter = adminOnly ? { role: 'admin' } : {};

  const [revokedSessions, updatedUsers] = await prisma.$transaction([
    prisma.userSession.updateMany({
      where: { ...sessionFilter, isRevoked: false },
      data: { isRevoked: true },
    }),
    prisma.user.updateMany({
      where: userFilter,
      data: { passwordChangedAt: now },
    }),
  ]);

  console.log(`✓ Revoked ${revokedSessions.count} active database session(s).`);
  console.log(`✓ Updated passwordChangedAt for ${updatedUsers.count} account(s) to invalidate stateless tokens.`);

  // 3. Record Audit Event
  await recordAuditEvent({
    eventType: 'GLOBAL_SESSION_REVOCATION_EXECUTED',
    severity: 'CRITICAL',
    actorType: 'SYSTEM',
    action: 'SESSION_REVOCATION',
    result: 'SUCCESS',
    metadata: {
      scope: adminOnly ? 'ADMINISTRATORS_ONLY' : 'ALL_USERS',
      revokedSessionsCount: revokedSessions.count,
      updatedUsersCount: updatedUsers.count,
      timestamp: now.toISOString(),
    },
  });

  console.log('\n================================================================');
  console.log('✅ COMPLETE: All targeted sessions and tokens are now invalid.');
  console.log('   Users must re-authenticate with valid credentials.');
  console.log('================================================================');

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Session revocation failed:', err);
  process.exit(1);
});
