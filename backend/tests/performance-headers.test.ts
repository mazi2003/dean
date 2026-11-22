import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import zlib from 'node:zlib';

vi.mock('../src/lib/prisma', async () => {
  const { getSharedMockState: load } = await import('./helpers/sharedMock');
  const state = await load();
  return { prisma: state.mockPrisma };
});

import { buildApp } from '../src/createApp';

describe('Backend Performance: Compression & Cache-Control Security Headers', () => {
  let app: FastifyInstance;
  let studentCookie: string;
  let staffCookie: string;
  const savedVercel = process.env.VERCEL;
  const savedCompress = process.env.FASTIFY_COMPRESS;

  beforeAll(async () => {
    delete process.env.VERCEL;
    delete process.env.FASTIFY_COMPRESS;
    process.env.JWT_SECRET = 'test-signing-key-min-32-chars-verified';
    process.env.COOKIE_SECRET = 'test-cookie-key-min-32-chars-verified';

    app = await buildApp();
    await app.ready();

    const stuLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { 'x-forwarded-for': '10.88.0.1' },
      payload: { email: 'aigul.nurova@demo.edu', password: 'DemoStudent123!' },
    });
    expect(stuLogin.statusCode).toBe(200);
    studentCookie = String(stuLogin.headers['set-cookie']).split(';')[0];

    const stfLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { 'x-forwarded-for': '10.88.0.2' },
      payload: { email: 'dean.office@demo.edu', password: 'DemoStaff123!' },
    });
    expect(stfLogin.statusCode).toBe(200);
    staffCookie = String(stfLogin.headers['set-cookie']).split(';')[0];
  });

  afterAll(async () => {
    await app.close();
    if (savedVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = savedVercel;
    if (savedCompress === undefined) delete process.env.FASTIFY_COMPRESS;
    else process.env.FASTIFY_COMPRESS = savedCompress;
  });

  it('sets no-cache, no-store, must-revalidate on GET /api/v1/health', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
  });

  it('enforces Cache-Control: private, no-store and Pragma: no-cache on all student-specific and staff endpoints', async () => {
    const studentEndpoints = [
      '/api/v1/auth/me',
      '/api/v1/profile',
      '/api/v1/schedule',
      '/api/v1/schedule/today',
      '/api/v1/exams',
      '/api/v1/grades',
      '/api/v1/requests',
      '/api/v1/notifications',
    ];

    for (const url of studentEndpoints) {
      const res = await app.inject({
        method: 'GET',
        url,
        headers: { cookie: studentCookie },
      });
      expect(res.statusCode, `GET ${url} should succeed`).toBe(200);
      expect(res.headers['cache-control'], `GET ${url} Cache-Control`).toBe('private, no-store');
      expect(res.headers['pragma'], `GET ${url} Pragma`).toBe('no-cache');
      expect(String(res.headers['cache-control'])).not.toContain('public');
    }

    const staffEndpoints = [
      '/api/v1/staff/requests',
      '/api/v1/staff/groups',
      '/api/v1/staff/students',
      '/api/v1/staff/announcements',
    ];

    for (const url of staffEndpoints) {
      const res = await app.inject({
        method: 'GET',
        url,
        headers: { cookie: staffCookie },
      });
      expect(res.statusCode, `GET ${url} should succeed`).toBe(200);
      expect(res.headers['cache-control'], `GET ${url} Cache-Control`).toBe('private, no-store');
      expect(res.headers['pragma'], `GET ${url} Pragma`).toBe('no-cache');
      expect(String(res.headers['cache-control'])).not.toContain('public');
    }
  });

  it('allows private short-lived client caching only on static /api/v1/request-types catalog (never public)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/request-types',
      headers: { cookie: studentCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toBe('private, max-age=300, stale-while-revalidate=60');
    expect(String(res.headers['cache-control'])).not.toContain('public');
  });

  it('compresses JSON payloads >= 1024 bytes with Brotli and Gzip and shrinks transfer size', async () => {
    const rawRes = await app.inject({
      method: 'GET',
      url: '/api/v1/staff/requests',
      headers: { cookie: staffCookie, 'accept-encoding': 'identity' },
    });
    expect(rawRes.statusCode).toBe(200);
    expect(rawRes.headers['content-encoding']).toBeUndefined();
    expect(rawRes.rawPayload.length).toBeGreaterThanOrEqual(1024);

    const brRes = await app.inject({
      method: 'GET',
      url: '/api/v1/staff/requests',
      headers: { cookie: staffCookie, 'accept-encoding': 'br, gzip' },
    });
    expect(brRes.statusCode).toBe(200);
    expect(brRes.headers['content-encoding']).toBe('br');
    expect(String(brRes.headers['vary']).toLowerCase()).toContain('accept-encoding');
    expect(brRes.rawPayload.length).toBeLessThan(rawRes.rawPayload.length);
    expect(JSON.parse(zlib.brotliDecompressSync(brRes.rawPayload).toString('utf8'))).toEqual(
      rawRes.json()
    );

    const gzipRes = await app.inject({
      method: 'GET',
      url: '/api/v1/staff/requests',
      headers: { cookie: staffCookie, 'accept-encoding': 'gzip' },
    });
    expect(gzipRes.statusCode).toBe(200);
    expect(gzipRes.headers['content-encoding']).toBe('gzip');
    expect(gzipRes.rawPayload.length).toBeLessThan(rawRes.rawPayload.length);
    expect(JSON.parse(zlib.gunzipSync(gzipRes.rawPayload).toString('utf8'))).toEqual(rawRes.json());
  });

  it('skips compression for small payloads below the 1024-byte threshold', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
      headers: { 'accept-encoding': 'br, gzip' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-encoding']).toBeUndefined();
  });

  it('delegates compression to Vercel Edge CDN when VERCEL=1 to prevent double compression', async () => {
    process.env.VERCEL = '1';
    const vercelApp = await buildApp();
    try {
      const login = await vercelApp.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: { 'x-forwarded-for': '10.88.0.3' },
        payload: { email: 'dean.office@demo.edu', password: 'DemoStaff123!' },
      });
      const cookie = String(login.headers['set-cookie']).split(';')[0];

      const res = await vercelApp.inject({
        method: 'GET',
        url: '/api/v1/staff/requests',
        headers: { cookie, 'accept-encoding': 'br, gzip' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-encoding']).toBeUndefined();
      expect(res.headers['cache-control']).toBe('private, no-store');
    } finally {
      await vercelApp.close();
      delete process.env.VERCEL;
    }
  });

  it('parallelized GET /api/v1/schedule/today preserves exact response shape', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/schedule/today',
      headers: { cookie: studentCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { today: unknown[]; next: unknown };
    expect(Array.isArray(body.today)).toBe(true);
    expect(body).toHaveProperty('next');
  });
});
