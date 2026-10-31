const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: 'qa_e2e_admin@lightningapi.pro' }
  });
  if (admin) {
    const newHash = await bcrypt.hash('LightningAdmin!2026Pass', 10);
    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash: newHash, role: 'admin' }
    });
    console.log('Updated passwordHash and role=admin for qa_e2e_admin@lightningapi.pro');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
