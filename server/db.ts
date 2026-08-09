import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

export const prisma = new PrismaClient();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'lightningdeals_secure_encryption_key_32_bytes_long!!'; // Must be 32 chars
const IV_LENGTH = 16;

export function encryptText(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptText(text: string): string {
  if (!text) return '';
  try {
    const textParts = text.split(':');
    if (textParts.length < 2) return text;
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return text;
  }
}

// Convert BigInt to string in JSON serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
