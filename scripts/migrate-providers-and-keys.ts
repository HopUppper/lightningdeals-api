import { prisma } from '../server/db';

async function migrate() {
  console.log('--- STARTING MULTI-PROVIDER & API KEY MIGRATION ---');

  // 1. Identify or Update ScaleMax
  let scalemax = await prisma.vendorProvider.findFirst({
    where: {
      OR: [
        { slug: 'scalemax' },
        { name: { contains: 'ScaleMax', mode: 'insensitive' } },
        { baseUrl: { contains: 'scalemax', mode: 'insensitive' } }
      ]
    }
  });

  if (scalemax) {
    scalemax = await prisma.vendorProvider.update({
      where: { id: scalemax.id },
      data: {
        name: 'ScaleMax',
        slug: 'scalemax',
        isDefault: true,
        isPrimary: true,
        priority: 1,
        timeoutMs: 60000,
        retryCount: 2,
        retryDelayMs: 1000,
        healthStatus: 'online',
        capabilitiesJson: JSON.stringify(['chat', 'streaming', 'tools', 'vision']),
        supportedModelsJson: JSON.stringify([
          'claude-sonnet-5',
          'claude-opus-5',
          'claude-haiku-4-5',
          'claude-3-5-sonnet-20241022',
          'claude-3-opus-20240229',
          'claude-3-5-haiku-20241022'
        ]),
        modelMappingsJson: JSON.stringify({
          'claude-sonnet-5': 'claude-3-5-sonnet-20241022',
          'claude-opus-5': 'claude-3-opus-20240229',
          'claude-haiku-4-5': 'claude-3-5-haiku-20241022'
        })
      }
    });
    console.log(`✅ ScaleMax provider synchronized: ${scalemax.id} (slug: ${scalemax.slug})`);
  } else {
    console.warn('⚠️ ScaleMax provider not found by selector!');
  }

  // 2. Identify or Update Opus Max
  let opusmax = await prisma.vendorProvider.findFirst({
    where: {
      OR: [
        { slug: 'opus_max' },
        { name: { contains: 'Opus', mode: 'insensitive' } },
        { baseUrl: { contains: 'opusmax', mode: 'insensitive' } }
      ]
    }
  });

  if (opusmax) {
    opusmax = await prisma.vendorProvider.update({
      where: { id: opusmax.id },
      data: {
        name: 'Opus Max',
        slug: 'opus_max',
        isDefault: false,
        isPrimary: false,
        priority: 2,
        timeoutMs: 60000,
        retryCount: 2,
        retryDelayMs: 1000,
        healthStatus: 'online',
        capabilitiesJson: JSON.stringify(['chat', 'streaming', 'tools', 'vision']),
        supportedModelsJson: JSON.stringify([
          'claude-sonnet-5',
          'claude-opus-5',
          'claude-haiku-4-5',
          'claude-3-5-sonnet-20241022',
          'claude-3-opus-20240229',
          'claude-3-5-haiku-20241022'
        ]),
        modelMappingsJson: JSON.stringify({
          'claude-sonnet-5': 'claude-3-5-sonnet-20241022',
          'claude-opus-5': 'claude-3-opus-20240229',
          'claude-haiku-4-5': 'claude-3-5-haiku-20241022'
        })
      }
    });
    console.log(`✅ Opus Max provider synchronized: ${opusmax.id} (slug: ${opusmax.slug})`);
  } else {
    console.warn('⚠️ Opus Max provider not found by selector!');
  }

  // 3. Migrate All Unassigned / LD Keys to ScaleMax
  if (scalemax) {
    const unassignedCount = await prisma.apiKey.count({ where: { providerId: null } });
    if (unassignedCount > 0) {
      const res = await prisma.apiKey.updateMany({
        where: { providerId: null },
        data: { providerId: scalemax.id }
      });
      console.log(`✅ Migrated ${res.count} unassigned API key(s) to ScaleMax (${scalemax.id})`);
    } else {
      console.log('✅ All API keys already have providerId assigned.');
    }
  }

  // 4. Setup Gateway Provider Config
  const existingConfig = await prisma.gatewayProviderConfig.findUnique({
    where: { key: 'default_gateway' }
  });

  if (!existingConfig && scalemax && opusmax) {
    await prisma.gatewayProviderConfig.create({
      data: {
        key: 'default_gateway',
        defaultProviderId: scalemax.id,
        primaryProviderId: scalemax.id,
        fallbackProviderId: opusmax.id,
        enableAutoFailover: true
      }
    });
    console.log('✅ Created default GatewayProviderConfig with auto-failover enabled');
  } else if (existingConfig && scalemax && opusmax) {
    await prisma.gatewayProviderConfig.update({
      where: { key: 'default_gateway' },
      data: {
        defaultProviderId: existingConfig.defaultProviderId || scalemax.id,
        primaryProviderId: existingConfig.primaryProviderId || scalemax.id,
        fallbackProviderId: existingConfig.fallbackProviderId || opusmax.id,
        enableAutoFailover: true
      }
    });
    console.log('✅ Synchronized GatewayProviderConfig');
  }

  // 5. Final Key Audit
  const totalKeys = await prisma.apiKey.count();
  const nullKeys = await prisma.apiKey.count({ where: { providerId: null } });
  const scaleMaxKeys = scalemax ? await prisma.apiKey.count({ where: { providerId: scalemax.id } }) : 0;
  const opusMaxKeys = opusmax ? await prisma.apiKey.count({ where: { providerId: opusmax.id } }) : 0;

  console.log('\n--- FINAL MIGRATION SUMMARY ---');
  console.log(`Total Keys: ${totalKeys}`);
  console.log(`Keys with NULL Provider: ${nullKeys}`);
  console.log(`ScaleMax Keys: ${scaleMaxKeys}`);
  console.log(`Opus Max Keys: ${opusMaxKeys}`);
  console.log(`Coverage: ${nullKeys === 0 ? '100% COMPLETE' : 'INCOMPLETE'}`);
}

migrate()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
