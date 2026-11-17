import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import supertest from 'supertest';
import { FastifyInstance } from 'fastify';
import { getSharedMockState } from './helpers/sharedMock';

vi.mock('../src/lib/prisma', async () => {
  const { getSharedMockState: load } = await import('./helpers/sharedMock');
  const state = await load();
  return { prisma: state.mockPrisma };
});

import { buildApp } from '../src/createApp';

describe('Auth, Security Headers, Cookies & Rate Limiting', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-signing-key-min-32-chars-verified';
    process.env.COOKIE_SECRET = 'test-cookie-key-min-32-chars-verified';
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns 200 ok with security headers', async () => {
    const res = await supertest(app.server).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.timestamp).toBe('string');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });

  it('POST /api/v1/auth/login succeeds with httpOnly SameSite=Lax cookie and no JWT in JSON body', async () => {
    const res = await supertest(app.server)
      .post('/api/v1/auth/login')
      .send({ email: '  Aigul.Nurova@DEMO.edu ', password: 'DemoStudent123!' });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('aigul.nurova@demo.edu');
    expect(res.body.role).toBe('student');
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.body.token).toBeUndefined();

    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie);
    expect(cookieStr).toContain('dean_session=');
    expect(cookieStr).toContain('HttpOnly');
    expect(cookieStr).toContain('SameSite=Lax');
  });

  it('GET /api/v1/auth/me requires valid cookie and returns current user', async () => {
    const unauth = await supertest(app.server).get('/api/v1/auth/me');
    expect(unauth.status).toBe(401);

    const agent = supertest.agent(app.server);
    const loginRes = await agent
      .post('/api/v1/auth/login')
      .send({ email: 'aigul.nurova@demo.edu', password: 'DemoStudent123!' });
    expect(loginRes.status).toBe(200);

    const meRes = await agent.get('/api/v1/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe('aigul.nurova@demo.edu');

    const logoutRes = await agent.post('/api/v1/auth/logout');
    expect(logoutRes.status).toBe(204);

    const afterLogout = await agent.get('/api/v1/auth/me');
    expect(afterLogout.status).toBe(401);
  });

  it('Invalid email and wrong password return identical 401 error (no user enumeration)', async () => {
    const badPass = await supertest(app.server)
      .post('/api/v1/auth/login')
      .send({ email: 'aigul.nurova@demo.edu', password: 'WrongPassword!' });

    const unknownEmail = await supertest(app.server)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@demo.edu', password: 'WrongPassword!' });

    expect(badPass.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(badPass.body).toEqual(unknownEmail.body);
  });

  it('Invalid login payload returns 422 VALIDATION_ERROR', async () => {
    const res = await supertest(app.server)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: '' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('GET unknown route returns 404 JSON without stack trace', async () => {
    const res = await supertest(app.server).get('/api/v1/nonexistent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(JSON.stringify(res.body)).not.toContain('at ');
  });

  it('Internal 500 error never leaks stack trace or internal error messages', async () => {
    const state = await getSharedMockState();
    const origFindUnique = state.mockPrisma.user.findUnique;
    state.mockPrisma.user.findUnique = async () => {
      throw new Error('Sensitive database connection string failure');
    };

    try {
      const agent = supertest.agent(app.server);
      const tokenRes = await supertest(app.server)
        .post('/api/v1/auth/login')
        .send({ email: 'aigul.nurova@demo.edu', password: 'DemoStudent123!' });
      expect(tokenRes.status).toBe(500);
      expect(tokenRes.body).toEqual({
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      });
      expect(JSON.stringify(tokenRes.body)).not.toContain('Sensitive database');
      void agent;
    } finally {
      state.mockPrisma.user.findUnique = origFindUnique;
    }
  });

  it('POST /api/v1/auth/login enforces rate limit (429 TOO_MANY_REQUESTS)', async () => {
    // Rate limit config is max: 10 per 15 min per IP; make enough requests to trip it
    let lastStatus = 200;
    for (let i = 0; i < 12; i++) {
      const res = await supertest(app.server)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', '203.0.113.99')
        .send({ email: 'aigul.nurova@demo.edu', password: 'WrongPassword!' });
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }
    expect(lastStatus).toBe(429);
  });
});
