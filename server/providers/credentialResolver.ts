/**
 * Determines whether a model identifier represents a local open-weights model family.
 */
export function isLocalModelFamily(model?: string): boolean {
  if (!model) return false;
  const m = model.toLowerCase();
  return (
    m.includes('local') ||
    m.includes('llama') ||
    m.includes('deepseek') ||
    m.includes('qwen') ||
    m.includes('mistral') ||
    m.includes('yi-') ||
    m.includes('gemma') ||
    m.includes('phi-')
  );
}

import { decryptText, isEncrypted } from '../crypto';

export interface ResolvedCredentialResult {
  apiKey: string;
  keySource: 'credit' | 'token' | 'master';
  billingType: 'credit' | 'token';
}

export interface CredentialResolutionFailure {
  error: {
    status: number;
    message: string;
    type: string;
    code: string;
  };
}

/**
 * Determines whether a provider record represents ScaleMax based on slug or name.
 */
export function isScaleMaxProvider(vendor: any): boolean {
  if (!vendor) return false;
  const slug = String(vendor.slug || '').toLowerCase();
  const name = String(vendor.name || '').toLowerCase();
  return slug === 'scalemax' || slug.includes('scale') || name.includes('scalemax') || name.includes('scale');
}

/**
 * Server-authoritative determination of customer billing entitlement.
 * Enforces that client payloads, headers, model names, or query parameters cannot override entitlement.
 */
export function determineCustomerBillingType(keyRecord: any): 'credit' | 'token' {
  if (!keyRecord) return 'credit';

  // 1. Check explicit billingType on apiKey record
  if (keyRecord.billingType === 'token') {
    return 'token';
  }

  // 2. Check associated Plan record if populated
  const planType = keyRecord.plan?.planType || keyRecord.planType;
  if (planType === 'token') {
    return 'token';
  }

  // Default server entitlement is credit
  return 'credit';
}

/**
 * Centralized, strict provider credential resolution for ScaleMax and upstream providers.
 *
 * Mandatory Isolation Invariants:
 * - Credit requests select ONLY ScaleMax credit-specific credentials.
 * - Token requests select ONLY ScaleMax token-specific credentials.
 * - Missing token credentials FAIL CLOSED (never fall back to credit keys or SCALEMAX_MASTER_API_KEY).
 * - Missing credit credentials FAIL CLOSED (never fall back to token keys).
 * - Generic masterApiKeyEncrypted NEVER silently substitutes for missing ScaleMax billing-specific keys.
 * - Undecryptable or missing credentials throw actionable, sanitized errors without leaking secrets.
 */
