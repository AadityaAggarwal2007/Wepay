import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a string value
 * @returns Encrypted string (iv:encrypted)
 */
export function encrypt(text: string | null): string | null {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt an encrypted string value
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string | null): string | null {
  if (!encryptedText) return null;
  const parts = encryptedText.split(':');
  if (parts.length < 2) return null;
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts.slice(1).join(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
