import crypto from 'node:crypto';

interface Argon2Module {
  argon2id: number;
  hash(
    plain: string,
    options?: { type?: number; memoryCost?: number; timeCost?: number; parallelism?: number }
  ): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
}

let cachedArgon2: Argon2Module | null | undefined;

function getArgon2(): Argon2Module | null {
  if (cachedArgon2 !== undefined) {
    return cachedArgon2;
  }
  try {
    // Lazy require so bundled serverless environments without native prebuilds do not crash on module load
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedArgon2 = require('argon2') as Argon2Module;
  } catch {
    cachedArgon2 = null;
  }
  return cachedArgon2;
}

function scryptHash(plain: string, saltHex?: string): string {
  const salt = saltHex ?? crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `$scrypt$${salt}$${derived}`;
}

function scryptVerify(stored: string, plain: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[1] !== 'scrypt') return false;
  const [, , salt, expectedHex] = parts;
  const actual = crypto.scryptSync(plain, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

export async function hashPassword(plain: string): Promise<string> {
  const argon2 = getArgon2();
  if (argon2) {
    try {
      return await argon2.hash(plain, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });
    } catch {
      // Fall through to node:crypto scrypt if native addon fails at runtime
    }
  }
  return scryptHash(plain);
}

export async function verifyPassword(storedHash: string, plain: string): Promise<boolean> {
  if (storedHash.startsWith('$scrypt$')) {
    try {
      return scryptVerify(storedHash, plain);
    } catch {
      return false;
    }
  }

  const argon2 = getArgon2();
  if (argon2) {
    try {
      return await argon2.verify(storedHash, plain);
    } catch {
      return false;
    }
  }

  return false;
}

let cachedDummyHash: Promise<string> | null = null;

export function getDummyPasswordHash(): Promise<string> {
  if (!cachedDummyHash) {
    cachedDummyHash = hashPassword('__dummy_constant_time_verification_target__');
  }
  return cachedDummyHash;
}