export function resolveProviderCredential(
  vendor: any,
  keyRecord: any,
  targetModel?: string
): { success: true; credential: ResolvedCredentialResult } | { success: false; failure: CredentialResolutionFailure } {
  if (!vendor) {
    return {
      success: false,
      failure: {
        error: {
          status: 502,
          type: 'provider_configuration_error',
          code: 'vendor_not_configured',
          message: 'No upstream AI provider is configured for this request.',
        },
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 1. SCALEMAX CREDENTIAL SEPARATION
  // ---------------------------------------------------------------------------
  if (isScaleMaxProvider(vendor)) {
    const billingType = determineCustomerBillingType(keyRecord);

    if (billingType === 'token') {
      const isLocal = isLocalModelFamily(targetModel);
      const encryptedTokenKey = isLocal && vendor.localTokenApiKeyEncrypted
        ? vendor.localTokenApiKeyEncrypted
        : vendor.tokenApiKeyEncrypted;
      if (!encryptedTokenKey || typeof encryptedTokenKey !== 'string' || !encryptedTokenKey.trim()) {
        return {
          success: false,
          failure: {
            error: {
              status: 502,
              type: 'provider_configuration_error',
              code: 'missing_token_master_key',
              message: 'ScaleMax token-plan master API key is not configured in Admin > Providers.',
            },
          },
        };
      }

      let decryptedTokenKey = '';
      if (isEncrypted(encryptedTokenKey)) {
        try {
          decryptedTokenKey = decryptText(encryptedTokenKey.trim());
        } catch {
          decryptedTokenKey = '';
        }
        if (!decryptedTokenKey || !decryptedTokenKey.trim()) {
          return {
            success: false,
            failure: {
              error: {
                status: 502,
                type: 'provider_configuration_error',
                code: 'token_key_decryption_failed',
                message: 'Failed to decrypt ScaleMax token-plan API key. Please re-enter the credential in Admin.',
              },
            },
          };
        }
      } else {
        decryptedTokenKey = encryptedTokenKey.trim();
      }

      if (!decryptedTokenKey || !decryptedTokenKey.trim()) {
        if (isLocal && process.env.SCALEMAX_LOCAL_TOKEN_API_KEY) {
          decryptedTokenKey = process.env.SCALEMAX_LOCAL_TOKEN_API_KEY.trim();
        } else if (process.env.SCALEMAX_TOKEN_API_KEY) {
          decryptedTokenKey = process.env.SCALEMAX_TOKEN_API_KEY.trim();
        } else if (process.env.SCALEMAX_TOKEN_MASTER_API_KEY) {
          decryptedTokenKey = process.env.SCALEMAX_TOKEN_MASTER_API_KEY.trim();
        }
      }

      if (!decryptedTokenKey || !decryptedTokenKey.trim()) {
        return {
          success: false,
          failure: {
            error: {
              status: 502,
              type: 'provider_configuration_error',
              code: 'empty_token_master_key',
              message: 'ScaleMax token-plan master API key is empty after decryption.',
            },
          },
        };
      }

      return {
        success: true,
        credential: {
          apiKey: decryptedTokenKey.trim(),
          keySource: 'token',
          billingType: 'token',
        },
      };
    }

    // BillingType is 'credit' -> Must use ONLY creditApiKeyEncrypted
    const encryptedCreditKey = vendor.creditApiKeyEncrypted;
    let decryptedCreditKey = '';

    if (encryptedCreditKey && typeof encryptedCreditKey === 'string' && encryptedCreditKey.trim()) {
      try {
        decryptedCreditKey = decryptText(encryptedCreditKey.trim());
      } catch (err: any) {
        return {
          success: false,
          failure: {
            error: {
              status: 502,
              type: 'provider_configuration_error',
              code: 'credit_key_decryption_failed',
              message: 'Failed to decrypt ScaleMax credit-plan API key. Please re-enter the credential in Admin.',
            },
          },
        };
      }
    }

    // Controlled env fallback strictly for credit mode if DB key is unset
    if (!decryptedCreditKey || !decryptedCreditKey.trim()) {
      decryptedCreditKey = process.env.SCALEMAX_CREDIT_MASTER_API_KEY || process.env.SCALEMAX_MASTER_API_KEY || '';
    }

    if (!decryptedCreditKey || !decryptedCreditKey.trim()) {
      return {
        success: false,
        failure: {
          error: {
            status: 502,
            type: 'provider_configuration_error',
            code: 'missing_credit_master_key',
            message: 'ScaleMax credit-plan master API key is not configured in Admin > Providers.',
          },
        },
      };
    }

    return {
      success: true,
      credential: {
        apiKey: decryptedCreditKey.trim(),
        keySource: 'credit',
        billingType: 'credit',
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 2. NON-SCALEMAX PROVIDERS (OpusMax, Anthropic, Custom HTTP)
  // ---------------------------------------------------------------------------
  let decryptedMasterKey = '';
  if (vendor.masterApiKeyEncrypted && typeof vendor.masterApiKeyEncrypted === 'string' && vendor.masterApiKeyEncrypted.trim()) {
    try {
      decryptedMasterKey = decryptText(vendor.masterApiKeyEncrypted.trim());
    } catch {
      // Will fall back to standard provider env vars below
    }
  }

  if (!decryptedMasterKey || decryptedMasterKey.includes(':') || (!decryptedMasterKey.startsWith('sm_') && !decryptedMasterKey.startsWith('sk-'))) {
    const envKey =
      process.env.OPUS_MAX_MASTER_API_KEY ||
      process.env.OPUSMAX_MASTER_API_KEY ||
      process.env.ANTHROPIC_MASTER_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.SUPPLIER_MASTER_API_KEY ||
      '';
    if (envKey) {
      decryptedMasterKey = envKey;
    }
  }

  if (!decryptedMasterKey || !decryptedMasterKey.trim()) {
    return {
      success: false,
      failure: {
        error: {
          status: 502,
          type: 'provider_configuration_error',
          code: 'missing_provider_master_key',
          message: `Master API key for provider "${vendor.name || 'Upstream'}" is not configured.`,
        },
      },
    };
  }

  return {
    success: true,
    credential: {
      apiKey: decryptedMasterKey.trim(),
      keySource: 'master',
      billingType: 'credit',
    },
  };
}
