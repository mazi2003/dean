import type { PrismaClient } from '@prisma/client';
import { getServerlessFallbackPrisma } from './serverlessFallbackPrisma';

const globalForPrisma = globalThis as unknown as {
  realPrisma?: PrismaClient | null;
  useFallbackOnly?: boolean;
};

function resolveConnectionUrl(): string | undefined {
  return (
    process.env.DATABASE_URL_POOLED ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL
  )?.trim() || undefined;
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

function createModelWrapper(modelName: keyof PrismaClient, methods: string[]) {
  const wrapper: Record<string, (...args: unknown[]) => Promise<unknown>> = {};

  for (const methodProp of methods) {
    wrapper[methodProp] = async (...args: unknown[]) => {
      const real = getRealPrismaClient();
      if (real) {
        try {
          const model = (real as unknown as Record<string, Record<string, (...a: unknown[]) => Promise<unknown>>>)[
            String(modelName)
          ];
          const result = await model[methodProp](...args);

          if (
            process.env.VERCEL === '1' &&
            modelName === 'user' &&
            methodProp === 'findUnique' &&
            result === null
          ) {
            const totalUsers = await model.count();
            if (totalUsers === 0) {
              globalForPrisma.useFallbackOnly = true;
              const fallback = await getServerlessFallbackPrisma();
              const fbModel = (fallback as unknown as Record<string, Record<string, (...a: unknown[]) => Promise<unknown>>>)[
                String(modelName)
              ];
              return fbModel[methodProp](...args);
            }
          }

          return result;
        } catch (err) {
          if (process.env.VERCEL === '1') {
            globalForPrisma.useFallbackOnly = true;
          } else {
            throw err;
          }
        }
      }

      const fallback = await getServerlessFallbackPrisma();
      const fbModel = (fallback as unknown as Record<string, Record<string, (...a: unknown[]) => Promise<unknown>>>)[
        String(modelName)
      ];
      return fbModel[methodProp](...args);
    };
  }

  return wrapper;
}

export const prisma: PrismaClient = {
  user: createModelWrapper('user', ['findUnique', 'findMany', 'count']),
  studentProfile: createModelWrapper('studentProfile', ['findUnique', 'findMany']),
  group: createModelWrapper('group', ['findMany', 'findFirst']),
  room: createModelWrapper('room', ['findFirst', 'create']),
  exam: createModelWrapper('exam', ['findMany', 'findFirst', 'create', 'update']),
  scheduleEntry: createModelWrapper('scheduleEntry', ['findMany', 'findFirst', 'findUnique', 'update']),
  grade: createModelWrapper('grade', ['findMany']),
  requestType: createModelWrapper('requestType', ['findMany', 'findUnique']),
  request: createModelWrapper('request', ['count', 'findMany', 'findFirst', 'findUnique', 'create', 'update']),
  notification: createModelWrapper('notification', ['count', 'findMany', 'findFirst', 'update', 'updateMany', 'create', 'createMany']),
  announcement: createModelWrapper('announcement', ['findMany', 'create', 'delete']),
  $transaction: async <T>(ops: Array<Promise<T>>) => Promise.all(ops),
} as unknown as PrismaClient;
