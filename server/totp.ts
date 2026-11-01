import crypto from 'crypto';
import { prisma, encryptText, decryptText } from './db';

// Base32 RFC 4648 alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer to RFC 4648 Base32 string (without padding)
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes an RFC 4648 Base32 string into a Buffer
 */
export function base32Decode(input: string): Buffer {
  const cleanInput = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanInput.length; i++) {
    const char = cleanInput[i];
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically random 20-byte TOTP secret (Base32 encoded)
 */
export function generateTotpSecret(): string {
  const randomBytes = crypto.randomBytes(20);
  return base32Encode(randomBytes);
}

/**
 * Calculates RFC 6238 TOTP code for a specific time step
 */
export function calculateTotpCode(secretBase32: string, step: number): string {
  const secretKey = base32Decode(secretBase32);

  const counterBuffer = Buffer.alloc(8);
  // Write counter as 64-bit big-endian integer
  counterBuffer.writeBigInt64BE(BigInt(step), 0);

  const hmac = crypto.createHmac('sha1', secretKey).update(counterBuffer).digest();

  // Dynamic truncation (RFC 4226 / 6238)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binaryCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const code = (binaryCode % 1000000).toString().padStart(6, '0');
  return code;
}

/**
 * Verifies a 6-digit TOTP code against a Base32 secret with +/- 1 step window skew tolerance.
 * Returns the matched step number if valid, or null if invalid.
 */
export function verifyTotpCode(
  secretBase32: string,
  candidateCode: string,
  lastUsedStep: number = 0,
  timeStepSeconds: number = 30
): { valid: boolean; matchedStep?: number } {
  if (!candidateCode || !/^\d{6}$/.test(candidateCode.trim())) {
    return { valid: false };
  }

  const cleanCode = candidateCode.trim();
  const currentStep = Math.floor(Date.now() / 1000 / timeStepSeconds);

  // Check +/- 1 step (current, -30s, +30s)
  const stepsToCheck = [currentStep, currentStep - 1, currentStep + 1];

  for (const step of stepsToCheck) {
    if (step <= lastUsedStep) {
      // Replay prevention: cannot reuse code from an already verified step
      continue;
    }

    try {
      const expectedCode = calculateTotpCode(secretBase32, step);
      if (crypto.timingSafeEqual(Buffer.from(cleanCode), Buffer.from(expectedCode))) {
        return { valid: true, matchedStep: step };
      }
    } catch {
      continue;
    }
  }

  return { valid: false };
}

/**
 * Generates an otpauth:// URL suitable for QR code display
 */
export function generateOtpAuthUrl(email: string, secretBase32: string, issuer: string = 'LightningAPI'): string {
  const cleanEmail = email.trim().toLowerCase();
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(cleanEmail);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secretBase32}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates 8 single-use alphanumeric backup recovery codes (e.g., "7a2f-91cb")
 */
export function generateBackupCodes(count: number = 8): { plaintextCodes: string[]; hashedCodes: string[] } {
  const plaintextCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString('hex'); // 8 hex characters
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
    const hash = crypto.createHash('sha256').update(formatted.toLowerCase().trim()).digest('hex');

    plaintextCodes.push(formatted);
    hashedCodes.push(hash);
  }

  return { plaintextCodes, hashedCodes };
}

/**
 * Verifies a backup recovery code against a list of hashed backup codes.
 * Returns the index of the matched code if valid, or -1 if invalid.
 */
export function verifyBackupCode(candidateCode: string, hashedCodes: string[]): number {
  if (!candidateCode) return -1;
  const cleanCode = candidateCode.trim().toLowerCase();
  const candidateHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

  for (let i = 0; i < hashedCodes.length; i++) {
    const storedHash = hashedCodes[i];
    if (storedHash && storedHash.length === 64) {
      try {
        if (crypto.timingSafeEqual(Buffer.from(candidateHash), Buffer.from(storedHash))) {
          return i;
        }
      } catch {
        continue;
      }
    }
  }

  return -1;
}

export interface AdminMfaConfig {
  enrolled: boolean;
  secretEncrypted: string;
  backupCodes: Array<{ hash: string; used: boolean; usedAt?: string }>;
  enrolledAt: string;
  lastUsedStep: number;
}

const SETTING_PREFIX = 'admin_mfa_config_';

/**
 * Loads the MFA configuration for an admin user from SystemSetting
 */
export async function getAdminMfaConfig(userId: string): Promise<AdminMfaConfig | null> {
  const key = `${SETTING_PREFIX}${userId}`;
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  if (!setting || !setting.value) return null;

  try {
    const parsed = JSON.parse(setting.value);
    return parsed as AdminMfaConfig;
  } catch {
    return null;
  }
}

/**
 * Saves or updates the MFA configuration for an admin user in SystemSetting
 */
export async function saveAdminMfaConfig(userId: string, config: AdminMfaConfig): Promise<void> {
  const key = `${SETTING_PREFIX}${userId}`;
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(config) },
    update: { value: JSON.stringify(config) },
  });
}

/**
 * Deletes the MFA configuration for an admin user (disables 2FA)
 */
export async function deleteAdminMfaConfig(userId: string): Promise<void> {
  const key = `${SETTING_PREFIX}${userId}`;
  await prisma.systemSetting.delete({ where: { key } }).catch(() => {});
}
