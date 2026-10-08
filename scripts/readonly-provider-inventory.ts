import { prisma } from '../server/db';

async function runInventory() {
  console.log('=================================================================');
  console.log('🔍 READ-ONLY VENDOR PROVIDER INVENTORY AUDIT');
  console.log('=================================================================\n');

  // 1. Fetch all VendorProviders
  const providers = await prisma.vendorProvider.findMany({
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Total VendorProvider records found: ${providers.length}\n`);

  for (const p of providers) {
    let hostname = 'unknown';
    try {
      hostname = new URL(p.baseUrl).hostname;
    } catch {
      hostname = p.baseUrl;
    }

    const apiKeyCount = await prisma.apiKey.count({
      where: { providerId: p.id },
    });

    const apiRequestCount = await prisma.apiRequest.count({
      where: { providerId: p.id },
    });

    const ledgerCount = await prisma.masterTokenLedger.count({
      where: { providerId: p.id },
    });

    const hasCredential = Boolean(p.masterApiKeyEncrypted && p.masterApiKeyEncrypted.trim().length > 0);

    console.log(`-----------------------------------------------------------------`);
    console.log(`PROVIDER RECORD: "${p.name}"`);
    console.log(`-----------------------------------------------------------------`);
    console.log(`- id: ${p.id}`);
    console.log(`- name: ${p.name}`);
    console.log(`- providerType: ${p.providerType}`);
    console.log(`- protocol: ${p.protocol}`);
    console.log(`- status: ${p.status}`);
    console.log(`- isPrimary: ${p.isPrimary}`);
    console.log(`- baseUrl hostname only: ${hostname}`);
    console.log(`- availableTokens: ${p.availableTokens.toString()}`);
    console.log(`- consumedTokens: ${p.consumedTokens.toString()}`);
    console.log(`- reservedTokens: ${p.reservedTokens.toString()}`);
    console.log(`- modelMappingsJson: ${p.modelMappingsJson || 'null'}`);
    console.log(`- hasCredentialConfigured: ${hasCredential}`);
    console.log(`- referencedByApiKeys: ${apiKeyCount > 0}`);
    console.log(`- countOfApiKeysReferencingIt: ${apiKeyCount}`);
    console.log(`- countOfApiRequestsReferencingIt: ${apiRequestCount}`);
    console.log(`- countOfMasterTokenLedgerReferencingIt: ${ledgerCount}`);
    console.log(`- createdAt: ${p.createdAt.toISOString()}`);
    console.log(`- updatedAt: ${p.updatedAt.toISOString()}\n`);
  }

  // 2. Global Key and Request breakdown
  const totalKeys = await prisma.apiKey.count();
  const nullProviderKeys = await prisma.apiKey.count({ where: { providerId: null } });

  const totalRequests = await prisma.apiRequest.count();
  const nullProviderRequests = await prisma.apiRequest.count({ where: { providerId: null } });

  // Key grouping by providerId
  const keysByProvider = await prisma.apiKey.groupBy({
    by: ['providerId'],
    _count: { id: true },
  });

  // Request grouping by providerId
  const requestsByProvider = await prisma.apiRequest.groupBy({
    by: ['providerId'],
    _count: { id: true },
  });

  const defaultSetting = await prisma.systemSetting.findUnique({
    where: { key: 'default_provider_id' },
  });

  console.log('=================================================================');
  console.log('DATABASE TOTALS & BREAKDOWN:');
  console.log('=================================================================');
  console.log(`Total ApiKey rows: ${totalKeys}`);
  console.log(`ApiKeys with providerId = NULL: ${nullProviderKeys}`);
  console.log(`ApiKeys grouped by providerId:`, keysByProvider);
  console.log(`\nTotal ApiRequest rows: ${totalRequests}`);
  console.log(`ApiRequests with providerId = NULL: ${nullProviderRequests}`);
  console.log(`ApiRequests grouped by providerId:`, requestsByProvider);
  console.log(`\nSystemSetting default_provider_id: ${defaultSetting?.value || 'null'}`);
}

runInventory()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
