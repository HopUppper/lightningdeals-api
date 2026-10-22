import { prisma } from '../server/db';

async function main() {
  const keys = await prisma.apiKey.findMany();
  console.log('Total keys in DB:', keys.length);
  for (const k of keys) {
    console.log({
      id: k.id,
      name: k.name,
      plan: k.plan,
      type: k.type,
      purchasedTokens: k.purchasedTokens.toString(),
      tokensUsed: k.tokensUsed.toString(),
      tokensRemaining: k.tokensRemaining.toString(),
      status: k.status,
    });
  }

  const providers = await prisma.vendorProvider.findMany();
  console.log('\nTotal Vendor Providers:', providers.length);
  for (const p of providers) {
    console.log({
      id: p.id,
      name: p.name,
      capacityModel: p.capacityModel,
      purchasedTokens: p.purchasedTokens.toString(),
      consumedTokens: p.consumedTokens.toString(),
      availableTokens: p.availableTokens.toString(),
      status: p.status,
      isPrimary: p.isPrimary,
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
