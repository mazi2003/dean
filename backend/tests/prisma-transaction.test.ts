import { describe, it, expect, afterEach, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '../src/lib/prisma';

const globalForPrisma = globalThis as unknown as {
  realPrisma?: PrismaClient | null;
  useFallbackOnly?: boolean;
  checkedSeededUsers?: boolean;
};

describe('prisma.$transaction delegation and serverless fallback', () => {
  const savedRealPrisma = globalForPrisma.realPrisma;
  const savedUseFallbackOnly = globalForPrisma.useFallbackOnly;
  const savedCheckedSeededUsers = globalForPrisma.checkedSeededUsers;
  const savedVercel = process.env.VERCEL;

  afterEach(() => {
    globalForPrisma.realPrisma = savedRealPrisma;
    globalForPrisma.useFallbackOnly = savedUseFallbackOnly;
    globalForPrisma.checkedSeededUsers = savedCheckedSeededUsers;
    if (savedVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = savedVercel;
    vi.restoreAllMocks();
  });

  it('delegates interactive callback $transaction(async (tx) => ...) to realPrisma.$transaction', async () => {
    delete process.env.VERCEL;
    globalForPrisma.useFallbackOnly = false;

    const fakeTx = { marker: 'real-tx-client' };
    const realTransactionSpy = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(fakeTx));
    globalForPrisma.realPrisma = {
      $transaction: realTransactionSpy,
    } as unknown as PrismaClient;

    const result = await prisma.$transaction(async (tx) => {
      expect(tx).toBe(fakeTx);
      return { ok: true, txMarker: (tx as unknown as { marker: string }).marker };
    });

    expect(realTransactionSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true, txMarker: 'real-tx-client' });
  });

  it('preserves lazy PrismaPromise for batched array $transaction([...]) when realPrisma is active and !VERCEL', async () => {
    delete process.env.VERCEL;
    globalForPrisma.useFallbackOnly = false;

    let eagerEvaluated = false;
    function makeLazyPrismaPromise(label: string) {
      const promiseObj = {
        [Symbol.toStringTag]: 'PrismaPromise',
        label,
        then(onFulfilled?: (v: unknown) => unknown, onRejected?: (r: unknown) => unknown) {
          eagerEvaluated = true;
          return Promise.resolve({ label }).then(onFulfilled, onRejected);
        },
      };
      return promiseObj as unknown as Promise<unknown>;
    }

    const requestUpdateSpy = vi.fn(() => makeLazyPrismaPromise('request.update'));
    const notifCreateSpy = vi.fn(() => makeLazyPrismaPromise('notification.create'));
    const realTransactionSpy = vi.fn(async (ops: Array<Promise<unknown>>) => {
      expect(eagerEvaluated).toBe(false);
      expect(ops).toHaveLength(2);
      expect((ops[0] as unknown as Record<symbol, string>)[Symbol.toStringTag]).toBe(
        'PrismaPromise'
      );
      expect((ops[1] as unknown as Record<symbol, string>)[Symbol.toStringTag]).toBe(
        'PrismaPromise'
      );
      return Promise.all(ops);
    });

    globalForPrisma.realPrisma = {
      request: { update: requestUpdateSpy },
      notification: { create: notifCreateSpy },
      $transaction: realTransactionSpy,
    } as unknown as PrismaClient;

    const res = await prisma.$transaction([
      prisma.request.update({
        where: { id: 'req-1' },
        data: { status: 'ready' },
      }),
      prisma.notification.create({
        data: {
          userId: 'user-1',
          kind: 'request_update',
          title: 'Test',
          body: 'Body',
          link: '/requests',
        },
      }),
    ]);

    expect(realTransactionSpy).toHaveBeenCalledTimes(1);
    expect(eagerEvaluated).toBe(true);
    expect(res).toEqual([{ label: 'request.update' }, { label: 'notification.create' }]);
  });

  it('rethrows non-connection errors from realPrisma.$transaction without falling back', async () => {
    process.env.VERCEL = '1';
    globalForPrisma.useFallbackOnly = false;

    const businessErr = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    globalForPrisma.realPrisma = {
      $transaction: vi.fn(async () => {
        throw businessErr;
      }),
    } as unknown as PrismaClient;

    await expect(prisma.$transaction(async () => 'never')).rejects.toThrow(
      'Unique constraint failed'
    );
    expect(globalForPrisma.useFallbackOnly).toBe(false);
  });

  it('runs interactive callback and batched array against serverless fallback when realPrisma is null', async () => {
    delete process.env.VERCEL;
    globalForPrisma.useFallbackOnly = false;
    globalForPrisma.realPrisma = null;

    const cbResult = await prisma.$transaction(async (tx) => {
      const usersCount = await tx.user.count();
      return usersCount;
    });
    expect(cbResult).toBeGreaterThanOrEqual(5);

    const arrResult = await prisma.$transaction([
      prisma.group.findMany(),
      prisma.requestType.findMany(),
    ]);
    expect(arrResult).toHaveLength(2);
    expect(Array.isArray(arrResult[0])).toBe(true);
    expect(Array.isArray(arrResult[1])).toBe(true);
  });

  it('flips useFallbackOnly on Vercel P1001 connection error and replays callback on serverlessFallbackPrisma', async () => {
    process.env.VERCEL = '1';
    globalForPrisma.useFallbackOnly = false;

    const connErr = Object.assign(new Error("Can't reach database server"), { code: 'P1001' });
    const realTransactionSpy = vi.fn(async () => {
      throw connErr;
    });
    globalForPrisma.realPrisma = {
      $transaction: realTransactionSpy,
    } as unknown as PrismaClient;

    const result = await prisma.$transaction(async (tx) => {
      const types = await tx.requestType.findMany();
      return types.length;
    });

    expect(realTransactionSpy).toHaveBeenCalledTimes(1);
    expect(globalForPrisma.useFallbackOnly).toBe(true);
    expect(result).toBe(6);
  });
});
