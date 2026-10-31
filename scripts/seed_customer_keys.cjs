const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const customerEmail = 'qa_e2e_customer@lightningapi.pro';
  const customer = await prisma.user.findUnique({
    where: { email: customerEmail }
  });

  if (!customer) {
    console.error('Customer not found');
    return;
  }

  console.log('Customer ID:', customer.id);

  const existingKeys = await prisma.apiKey.findMany({
    where: { userId: customer.id }
  });

  const createdKeys = {};

  const ensureKey = async (planKey, billingType, planName, details) => {
    let keyRecord = existingKeys.find(k => k.billingType === billingType);
    let rawSecret;
    if (!keyRecord) {
      rawSecret = 'ld_live_' + crypto.randomBytes(24).toString('hex');
      const hash = crypto.createHash('sha256').update(rawSecret).digest('hex');
      const displayKey = rawSecret.slice(0, 11) + '...' + rawSecret.slice(-4);

      keyRecord = await prisma.apiKey.create({
        data: {
          userId: customer.id,
          keyPrefix: 'ld_live_',
          keyHash: hash,
          displayKey: displayKey,
          keyEncrypted: rawSecret,
          name: `${planName} Key`,
          plan: planName,
          type: 'production',
          status: 'active',
          billingType: billingType,
          purchasedTokens: BigInt(details.purchasedTokens || 0),
          tokensRemaining: BigInt(details.tokensRemaining || 0),
          creditBalanceUsd: details.creditBalanceUsd || 0,
          rateLimitRpm: 120,
          maxConcurrency: 10,
          allowedModels: 'all',
          allowedModelFamilies: 'all'
        }
      });
      console.log(`Created ${billingType} key: ${rawSecret} (${keyRecord.id})`);
    } else {
      rawSecret = keyRecord.keyEncrypted || `ld_live_dummy_${keyRecord.id.slice(0, 8)}`;
      console.log(`Existing ${billingType} key: ${keyRecord.displayKey} (${keyRecord.id})`);
    }
    createdKeys[planKey] = {
      id: keyRecord.id,
      billingType: billingType,
      planName: planName,
      rawKey: rawSecret,
      displayKey: keyRecord.displayKey
    };
    return keyRecord;
  };

  await ensureKey('windowKey', 'window', 'Claude Max 5x (5-Hour Window)', {
    purchasedTokens: 5000000,
    tokensRemaining: 5000000,
  });

  await ensureKey('creditKey', 'credit', 'Credit Starter ($7.00 USD Credits)', {
    creditBalanceUsd: 7.00,
    purchasedTokens: 0,
    tokensRemaining: 0,
  });

  await ensureKey('tokenKey', 'token', 'Claude 10M Token Pack (Consumable)', {
    purchasedTokens: 10000000,
    tokensRemaining: 9850000,
  });

  fs.writeFileSync('scripts/test_keys.json', JSON.stringify(createdKeys, null, 2));
  console.log('Successfully written test keys to scripts/test_keys.json');
}

main().catch(console.error).finally(() => prisma.$disconnect());
