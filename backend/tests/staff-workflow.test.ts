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

import { buildApp } from '../src/createApp';

describe('Staff Role-Based Access Control & Dean Office Workflows', () => {
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

  let testIpSeq = 1;
  async function loginAs(email: string, password: string) {
    const agent = supertest.agent(app.server);
    const ip = `10.20.0.${testIpSeq++}`;
    const res = await agent
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip)
      .send({ email, password });
    expect(res.status).toBe(200);
    return agent;
  }

  it('Students are rejected with 403 Forbidden from EVERY /staff/* endpoint', async () => {
    const aigul = await loginAs('aigul.nurova@demo.edu', 'DemoStudent123!');

    expect((await aigul.get('/api/v1/staff/requests')).status).toBe(403);
    expect(
      (
        await aigul
          .post(`/api/v1/staff/requests/${ids.aigulReqId}/status`)
          .send({ status: 'ready' })
      ).status
    ).toBe(403);
    expect((await aigul.get('/api/v1/staff/announcements')).status).toBe(403);
    expect(
      (await aigul.post('/api/v1/staff/announcements').send({ title: 'x', body: 'y' })).status
    ).toBe(403);
    expect(
      (await aigul.delete('/api/v1/staff/announcements/55555555-5555-4555-8555-555555555501'))
        .status
    ).toBe(403);
    expect(
      (
        await aigul
          .post('/api/v1/staff/schedule-changes')
          .send({ scheduleEntryId: ids.du101ScheduleId, status: 'cancelled' })
      ).status
    ).toBe(403);
    expect((await aigul.post('/api/v1/staff/exam-changes').send({ examId: 'ex-1' })).status).toBe(
      403
    );
    expect((await aigul.get('/api/v1/staff/groups')).status).toBe(403);
    expect((await aigul.get('/api/v1/staff/students')).status).toBe(403);
    expect((await aigul.get('/api/v1/staff/groups/DU-101/students')).status).toBe(403);
    expect((await aigul.get(`/api/v1/staff/students/${ids.timurUserId}/dossier`)).status).toBe(403);
    expect((await aigul.get('/api/v1/staff/exams')).status).toBe(403);
    expect(
      (
        await aigul.post('/api/v1/staff/exams').send({
          code: 'X-1',
          groupId: 'DU-101',
          subject: 'X',
          format: 'Y',
          examiner: 'Z',
          date: '2026-12-20',
          time: '10:00',
          room: '101',
        })
      ).status
    ).toBe(403);
    expect((await aigul.post('/api/v1/staff/exams/ex-101-1/reset')).status).toBe(403);
  });

  it('Staff cannot submit student requests via POST /api/v1/requests (403)', async () => {
    const staff = await loginAs('dean.office@demo.edu', 'DemoStaff123!');
    const res = await staff
      .post('/api/v1/requests')
      .send({ typeCode: 'study_certificate', data: {} });
    expect(res.status).toBe(403);
  });

  it('Staff status transition updates timeline and creates notification for target student', async () => {
    const staff = await loginAs('dean.office@demo.edu', 'DemoStaff123!');
    const aigul = await loginAs('aigul.nurova@demo.edu', 'DemoStudent123!');

    // List staff inbox
    const inbox = await staff.get('/api/v1/staff/requests');
    expect(inbox.status).toBe(200);
    expect(inbox.body.items.length).toBeGreaterThanOrEqual(3);

    // Transition Aigul's request: in_review -> ready
    const transition = await staff
      .post(`/api/v1/staff/requests/${ids.aigulReqId}/status`)
      .send({ status: 'ready', comment: 'Подписано ЭЦП' });
    expect(transition.status).toBe(200);
    expect(transition.body.status).toBe('ready');
    expect(transition.body.history.at(-1).comment).toBe('Подписано ЭЦП');

    // Invalid transition ready -> submitted returns 409 Conflict
    const invalidTransition = await staff
      .post(`/api/v1/staff/requests/${ids.aigulReqId}/status`)
      .send({ status: 'submitted' });
    expect(invalidTransition.status).toBe(409);

    // Student sees status update & generated notification
    const aigulNotifs = await aigul.get('/api/v1/notifications');
    expect(aigulNotifs.status).toBe(200);
    expect(
      aigulNotifs.body.items.some(
        (n: { kind: string; body: string }) =>
          n.kind === 'request_update' && n.body === 'Подписано ЭЦП'
      )
    ).toBe(true);
  });

  it('Staff announcements broadcast to targeted group and support deletion from journal', async () => {
    const staff = await loginAs('dean.office@demo.edu', 'DemoStaff123!');
    const aigul = await loginAs('aigul.nurova@demo.edu', 'DemoStudent123!');
    const timur = await loginAs('timur.belov@demo.edu', 'DemoStudent123!');

    const createRes = await staff.post('/api/v1/staff/announcements').send({
      title: 'Срочное объявление для ДУ-101',
      body: 'Сбор старостата в 15:00',
      group: 'DU-101',
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.ok).toBe(true);
    expect(createRes.body.count).toBe(2); // Aigul & Lina in DU-101

    const aNotifs = await aigul.get('/api/v1/notifications');
    expect(
      aNotifs.body.items.some((n: { title: string }) => n.title === 'Срочное объявление для ДУ-101')
    ).toBe(true);

    // Timur (DU-205) did NOT receive DU-101 targeted announcement
    const tNotifs = await timur.get('/api/v1/notifications');
    expect(
      tNotifs.body.items.some((n: { title: string }) => n.title === 'Срочное объявление для ДУ-101')
    ).toBe(false);

    // Journal listing & delete
    const listRes = await staff.get('/api/v1/staff/announcements');
    expect(listRes.status).toBe(200);
    expect(listRes.body.some((a: { id: string }) => a.id === createRes.body.id)).toBe(true);

    const delRes = await staff.delete(`/api/v1/staff/announcements/${createRes.body.id}`);
    expect(delRes.status).toBe(200);

    const listAfter = await staff.get('/api/v1/staff/announcements');
    expect(listAfter.body.some((a: { id: string }) => a.id === createRes.body.id)).toBe(false);
  });

  it('Staff schedule changes & exam changes notify affected group and validate with Zod', async () => {
    const staff = await loginAs('dean.office@demo.edu', 'DemoStaff123!');
    const aigul = await loginAs('aigul.nurova@demo.edu', 'DemoStudent123!');

    const schChange = await staff.post('/api/v1/staff/schedule-changes').send({
      scheduleEntryId: ids.du101ScheduleId,
      status: 'room_changed',
      room: 'B-115',
      note: 'Проектор перенесен в B-115',
    });
    expect(schChange.status).toBe(200);

    // Invalid exam-change rejected by Zod (422)
    const badExam = await staff.post('/api/v1/staff/exam-changes').send({ status: 'date_changed' });
    expect(badExam.status).toBe(422);

    const examChange = await staff.post('/api/v1/staff/exam-changes').send({
      examId: 'LAW-201',
      date: '20 декабря 2026',
      time: '10:00 – 14:00',
      room: 'Ауд. 312',
      status: 'date_changed',
      subject: 'Международное публичное право',
      targetGroup: 'DU-101',
      notifyGroup: true,
    });
    expect(examChange.status).toBe(200);

    const aNotifs = await aigul.get('/api/v1/notifications?kind=schedule_change');
    expect(
      aNotifs.body.items.some((n: { body: string }) =>
        n.body.includes('Проектор перенесен в B-115')
      )
    ).toBe(true);
    expect(
      aNotifs.body.items.some((n: { title: string }) => n.title.includes('Изменение даты экзамена'))
    ).toBe(true);
  });

  it('Staff groups directory, student rosters, and personal student dossier return structured academic data', async () => {
    const staff = await loginAs('dean.office@demo.edu', 'DemoStaff123!');

    const groupsRes = await staff.get('/api/v1/staff/groups');
    expect(groupsRes.status).toBe(200);
    expect(groupsRes.body.length).toBe(2);

    const rosterRes = await staff.get('/api/v1/staff/groups/DU-101/students');
    expect(rosterRes.status).toBe(200);
    expect(rosterRes.body.length).toBe(2);

    const allStudentsRes = await staff.get('/api/v1/staff/students');
    expect(allStudentsRes.status).toBe(200);
    expect(allStudentsRes.body.length).toBe(3);

    const missingGroup = await staff.get('/api/v1/staff/groups/NO-GROUP/students');
    expect(missingGroup.status).toBe(404);

    const dossier = await staff.get(`/api/v1/staff/students/${ids.timurUserId}/dossier`);
    expect(dossier.status).toBe(200);
    expect(dossier.body.profile.debtCount).toBe(1);
    expect(dossier.body.profile.debtSubjects).toContain('Statistics');
    expect(dossier.body.requests.length).toBe(2);

    const missingDossier = await staff.get('/api/v1/staff/students/not-a-uuid/dossier');
    expect(missingDossier.status).toBe(404);
  });
});
