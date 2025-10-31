// src/lib/utils/token-utils.ts
import crypto from 'crypto';

/**
 * Generate a secure random token with expiration date
 *
 * @param expiryDays - Number of days until token expires (default: 7)
 * @returns Object containing token and expiration date
 *
 * @example
 * const { token, expiresAt } = generateInvitationToken(7);
 * // Store token and expiresAt in database
 */
export function generateInvitationToken(expiryDays: number = 7) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  return { token, expiresAt };
}

/**
 * Generate a secure verification code (numeric)
 *
 * @param length - Length of the code (default: 6)
 * @returns Numeric code as string
 */
export function generateVerificationCode(length: number = 6): string {
  const digits = '0123456789';
  let code = '';

  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += digits[randomBytes[i] % digits.length];
  }

  return code;
}

/**
 * Generate a secure API key
 *
 * @param prefix - Optional prefix for the key (e.g., 'pk_', 'sk_')
 * @returns API key string
 */
export function generateApiKey(prefix: string = ''): string {
  const key = crypto.randomBytes(32).toString('hex');
  return prefix ? `${prefix}${key}` : key;
}

/**
 * Check if a token has expired
 *
 * @param expiresAt - The expiration date
 * @returns True if expired, false otherwise
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Hash a token for secure storage
 *
 * @param token - The token to hash
 * @returns Hashed token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
