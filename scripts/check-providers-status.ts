import { prisma, decryptText } from '../server/db';

async function main() {
  const start = Date.now();
  console.log('--- DB & PROVIDER DETAILED AUDIT ---');
  
  const providers = await prisma.vendorProvider.findMany({
    include: {
      _count: {
        select: { apiKeys: true }
      }
    }
  });

  console.log(`\nFound ${providers.length} Vendor Providers:`);
  for (const p of providers) {
    const dec = decryptText(p.masterApiKeyEncrypted);
    const masked = dec ? `${dec.slice(0, 8)}...${dec.slice(-4)}` : 'NOT_SET';
    console.log(`- [${p.name}] (ID: ${p.id})`);
    console.log(`    BaseURL: ${p.baseUrl}`);
    console.log(`    Status: ${p.status} | Primary: ${p.isPrimary}`);
    console.log(`    Master Key: ${masked}`);
    console.log(`    Active Associated API Keys: ${p._count.apiKeys}`);
  }

  const nullProviderKeys = await prisma.apiKey.findMany({
    where: { providerId: null },
    select: { id: true, keyPrefix: true, displayKey: true, createdAt: true }
  });

  console.log(`\nAPI Keys with NULL Provider: ${nullProviderKeys.length}`);
  for (const k of nullProviderKeys) {
    console.log(`  - Key: ${k.displayKey} (Prefix: ${k.keyPrefix}) created ${k.createdAt}`);
  }

  console.log(`\nDiagnostic finished in ${Date.now() - start}ms`);
}

main()
  .catch((e) => {
    console.error('Diagnostic error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
