import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'lightningdeals_secret_jwt_key_2026';

async function main() {
  // Ensure we have a customer
  let customer = await prisma.user.findFirst({ where: { role: 'user', status: 'active' } });
  if (!customer) {
    customer = await prisma.user.create({
      data: {
        email: 'developer@lightningapi.pro',
        name: 'Jordan Reed',
        passwordHash: 'scrypt$12345678',
        role: 'user',
        status: 'active',
        emailVerified: true,
      },
    });
  }

  // Ensure we have an admin
  let admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@lightningapi.pro',
        name: 'Chief Architect',
        passwordHash: 'scrypt$12345678',
        role: 'admin',
        status: 'active',
        emailVerified: true,
      },
    });
  }

  const customerToken = jwt.sign(
    { id: customer.id, email: customer.email, role: 'user', name: customer.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const adminToken = jwt.sign(
    { id: admin.id, email: admin.email, role: 'admin', name: admin.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('TOKENS_READY');
  console.log(JSON.stringify({
    customer: { id: customer.id, name: customer.name, email: customer.email, token: customerToken },
    admin: { id: admin.id, name: admin.name, email: admin.email, token: adminToken },
  }));

  await prisma.$disconnect();
}

main().catch(console.error);
