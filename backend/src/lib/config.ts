import crypto from 'node:crypto';

let cachedDevJwtKey: string | null = null;
let cachedDevCookieKey: string | null = null;

/**
 * Returns the JWT signing/verification key from environment configuration.
 * Fails closed in production if unset; generates an ephemeral CSPRNG key in local dev/test.
 */
export function getJwtSigningKey(): string {
  const configured = process.env.JWT_SECRET;
  if (configured && configured.length >= 16) {
    return configured;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be configured in production');
  }
  if (!cachedDevJwtKey) {
    cachedDevJwtKey = crypto.randomBytes(32).toString('hex');
  }
  return cachedDevJwtKey;
}

/**
 * Returns the cookie signing key from environment configuration.
 * Fails closed in production if unset; generates an ephemeral CSPRNG key in local dev/test.
 */
export function getCookieSigningKey(): string {
  const configured = process.env.COOKIE_SECRET;
  if (configured && configured.length >= 16) {
    return configured;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('COOKIE_SECRET environment variable must be configured in production');
  }
  if (!cachedDevCookieKey) {
    cachedDevCookieKey = crypto.randomBytes(32).toString('hex');
  }
  return cachedDevCookieKey;
}
