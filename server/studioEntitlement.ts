import { prisma } from './db';
import { mapToUpstreamModel } from './gateway';
import { calculateCustomerRollingWindow } from './accounting/customerAccounting';
import { isRollingPlan } from './accounting/tokenReservation';

export interface StudioEntitlement {
  hasAccess: boolean;
  isPaidCustomer: boolean;
  isTrialCustomer: boolean;
  tier: 'paid' | 'trial' | 'free';
  activeKey: {
    id: string;
    name: string;
    displayKey: string;
    type: string;
    status: string;
    plan: string;
    tokensRemaining: string;
    purchasedTokens: string;
    expiresAt: string | null;
    isExpired: boolean;
    isQuotaExhausted: boolean;
    allowedModels: string;
  } | null;
  allowedModels: string[];
  paidOnlyModels: string[];
  canChat: boolean;
  canUploadDocuments: boolean;
  canMultiTurn: boolean;
  rejectionReason?: {
    code: 'NO_KEY' | 'KEY_EXPIRED' | 'QUOTA_EXHAUSTED' | 'KEY_SUSPENDED' | 'PRO_TIER_REQUIRED' | 'MODEL_NOT_AUTHORIZED';
    message: string;
  };
}

export const PAID_ONLY_STUDIO_MODELS = [
  'claude-opus-5.5',
  'claude-opus-5',
  'claude-3-opus-20240229',
];

export const DEFAULT_TRIAL_STUDIO_MODELS = [
  'claude-sonnet-5.5',
  'claude-3-7-sonnet-20250219',
  'claude-haiku-5.5',
  'claude-fable-5',
  'claude-fable-5.1',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
];

export const ALL_STUDIO_MODELS = [
  'claude-sonnet-5.5',
  'claude-opus-5.5',
  'claude-3-7-sonnet-20250219',
  'claude-opus-5',
  'claude-fable-5',
  'claude-fable-5.1',
  'claude-haiku-5.5',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
];

/**
 * Parse the allowedModels field of an ApiKey record.
 */
export function parseAllowedModels(rawAllowed: string | null | undefined): string[] | 'all' {
  if (!rawAllowed || !rawAllowed.trim()) return 'all';
  const clean = rawAllowed.trim().toLowerCase();
  if (clean === 'all' || clean === '*' || clean === '["*"]' || clean === '["all"]') {
    return 'all';
  }

  try {
    const parsed = JSON.parse(rawAllowed);
    if (Array.isArray(parsed)) {
      return parsed.map((m) => String(m).trim().toLowerCase());
    }
    return [String(parsed).trim().toLowerCase()];
  } catch {
    return rawAllowed.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  }
}

/**
 * Validates whether a model is authorized for a specific API key and user tier.
 */
export function isModelAuthorizedForKey(
  requestedModel: string,
  keyRecord: any,
  isPaidCustomer: boolean
): { allowed: boolean; code?: string; message?: string } {
  const normModel = requestedModel.trim().toLowerCase();
  const upstreamMapped = mapToUpstreamModel(requestedModel).toLowerCase();

  // 1. Check ApiKey.allowedModels whitelist if configured
  if (keyRecord && keyRecord.allowedModels) {
    const parsed = parseAllowedModels(keyRecord.allowedModels);
    if (parsed !== 'all') {
      const match = parsed.some((allowed) => {
        const normAllowed = allowed.toLowerCase().trim();
        return (
          normAllowed === '*' ||
          normAllowed === 'all' ||
          normAllowed === normModel ||
          normAllowed === upstreamMapped ||
          normModel.includes(normAllowed) ||
          upstreamMapped.includes(normAllowed) ||
          normAllowed.includes(normModel) ||
          normAllowed.includes(upstreamMapped)
        );
      });

      if (!match) {
        return {
          allowed: false,
          code: 'MODEL_NOT_AUTHORIZED',
          message: `Model '${requestedModel}' is not authorized for this API key. Permitted models: ${parsed.join(', ')}.`,
        };
      }
    }
  }

  // 2. If user is NOT a paid customer and is on a trial key, gate Opus tier models
  const isTrialKey = keyRecord?.type === 'trial' || keyRecord?.plan === 'Free Trial';
  if (!isPaidCustomer && isTrialKey) {
    const isOpusRequested = normModel.includes('opus') || upstreamMapped.includes('opus');
    if (isOpusRequested) {
      return {
        allowed: false,
        code: 'PRO_TIER_REQUIRED',
        message: `Claude Opus frontier models are exclusive to paid capacity plans. Your trial key includes full access to Claude Sonnet 5.5, Haiku 5.5, and Fable coding models. `,
      };
    }
  }

  return { allowed: true };
}

/**
 * Resolves the full Studio entitlement state for a user.
 */
