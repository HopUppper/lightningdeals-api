import { prisma } from '../server/db';

async function cleanAllOrphanedKeys() {
  const keys = await prisma.apiKey.findMany({
    select: { id: true, displayKey: true, name: true, userId: true, plan: true, status: true },
  });
  console.log(`Found ${keys.length} API keys in database:`);
  for (const k of keys) {
    console.log(`  - ${k.displayKey} (${k.name}) userId=${k.userId} plan=${k.plan} status=${k.status}`);
  }

  for (const key of keys) {
    if (!key.userId) {
      console.log(`\nDeleting orphaned key (no userId): ${key.displayKey}`);
      await prisma.apiRequest.deleteMany({ where: { apiKeyId: key.id } });
      await prisma.tokenLedger.deleteMany({ where: { apiKeyId: key.id } });
      await prisma.apiKey.delete({ where: { id: key.id } });
      continue;
    }

    const owner = await prisma.user.findUnique({ where: { id: key.userId } });
    if (!owner || owner.role === 'admin') {
      // Admin shouldn't have customer API keys, or owner is deleted
      if (!owner) {
        console.log(`\nDeleting orphaned key (owner deleted): ${key.displayKey}`);
      }
      await prisma.apiRequest.deleteMany({ where: { apiKeyId: key.id } });
      await prisma.tokenLedger.deleteMany({ where: { apiKeyId: key.id } });
      await prisma.apiKey.delete({ where: { id: key.id } });
    }
  }

  const remaining = await prisma.apiKey.count();
  const remainingUsers = await prisma.user.findMany({ select: { name: true, email: true, role: true } });
  console.log(`\n══════════════════════════════════════`);
  console.log(`FINAL CLEAN STATE:`);
  console.log(`Users: ${remainingUsers.length}`);
  for (const u of remainingUsers) console.log(`  - ${u.name} (${u.email}) [${u.role}]`);
  console.log(`API Keys: ${remaining}`);
  console.log(`══════════════════════════════════════`);
}

cleanAllOrphanedKeys().finally(() => prisma.$disconnect());
