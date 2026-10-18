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
 * Returns security epoch timestamp in milliseconds. Any token issued before this epoch is rejected.
 * Supports:
 * - Pure numeric digits: milliseconds (e.g. 1771437600000) or seconds (e.g. 1771437600)
 * - ISO 8601 date strings: (e.g. '2026-10-18T00:00:00Z')
 */
export function getSecurityEpoch(): number {
  if (process.env.SECURITY_EPOCH) {
    const raw = process.env.SECURITY_EPOCH.trim();
    if (!raw) return 0;

    // Check for purely numeric string
    if (/^\d+$/.test(raw)) {
      const num = Number(raw);
      if (!isNaN(num) && num > 0) {
        // If < 100 billion, it's seconds since Unix epoch; normalize to ms
        return num < 100_000_000_000 ? num * 1000 : num;
      }
    }

    // Try parsing as ISO 8601 or standard date string
    const epochTime = new Date(raw).getTime();
    if (!isNaN(epochTime)) return epochTime;
  }
  return 0;
}

/**
 * Allowed JWT signing and verification algorithms
 */
export const ALLOWED_JWT_ALGORITHMS: ('HS256' | 'HS384' | 'HS512')[] = ['HS256'];
