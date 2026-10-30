import crypto from 'crypto';

export function deriveVaultKey(secret: string): Buffer {
  return crypto.scryptSync(secret, 'lightningdeals_salt_2026', 32, { N: 1024, r: 8, p: 1 });
}

let cachedEncryptionSecret: string | null = null;
let cachedEncryptionKey: Buffer | null = null;
export function getDerivedEncryptionKey(): Buffer {
  const secret = process.env.DATA_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || 'lightningdeals_default_vault_secret';
  if (cachedEncryptionSecret !== secret) {
    cachedEncryptionSecret = secret;
    cachedEncryptionKey = deriveVaultKey(secret);
  }
  return cachedEncryptionKey!;
}

let cachedOldSecret: string | null = null;
let cachedOldEncryptionKey: Buffer | null = null;
export function getDerivedOldEncryptionKey(): Buffer | null {
  const secret = process.env.OLD_DATA_ENCRYPTION_KEY || process.env.OLD_ENCRYPTION_KEY;
  if (!secret) {
    cachedOldSecret = null;
    cachedOldEncryptionKey = null;
    return null;
  }
  if (cachedOldSecret !== secret) {
    cachedOldSecret = secret;
    cachedOldEncryptionKey = deriveVaultKey(secret);
  }
  return cachedOldEncryptionKey;
}

const IV_LENGTH_GCM = 12; // 96-bit IV for AES-256-GCM

export function encryptText(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH_GCM);
  const key = getDerivedEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `gcm:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function isEncrypted(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return text.startsWith('gcm:') || (text.includes(':') && text.length > 32);
}

export function tryDecryptWithKey(text: string, key: Buffer): string | null {
  try {
    // Format 1: AES-256-GCM AEAD (gcm:iv:authTag:ciphertext)
    if (text.startsWith('gcm:')) {
      const parts = text.split(':');
      if (parts.length !== 4) return null;
      const [, ivHex, tagHex, cipherHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(tagHex, 'hex');
      const encryptedText = Buffer.from(cipherHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedText, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }

    // Format 2: Legacy AES-256-CBC backwards compatibility (iv:ciphertext)
    const textParts = text.split(':');
    if (textParts.length < 2) return null;
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return null;
  }
}

export function decryptText(text: string): string {
  if (!text) return '';

  // 1. Primary: Attempt decryption with active ENCRYPTION_KEY / DATA_ENCRYPTION_KEY
  const primaryDecrypted = tryDecryptWithKey(text, getDerivedEncryptionKey());
  if (primaryDecrypted !== null) return primaryDecrypted;

  // 2. Dual-Key Transition: Fallback to OLD_ENCRYPTION_KEY if configured during key rotation
  const oldKey = getDerivedOldEncryptionKey();
  if (oldKey) {
    const fallbackDecrypted = tryDecryptWithKey(text, oldKey);
    if (fallbackDecrypted !== null) {
      return fallbackDecrypted;
    }
  }

  // 3. Fail closed if the payload was encrypted: NEVER return raw ciphertext as plaintext
  if (isEncrypted(text)) {
    console.error('[SECURITY ERROR] Vault decryption failed for encrypted payload (invalid key or corrupted tag). Failing closed.');
    return '';
  }

  // 4. Return unencrypted legacy plaintext only if it was never ciphertext
  return text;
}
