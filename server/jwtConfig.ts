import crypto from 'crypto';

/**
 * Enterprise JWT Configuration & Cryptographic Key Management
 * Strict zero-fallback security policy:
 * - NEVER fall back to hardcoded default strings.
 * - In production: require process.env.JWT_SECRET with minimum 32 characters entropy.
 * - Fail closed if missing or insecure.
 */

const MIN_SECRET_LENGTH = 32;
const DISALLOWED_LEGACY_SECRETS = new Set([
  'lightningdeals_secret_jwt_key_2026',
  'apexscale-jwt-secret-key-production-2026',
  'lightningdeals_jwt_secret_key_production_change_in_prod',
  'lightning-integration-key-2026',
  'ant_thinking_sec_key_2025',
]);

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[FATAL SECURITY CONFIGURATION ERROR] Mandatory JWT_SECRET environment variable is missing. ' +
        'Production server cannot start without an externalized cryptographic secret.'
      );
    }
    // In local dev/test, if not set, throw informative error to enforce setting it
    throw new Error(
      '[SECURITY CONFIGURATION ERROR] JWT_SECRET environment variable is not defined. ' +
      'Please configure JWT_SECRET in your environment or .env file (minimum 32 characters).'
    );
  }

  if (DISALLOWED_LEGACY_SECRETS.has(secret)) {
    throw new Error(
      '[FATAL SECURITY CONFIGURATION ERROR] Configured JWT_SECRET is a compromised legacy fallback secret. ' +
      'You must generate a new high-entropy secret (at least 32 characters).'
    );
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `[FATAL SECURITY CONFIGURATION ERROR] JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long (current length: ${secret.length}).`
      );
    }
  }

  return secret;
}

/**
 * Returns security epoch timestamp. Any token issued before this epoch is rejected.
 */
export function getSecurityEpoch(): number {
  if (process.env.SECURITY_EPOCH) {
    const epochTime = new Date(process.env.SECURITY_EPOCH).getTime();
    if (!isNaN(epochTime)) return epochTime;
  }
  return 0;
}

/**
 * Allowed JWT signing and verification algorithms
 */
export const ALLOWED_JWT_ALGORITHMS: ('HS256' | 'HS384' | 'HS512')[] = ['HS256'];
