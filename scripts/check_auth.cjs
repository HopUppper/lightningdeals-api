const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'qa_e2e_customer@lightningapi.pro' }
  });
  console.log('User found:', user ? { id: user.id, email: user.email, hasPass: !!user.passwordHash } : null);
  if (user && user.passwordHash) {
    const match = await bcrypt.compare('LightningQA!2026Pass', user.passwordHash);
    console.log('Password match:', match);
    if (!match) {
      // Re-hash with bcryptjs
      const newHash = await bcrypt.hash('LightningQA!2026Pass', 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash }
      });
      console.log('Updated passwordHash for customer');
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
