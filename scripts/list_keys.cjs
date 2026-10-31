const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const keys = await prisma.apiKey.findMany({
    select: {
      id: true,
      keyPrefix: true,
      displayKey: true,
      type: true,
      billingType: true,
      creditBalanceUsd: true,
      tokensRemaining: true,
      status: true,
      userId: true,
      plan: true,
      user: {
        select: { email: true }
      }
    },
    take: 10
  });
  console.log(JSON.stringify(keys, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
