const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function hashPasswordScrypt(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

async function main() {
  const adminHash = hashPasswordScrypt('LightningAdmin!2026Pass');
  const customerHash = hashPasswordScrypt('LightningQA!2026Pass');

  await prisma.user.updateMany({
    where: { email: 'qa_e2e_admin@lightningapi.pro' },
    data: { passwordHash: adminHash, role: 'admin', status: 'active' }
  });

  await prisma.user.updateMany({
    where: { email: 'qa_e2e_customer@lightningapi.pro' },
    data: { passwordHash: customerHash, status: 'active' }
  });

  console.log('Successfully hashed passwords with scrypt for admin and customer.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
