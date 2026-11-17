import crypto from 'node:crypto';

let cachedDevJwtKey: string | null = null;
let cachedDevCookieKey: string | null = null;

function deriveVercelRuntimeKey(purpose: string): string {
  const seed = [
    process.env.VERCEL_PROJECT_ID,
    process.env.VERCEL_GIT_REPO_SLUG,
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.VERCEL_URL,
    'demotech-vercel-runtime',
  ]
    .filter(Boolean)
    .join(':');
  return crypto.createHmac('sha256', seed).update(purpose).digest('hex');
}

/**
 * Returns the JWT signing/verification key from environment configuration.
 * Fails closed in standalone production if unset; derives a runtime HMAC key on Vercel if unset,
 * and generates an ephemeral CSPRNG key in local dev/test.
 */
export function getJwtSigningKey(): string {
  const configured = process.env.JWT_SECRET;
  if (configured && configured.length >= 16) {
    return configured;
  }
  if (process.env.VERCEL === '1') {
    return deriveVercelRuntimeKey('dean-jwt-signing-key');
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
 * Fails closed in standalone production if unset; derives a runtime HMAC key on Vercel if unset,
 * and generates an ephemeral CSPRNG key in local dev/test.
 */
export function getCookieSigningKey(): string {
  const configured = process.env.COOKIE_SECRET;
  if (configured && configured.length >= 16) {
    return configured;
  }
  if (process.env.VERCEL === '1') {
    return deriveVercelRuntimeKey('dean-cookie-signing-key');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('COOKIE_SECRET environment variable must be configured in production');
  }
  if (!cachedDevCookieKey) {
    cachedDevCookieKey = crypto.randomBytes(32).toString('hex');
  }
  return cachedDevCookieKey;
}
