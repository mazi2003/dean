import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import supertest from 'supertest';

import defaultApp from '../src/app';
import { buildApp, resolveCorsOrigins } from '../src/createApp';

describe('Vercel Fastify entrypoint, zero-DB fallback & CORS configuration', () => {
  const originalEnv = { ...process.env };

  beforeAll(async () => {
    delete process.env.DATABASE_URL;
    process.env.VERCEL = '1';
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

  it('authenticates student and staff accounts on Vercel even when DATABASE_URL and JWT_SECRET are unset', async () => {
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
    delete process.env.COOKIE_SECRET;
    process.env.NODE_ENV = 'production';
    process.env.VERCEL = '1';
    process.env.COOKIE_SECURE = 'false';

    const app = await buildApp();
    try {
      const studentAgent = supertest.agent(app.server);
      const loginRes = await studentAgent
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', '10.99.0.1')
        .send({ email: 'aigul.nurova@demo.edu', password: 'DemoStudent123!' });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.email).toBe('aigul.nurova@demo.edu');
      expect(loginRes.body.role).toBe('student');

      const profileRes = await studentAgent.get('/api/v1/profile');
      expect(profileRes.status).toBe(200);
      expect(profileRes.body.group).toBe('ДУ-101');

      const staffAgent = supertest.agent(app.server);
      const staffLogin = await staffAgent
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', '10.99.0.2')
        .send({ email: 'dean.office@demo.edu', password: 'DemoStaff123!' });
      expect(staffLogin.status).toBe(200);
      expect(staffLogin.body.role).toBe('staff');

      const staffGroups = await staffAgent.get('/api/v1/staff/groups');
      expect(staffGroups.status).toBe(200);
      expect(staffGroups.body.length).toBe(4);
    } finally {
      await app.close();
    }
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
