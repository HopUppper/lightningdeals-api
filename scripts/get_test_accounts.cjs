const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true, email: true, role: true, name: true }
  });
  const users = await prisma.user.findMany({
    where: { role: 'user' },
    select: { id: true, email: true, role: true, name: true, emailVerified: true },
    take: 5
  });
  console.log('Admins:', JSON.stringify(admins, null, 2));
  console.log('Sample Users:', JSON.stringify(users, null, 2));
}

main().finally(() => prisma.$disconnect());
