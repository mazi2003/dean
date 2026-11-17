// Prisma client singleton
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const connectionUrl =
  process.env.DATABASE_URL_POOLED ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(connectionUrl ? { datasources: { db: { url: connectionUrl } } } : {}),
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  });

globalForPrisma.prisma = prisma;
