import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import supertest from 'supertest';

vi.mock('../src/lib/prisma', async () => {
  const { getSharedMockState: load } = await import('./helpers/sharedMock');
  const state = await load();
  return { prisma: state.mockPrisma };
});

import defaultApp from '../src/app';
import { resolveCorsOrigins } from '../src/createApp';

describe('Vercel Fastify entrypoint & CORS configuration', () => {
  const originalEnv = { ...process.env };

  beforeAll(async () => {
    await defaultApp.ready();
  });

  afterAll(async () => {
    await defaultApp.close();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('default Fastify export serves /api/v1/health, ?db=1 check, and 404 JSON', async () => {
    const healthRes = await supertest(defaultApp.server).get('/api/v1/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.status).toBe('ok');

    const dbHealthRes = await supertest(defaultApp.server).get('/api/v1/health?db=1');
    expect(dbHealthRes.status).toBe(200);
    expect(dbHealthRes.body.db).toBe('ok');
    expect(dbHealthRes.body.seeded).toBe(true);

    const missingRes = await supertest(defaultApp.server).get('/api/v1/does-not-exist');
    expect(missingRes.status).toBe(404);
    expect(missingRes.body.code).toBe('NOT_FOUND');
  });

  it('resolves CORS origins from CORS_ORIGIN and Vercel deployment hostnames', () => {
    delete process.env.CORS_ORIGIN;
    delete process.env.VERCEL;
    expect(resolveCorsOrigins()).toBe('http://localhost:5173');

    process.env.VERCEL = '1';
    process.env.VERCEL_URL = 'dean-office-preview.vercel.app';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'dean-office.vercel.app';
    process.env.CORS_ORIGIN = 'https://custom.example.com, https://dean-office.vercel.app';

    expect(resolveCorsOrigins()).toEqual([
      'https://custom.example.com',
      'https://dean-office.vercel.app',
      'https://dean-office-preview.vercel.app',
    ]);
  });
});
