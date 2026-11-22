import type { Prisma, PrismaClient } from '@prisma/client';
import { isVercelRuntime } from './config';
import { getServerlessFallbackPrisma } from './serverlessFallbackPrisma';

const globalForPrisma = globalThis as unknown as {
  realPrisma?: PrismaClient | null;
  useFallbackOnly?: boolean;
  checkedSeededUsers?: boolean;
};

function resolveConnectionUrl(): string | undefined {
  return (
    (
      process.env.DATABASE_URL_POOLED ??
      process.env.DATABASE_URL ??
      process.env.POSTGRES_PRISMA_URL ??
      process.env.POSTGRES_URL
    )?.trim() || undefined
  );
}

function isConnectionError(err: unknown): boolean {
  const errObj = err as { code?: string; name?: string; message?: string } | null;
  return Boolean(
    errObj?.name === 'PrismaClientInitializationError' ||
    (typeof errObj?.code === 'string' && /^P10\d\d$/.test(errObj.code)) ||
    (typeof errObj?.message === 'string' &&
      /Can't reach database server|Connection refused|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(
        errObj.message
      ))
  );
}

function getRealPrismaClient(): PrismaClient | null {
  if (globalForPrisma.useFallbackOnly) {
    return null;
  }
  if (globalForPrisma.realPrisma !== undefined) {
    return globalForPrisma.realPrisma;
  }

  const connectionUrl = resolveConnectionUrl();
  if (!connectionUrl) {
    globalForPrisma.realPrisma = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient: PrismaClientCtor } = require('@prisma/client') as {
      PrismaClient: new (opts?: unknown) => PrismaClient;
    };
    const client = new PrismaClientCtor({
      datasources: { db: { url: connectionUrl } },
      log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
    });
    globalForPrisma.realPrisma = client;
    return client;
  } catch {
    globalForPrisma.realPrisma = null;
    return null;
  }
}

type DynamicModelDelegate = Record<string, (...a: unknown[]) => Promise<unknown>>;

function createModelWrapper(modelName: keyof PrismaClient, methods: string[]) {
  const wrapper: Record<string, (...args: unknown[]) => Promise<unknown>> = {};

  for (const methodProp of methods) {
    wrapper[methodProp] = (...args: unknown[]): Promise<unknown> => {
      const real = getRealPrismaClient();
      if (real && !isVercelRuntime()) {
        // Keep PrismaPromise lazy (non-async) so batched $transaction([...]) works natively
        const model = (real as unknown as Record<string, DynamicModelDelegate>)[String(modelName)];
        return model[methodProp](...args);
      }

      return (async () => {
        if (real) {
          try {
            const model = (real as unknown as Record<string, DynamicModelDelegate>)[
              String(modelName)
            ];
            const result = await model[methodProp](...args);

            if (
              isVercelRuntime() &&
              !globalForPrisma.checkedSeededUsers &&
              modelName === 'user' &&
              methodProp === 'findUnique' &&
              result === null
            ) {
              const totalUsers = await model.count();
              globalForPrisma.checkedSeededUsers = true;
              if (totalUsers === 0) {
                globalForPrisma.useFallbackOnly = true;
                const fallback = await getServerlessFallbackPrisma();
                const fbModel = (fallback as unknown as Record<string, DynamicModelDelegate>)[
                  String(modelName)
                ];
                return fbModel[methodProp](...args);
              }
            }

            return result;
          } catch (err) {
            if (isVercelRuntime() && isConnectionError(err)) {
              globalForPrisma.useFallbackOnly = true;
            } else {
              throw err;
            }
          }
        }

        const fallback = await getServerlessFallbackPrisma();
        const fbModel = (fallback as unknown as Record<string, DynamicModelDelegate>)[
          String(modelName)
        ];
        return fbModel[methodProp](...args);
      })();
    };
  }

  return wrapper;
}

type TransactionCallback<T> = (tx: Prisma.TransactionClient) => Promise<T>;

async function runTransaction<T>(
  arg: Array<Promise<T>> | TransactionCallback<T>,
  options?: unknown
): Promise<T | T[]> {
  const real = getRealPrismaClient();
  if (real) {
    try {
      if (typeof arg === 'function') {
        return await (
          real.$transaction as unknown as (fn: TransactionCallback<T>, opts?: unknown) => Promise<T>
        )(arg, options);
      }
      return await (
        real.$transaction as unknown as (ops: Array<Promise<T>>, opts?: unknown) => Promise<T[]>
      )(arg, options);
    } catch (err) {
      if (isVercelRuntime() && isConnectionError(err)) {
        globalForPrisma.useFallbackOnly = true;
      } else {
        throw err;
      }
    }
  }

  const fallback = await getServerlessFallbackPrisma();
  if (typeof arg === 'function') {
    return arg(fallback as unknown as Prisma.TransactionClient);
  }
  return Promise.all(arg);
}

export const prisma: PrismaClient = {
  user: createModelWrapper('user', ['findUnique', 'findMany', 'count']),
  studentProfile: createModelWrapper('studentProfile', ['findUnique', 'findMany']),
  group: createModelWrapper('group', ['findMany', 'findFirst']),
  room: createModelWrapper('room', ['findFirst', 'create']),
  exam: createModelWrapper('exam', ['findMany', 'findFirst', 'create', 'update']),
  scheduleEntry: createModelWrapper('scheduleEntry', [
    'findMany',
    'findFirst',
    'findUnique',
    'update',
  ]),
  grade: createModelWrapper('grade', ['findMany']),
  requestType: createModelWrapper('requestType', ['findMany', 'findUnique']),
  request: createModelWrapper('request', [
    'count',
    'findMany',
    'findFirst',
    'findUnique',
    'create',
    'update',
  ]),
  notification: createModelWrapper('notification', [
    'count',
    'findMany',
    'findFirst',
    'update',
    'updateMany',
    'create',
    'createMany',
  ]),
  announcement: createModelWrapper('announcement', ['findMany', 'create', 'delete']),
  $transaction: runTransaction,
} as unknown as PrismaClient;
