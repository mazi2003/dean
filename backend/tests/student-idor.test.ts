import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import supertest from 'supertest';
import { FastifyInstance } from 'fastify';
import { SeededIds } from './helpers/mockPrisma';
import { getSharedMockState } from './helpers/sharedMock';

vi.mock('../src/lib/prisma', async () => {
  const { getSharedMockState: load } = await import('./helpers/sharedMock');
  const state = await load();
  return { prisma: state.mockPrisma };
});

import { buildApp } from '../src/app';

describe('Student API Flows, Data Isolation & IDOR Protection', () => {
  let app: FastifyInstance;
  let ids: SeededIds;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-signing-key-min-32-chars-verified';
    process.env.COOKIE_SECRET = 'test-cookie-key-min-32-chars-verified';
    const state = await getSharedMockState();
    ids = state.ids;
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  async function loginAs(email: string, password = 'DemoStudent123!') {
    const agent = supertest.agent(app.server);
    const res = await agent.post('/api/v1/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    return agent;
  }

  it('All student routes reject unauthenticated requests with 401', async () => {
    const routes = [
      ['get', '/api/v1/profile'],
      ['get', '/api/v1/schedule'],
      ['get', '/api/v1/schedule/today'],
      ['get', '/api/v1/grades'],
      ['get', '/api/v1/request-types'],
      ['get', '/api/v1/requests'],
      ['post', '/api/v1/requests'],
      ['get', '/api/v1/notifications'],
      ['post', '/api/v1/notifications/read-all'],
      ['post', '/api/v1/assistant/ask'],
    ] as const;

    for (const [method, url] of routes) {
      const res = await supertest(app.server)[method](url);
      expect(res.status).toBe(401);
    }
  });

  it('GET /api/v1/profile returns student academic attributes accurately', async () => {
    const aigul = await loginAs('aigul.nurova@demo.edu');
    const res = await aigul.get('/api/v1/profile');
    expect(res.status).toBe(200);
    expect(res.body.group).toBe('DU-101');
    expect(res.body.faculty).toBe('Faculty of International Relations');
    expect(res.body.year).toBe(2);
    expect(res.body.studentNumber).toBe('DU-2023-001');
  });

  it('GET /api/v1/schedule & /schedule/today isolate groups and validate query parameters', async () => {
    const aigul = await loginAs('aigul.nurova@demo.edu');
    const bad = await aigul.get('/api/v1/schedule?from=invalid-date');
    expect(bad.status).toBe(422);

    const weekRes = await aigul.get('/api/v1/schedule');
    expect(weekRes.status).toBe(200);
    expect(Array.isArray(weekRes.body)).toBe(true);
    expect(weekRes.body.every((s: { groupId: string }) => s.groupId === 'DU-101')).toBe(true);

    const todayRes = await aigul.get('/api/v1/schedule/today');
    expect(todayRes.status).toBe(200);
    expect(Array.isArray(todayRes.body.today)).toBe(true);
    expect(todayRes.body.next).not.toBeNull();
  });

  it('GET /api/v1/grades returns individualized scores and detects Timur failed subject', async () => {
    const aigul = await loginAs('aigul.nurova@demo.edu');
    const aGrades = await aigul.get('/api/v1/grades');
    expect(aGrades.status).toBe(200);
    expect(aGrades.body.averagePoints).toBeGreaterThan(80);
    expect(aGrades.body.upcomingExams.length).toBe(2);

    const timur = await loginAs('timur.belov@demo.edu');
    const tGrades = await timur.get('/api/v1/grades');
    expect(tGrades.status).toBe(200);
    const failed = tGrades.body.items.find((i: { creditStatus: string }) => i.creditStatus === 'failed');
    expect(failed).toBeDefined();
    expect(failed.subject).toBe('Statistics');
    expect(failed.grade).toBe(2);
  });

  it('Requests lifecycle, pagination, validation, and strict IDOR 404 isolation', async () => {
    const aigul = await loginAs('aigul.nurova@demo.edu');
    const timur = await loginAs('timur.belov@demo.edu');
    const lina = await loginAs('lina.okafor@demo.edu');

    // Catalog
    const types = await aigul.get('/api/v1/request-types');
    expect(types.status).toBe(200);
    expect(types.body.length).toBe(6);

    // Lina has empty requests list
    const linaReqs = await lina.get('/api/v1/requests');
    expect(linaReqs.status).toBe(200);
    expect(linaReqs.body.total).toBe(0);
    expect(linaReqs.body.items).toEqual([]);

    // IDOR: Aigul reading Timur's request returns 404 (not 403)
    const idorGet = await aigul.get(`/api/v1/requests/${ids.timurReqReadyId}`);
    expect(idorGet.status).toBe(404);

    // IDOR: Aigul cancelling Timur's request returns 404
    const idorCancel = await aigul.post(`/api/v1/requests/${ids.timurReqNeedsInfoId}/cancel`);
    expect(idorCancel.status).toBe(404);

    // Invalid UUID format returns 404 cleanly
    const badId = await aigul.get('/api/v1/requests/not-a-uuid');
    expect(badId.status).toBe(404);

    // Create new request & cancel workflow
    const badCreate = await aigul.post('/api/v1/requests').send({ typeCode: 'invalid_type', data: {} });
    expect(badCreate.status).toBe(422);

    const created = await aigul.post('/api/v1/requests').send({
      typeCode: 'military_certificate',
      data: { militaryOffice: 'OVK Ramenki', copies: 1 },
    });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('submitted');
    expect(created.body.history.length).toBe(1);

    const ownGet = await aigul.get(`/api/v1/requests/${created.body.id}`);
    expect(ownGet.status).toBe(200);
    expect(ownGet.body.id).toBe(created.body.id);

    const cancelOwn = await aigul.post(`/api/v1/requests/${created.body.id}/cancel`);
    expect(cancelOwn.status).toBe(200);
    expect(cancelOwn.body.status).toBe('cancelled');

    // Cannot cancel ready request -> 409 Conflict
    const conflictCancel = await timur.post(`/api/v1/requests/${ids.timurReqReadyId}/cancel`);
    expect(conflictCancel.status).toBe(409);

    // Pagination check
    const paged = await timur.get('/api/v1/requests?page=1&pageSize=1');
    expect(paged.status).toBe(200);
    expect(paged.body.total).toBe(2);
    expect(paged.body.items.length).toBe(1);
  });

  it('Notifications filter, mark read/all, and strict IDOR 404 isolation', async () => {
    const aigul = await loginAs('aigul.nurova@demo.edu');
    const lina = await loginAs('lina.okafor@demo.edu');

    // IDOR: Aigul tries to mark Lina's notification read -> 404
    const idorRead = await aigul.post(`/api/v1/notifications/${ids.linaNotifUnreadId}/read`);
    expect(idorRead.status).toBe(404);

    // Lina has 3 unread notifications
    const unreadRes = await lina.get('/api/v1/notifications?unread=true');
    expect(unreadRes.status).toBe(200);
    expect(unreadRes.body.unreadCount).toBe(3);
    expect(unreadRes.body.items.length).toBe(3);

    // Mark single notification read
    const markOne = await lina.post(`/api/v1/notifications/${ids.linaNotifUnreadId}/read`);
    expect(markOne.status).toBe(204);

    const afterOne = await lina.get('/api/v1/notifications');
    expect(afterOne.body.unreadCount).toBe(2);

    // Mark all read
    const markAll = await lina.post('/api/v1/notifications/read-all');
    expect(markAll.status).toBe(204);

    const afterAll = await lina.get('/api/v1/notifications');
    expect(afterAll.body.unreadCount).toBe(0);
  });

  it('AI Assistant enforces validation, graceful fallback without API key, and caller-only context isolation', async () => {
    const timur = await loginAs('timur.belov@demo.edu');

    // Empty / oversized rejected by Zod
    const tooLong = await timur.post('/api/v1/assistant/ask').send({ question: 'x'.repeat(501) });
    expect(tooLong.status).toBe(422);

    // Graceful disabled response when AI_API_KEY is unset
    delete process.env.AI_API_KEY;
    const disabled = await timur.post('/api/v1/assistant/ask').send({ question: 'Когда пересдача?' });
    expect(disabled.status).toBe(200);
    expect(disabled.body.answer).toContain('not configured');

    // Scoped prompt verification with mocked fetch
    process.env.AI_API_KEY = 'dummy-test-key';
    let capturedPrompt = '';
    const origFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (_url, init) => {
      capturedPrompt = String(init?.body ?? '');
      return {
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'По данным вашей зачетки есть пересдача по Statistics.' }] } }],
        }),
      } as unknown as Response;
    }) as typeof fetch;

    try {
      const res = await timur.post('/api/v1/assistant/ask').send({ question: 'Какие у меня долги?' });
      expect(res.status).toBe(200);
      expect(res.body.answer).toContain('Statistics');
      expect(capturedPrompt).toContain('DU-205');
      expect(capturedPrompt).toContain('Statistics');
      // NEVER contains other students' data
      expect(capturedPrompt).not.toContain('Aigul');
      expect(capturedPrompt).not.toContain('Lina');
      expect(capturedPrompt).not.toContain('DU-101');
    } finally {
      globalThis.fetch = origFetch;
      delete process.env.AI_API_KEY;
    }
  });
});
