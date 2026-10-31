import { prisma } from '../server/db';
import { hashPasswordScrypt } from '../server/auth';

async function main() {
  const customerEmail = 'qa_e2e_customer@lightningapi.pro';
  const customerPass = 'LightningQA!2026Pass';
  const customerHash = await hashPasswordScrypt(customerPass);

  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {
      passwordHash: customerHash,
      emailVerified: true,
      role: 'user',
      name: 'QA Test Customer',
    },
    create: {
      email: customerEmail,
      passwordHash: customerHash,
      emailVerified: true,
      role: 'user',
      name: 'QA Test Customer',
    },
  });
  console.log('Customer provisioned:', customer.email, customer.id);

  const adminEmail = 'qa_e2e_admin@lightningapi.pro';
  const adminPass = 'LightningAdmin!2026Pass';
  const adminHash = await hashPasswordScrypt(adminPass);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminHash,
      emailVerified: true,
      role: 'admin',
      name: 'QA Test Admin',
    },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      emailVerified: true,
      role: 'admin',
      name: 'QA Test Admin',
    },
  });
  console.log('Admin provisioned:', admin.email, admin.id);
}

main().finally(() => prisma.$disconnect());
