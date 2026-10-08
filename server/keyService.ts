import crypto from 'crypto';
import { prisma } from './db';

export interface GeneratedKeyMaterial {
  providerId: string;
  providerName: string;
  rawKeySecret: string;
  keyPrefix: string;
  keyHash: string;
  displayKey: string;
}

/**
 * Retrieves the authoritative default provider ID from SystemSetting.
 * Falls back to active ScaleMax if setting is missing.
 */
export async function getDefaultProviderId(): Promise<string> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'default_provider_id' },
  });

  if (setting && setting.value && setting.value.trim()) {
    const candidateId = setting.value.trim();
    // Verify provider still exists and is not disabled
    const provider = await prisma.vendorProvider.findUnique({
      where: { id: candidateId },
    });
    if (provider && provider.status !== 'disabled') {
      return candidateId;
    }
  }

  // Fallback: ScaleMax provider
  const scaleMax = await prisma.vendorProvider.findFirst({
    where: { name: 'ScaleMax', status: { not: 'disabled' } },
  });
  if (scaleMax) return scaleMax.id;

  // Final fallback: any non-disabled vendor
  const anyActive = await prisma.vendorProvider.findFirst({
    where: { status: { not: 'disabled' } },
  });
  if (anyActive) return anyActive.id;

  throw new Error('No active VendorProvider configured in database. Cannot generate API key.');
}

/**
 * Resolves the authoritative provider for a new key.
 * 1. Explicit providerId requested (e.g. by Admin), verified to exist and be enabled.
 * 2. SystemSetting.default_provider_id for standard provisioning.
 */
export async function resolveProviderForNewKey(explicitProviderId?: string): Promise<{ id: string; name: string; status: string }> {
  if (explicitProviderId && explicitProviderId.trim()) {
    const provider = await prisma.vendorProvider.findUnique({
      where: { id: explicitProviderId.trim() },
    });
    if (!provider) {
      throw new Error(`Requested provider (${explicitProviderId}) does not exist.`);
    }
    if (provider.status === 'disabled') {
      throw new Error(`Requested provider (${provider.name}) is currently disabled.`);
    }
    return { id: provider.id, name: provider.name, status: provider.status };
  }

  const defaultId = await getDefaultProviderId();
  const provider = await prisma.vendorProvider.findUnique({
    where: { id: defaultId },
  });

  if (!provider || provider.status === 'disabled') {
    throw new Error('Default upstream provider is not available or disabled.');
  }

  return { id: provider.id, name: provider.name, status: provider.status };
}

/**
 * Determines the customer key prefix based on the provider:
 * - ScaleMax: ld_live_ / ld_trial_
 * - Opus Max: sk_live_ / sk_trial_
 */
export function determineKeyPrefix(provider: { name: string }, isTrial: boolean): string {
  const norm = provider.name.toLowerCase();
  if (norm.includes('opus')) {
    return isTrial ? 'sk_trial_' : 'sk_live_';
  }
  return isTrial ? 'ld_trial_' : 'ld_live_';
}

/**
 * Generates high-entropy API key material with authoritative provider association.
 */
export async function generateProviderApiKey(options: {
  providerId?: string;
  isTrial?: boolean;
}): Promise<GeneratedKeyMaterial> {
  const provider = await resolveProviderForNewKey(options.providerId);
  const keyPrefix = determineKeyPrefix(provider, Boolean(options.isTrial));

  const randomEntropy = crypto.randomBytes(24).toString('hex'); // 48 chars
  const rawKeySecret = `${keyPrefix}${randomEntropy}`;
  const keyHash = crypto.createHash('sha256').update(rawKeySecret).digest('hex');
  const displayKey = `${keyPrefix}${randomEntropy.substring(0, 6)}...${randomEntropy.substring(randomEntropy.length - 4)}`;

  return {
    providerId: provider.id,
    providerName: provider.name,
    rawKeySecret,
    keyPrefix,
    keyHash,
    displayKey,
  };
}

/**
 * Generates rotated key material while preserving the existing key's providerId and prefix convention.
 */
export async function generateRotatedKeyMaterial(existingKey: {
  id: string;
  providerId?: string | null;
  keyPrefix?: string | null;
  type?: string | null;
}): Promise<{ rawKeySecret: string; keyPrefix: string; keyHash: string; displayKey: string }> {
  const isTrial = existingKey.type === 'trial' || (existingKey.keyPrefix && existingKey.keyPrefix.includes('trial'));
  let prefix = isTrial ? 'ld_trial_' : 'ld_live_';

  if (existingKey.providerId) {
    const provider = await prisma.vendorProvider.findUnique({ where: { id: existingKey.providerId } });
    if (provider) {
      prefix = determineKeyPrefix(provider, Boolean(isTrial));
    }
  } else if (existingKey.keyPrefix && existingKey.keyPrefix.startsWith('sk_')) {
    prefix = isTrial ? 'sk_trial_' : 'sk_live_';
  }

  const randomEntropy = crypto.randomBytes(24).toString('hex');
  const rawKeySecret = `${prefix}${randomEntropy}`;
  const keyHash = crypto.createHash('sha256').update(rawKeySecret).digest('hex');
  const displayKey = `${prefix}${randomEntropy.substring(0, 6)}...${randomEntropy.substring(randomEntropy.length - 4)}`;

  return { rawKeySecret, keyPrefix: prefix, keyHash, displayKey };
}