export async function resolveStudioEntitlement(
  userId: string,
  preferredKeyId?: string
): Promise<StudioEntitlement> {
  // 1. User and Paid Tier Check
  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, hasStudioAccess: true },
  });

  const paidOrder = await prisma.order.findFirst({
    where: { userId, paymentStatus: 'PAID' },
  });

  const paidSub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ['ACTIVE', 'active'] },
      planId: { notIn: ['free_trial', 'trial'] },
    },
  });

  const isPaidCustomer = Boolean(paidOrder || paidSub || userRecord?.hasStudioAccess);

  // 2. Trial Status Check
  const trialClaim = await prisma.trialClaim.findFirst({
    where: { userId, decision: 'APPROVED' },
  });

  const trialSub = await prisma.subscription.findFirst({
    where: {
      userId,
      planId: { in: ['free_trial', 'trial'] },
      status: { in: ['ACTIVE', 'active'] },
    },
  });

  // 3. Resolve Active Key
  let keyRecord: any = null;
  if (preferredKeyId && typeof preferredKeyId === 'string') {
    keyRecord = await prisma.apiKey.findFirst({
      where: { id: preferredKeyId, userId },
      include: { provider: true },
    });
  }

  // Preferred key not given or invalid: prefer active key with tokens and not expired
  if (!keyRecord) {
    const now = new Date();
    keyRecord = await prisma.apiKey.findFirst({
      where: {
        userId,
        status: 'active',
        tokensRemaining: { gt: 0n },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: { provider: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Fallback to any active key with remaining tokens
  if (!keyRecord) {
    keyRecord = await prisma.apiKey.findFirst({
      where: { userId, status: 'active', tokensRemaining: { gt: 0n } },
      include: { provider: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Fallback to any active key (even if exhausted/expired, for clean UX feedback)
  if (!keyRecord) {
    keyRecord = await prisma.apiKey.findFirst({
      where: { userId, status: 'active' },
      include: { provider: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Fallback to latest key of any status
  if (!keyRecord) {
    keyRecord = await prisma.apiKey.findFirst({
      where: { userId },
      include: { provider: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  const isTrialCustomer = Boolean(
    trialClaim || trialSub || (keyRecord && (keyRecord.type === 'trial' || keyRecord.plan === 'Free Trial'))
  );

  const tier: 'paid' | 'trial' | 'free' = isPaidCustomer
    ? 'paid'
    : isTrialCustomer
    ? 'trial'
    : 'free';

  // 4. Determine key state
  let isExpired = false;
  let isQuotaExhausted = false;
  let hasValidActiveKey = false;

  let effectiveTokensRemaining = 0n;
  if (keyRecord) {
    if (keyRecord.expiresAt) {
      isExpired = new Date(keyRecord.expiresAt).getTime() <= Date.now();
    }
    const metrics = await calculateCustomerRollingWindow(keyRecord);
    effectiveTokensRemaining = BigInt(Math.max(0, Math.floor(metrics.remainingWindowAllowance)));
    isQuotaExhausted = effectiveTokensRemaining <= 0n;
    hasValidActiveKey = keyRecord.status === 'active' && !isExpired && !isQuotaExhausted;
  }

  // Studio is open to all users who have an active key or are paid/trial customers
  const hasAccess = Boolean(isPaidCustomer || isTrialCustomer || keyRecord);

  // Determine allowed models
  let allowedModels: string[] = ALL_STUDIO_MODELS;
  if (keyRecord && keyRecord.allowedModels) {
    const parsed = parseAllowedModels(keyRecord.allowedModels);
    if (parsed !== 'all') {
      allowedModels = parsed;
    }
  }

  if (!isPaidCustomer && (isTrialCustomer || keyRecord?.type === 'trial')) {
    // Filter out Opus models for trial unless explicitly granted
    if (keyRecord?.allowedModels && parseAllowedModels(keyRecord.allowedModels) !== 'all') {
      // Honor explicit allowedModels
    } else {
      allowedModels = DEFAULT_TRIAL_STUDIO_MODELS;
    }
  }

  // Calculate canChat and rejection reasons
  let canChat = false;
  let rejectionReason: StudioEntitlement['rejectionReason'] = undefined;

  if (!keyRecord) {
    rejectionReason = {
      code: 'NO_KEY',
      message: 'No active API key found. Claim a free 200k trial key or activate a capacity plan to start prompting in AI Chat Studio.',
    };
  } else if (keyRecord.status !== 'active') {
    rejectionReason = {
      code: 'KEY_SUSPENDED',
      message: `Your API key "${keyRecord.name || keyRecord.displayKey}" is currently ${keyRecord.status}. Please activate a valid key to use AI Chat Studio.`,
    };
  } else if (isExpired) {
    rejectionReason = {
      code: 'KEY_EXPIRED',
      message: `Your API key "${keyRecord.name || keyRecord.displayKey}" has expired. Please upgrade or generate a new key to continue prompting.`,
    };
  } else if (isQuotaExhausted) {
    rejectionReason = {
      code: 'QUOTA_EXHAUSTED',
      message: `Your API key "${keyRecord.name || keyRecord.displayKey}" has depleted its token balance (0 tokens remaining). Please upgrade or switch to a key with available quota.`,
    };
  } else {
    canChat = true;
  }

  // Both paid users and trial users can inspect documents and use multi-turn within their key balance!
  const canUploadDocuments = canChat;
  const canMultiTurn = canChat;

  return {
    hasAccess,
    isPaidCustomer,
    isTrialCustomer,
    tier,
    activeKey: keyRecord
      ? {
          id: keyRecord.id,
          name: keyRecord.name,
          displayKey: keyRecord.displayKey,
          type: keyRecord.type,
          status: keyRecord.status,
          plan: keyRecord.plan,
          tokensRemaining: effectiveTokensRemaining.toString(),
          purchasedTokens: keyRecord.purchasedTokens.toString(),
          expiresAt: keyRecord.expiresAt ? keyRecord.expiresAt.toISOString() : null,
          isExpired,
          isQuotaExhausted,
          allowedModels: keyRecord.allowedModels || 'all',
        }
      : null,
    allowedModels,
    paidOnlyModels: PAID_ONLY_STUDIO_MODELS,
    canChat,
    canUploadDocuments,
    canMultiTurn,
    rejectionReason,
  };
}
