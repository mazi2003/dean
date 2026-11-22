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

  it('Staff GET /api/v1/profile returns administrative staff profile without passwordHash', async () => {
    const staff = await loginAs('dean.office@demo.edu', 'DemoStaff123!');
    const res = await staff.get('/api/v1/profile');
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('staff');
    expect(res.body.group).toBe('ДЕКАНАТ-МО');
    expect(res.body.studentNumber).toBe('ТАБ-0441');
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('Staff exams CRUD: GET ?group=, POST /staff/exams (201/404/409/422), and POST /staff/exams/:id/reset', async () => {
    const staff = await loginAs('dean.office@demo.edu', 'DemoStaff123!');
    const aigul = await loginAs('aigul.nurova@demo.edu', 'DemoStudent123!');
    const timur = await loginAs('timur.belov@demo.edu', 'DemoStudent123!');

    const listAll = await staff.get('/api/v1/staff/exams');
    expect(listAll.status).toBe(200);
    expect(listAll.body.length).toBeGreaterThanOrEqual(1);

    const badCreate = await staff.post('/api/v1/staff/exams').send({ code: '' });
    expect(badCreate.status).toBe(422);

    const missingGroup = await staff.post('/api/v1/staff/exams').send({
      code: 'NEW-404',
      groupId: 'UNKNOWN-999',
      subject: 'Test',
      format: 'Oral',
      examiner: 'Prof. X',
      date: '20 декабря 2026',
      time: '10:00',
      room: '101',
    });
    expect(missingGroup.status).toBe(404);

    const created = await staff.post('/api/v1/staff/exams').send({
      code: 'NEW-101',
      groupId: 'DU-101',
      subject: 'Теория международных договоров',
      format: 'Устный экзамен',
      examiner: 'Проф. Лебедев Д.В.',
      date: '29 декабря 2026',
      rawDate: '2026-12-29',
      time: '10:00 – 13:00',
      room: 'Ауд. А-204',
      notifyGroup: true,
    });
    expect(created.status).toBe(201);
    expect(created.body.code).toBe('NEW-101');
    expect(created.body.groupId).toBe('DU-101');

    // Duplicate exam code returns 409 Conflict
    const duplicate = await staff.post('/api/v1/staff/exams').send({
      code: 'NEW-101',
      groupId: 'DU-101',
      subject: 'Дубликат',
      format: 'Устный',
      examiner: 'Проф. Лебедев Д.В.',
      date: '30 декабря 2026',
      time: '10:00',
      room: '101',
    });
    expect(duplicate.status).toBe(409);

    const du101Exams = await staff.get('/api/v1/staff/exams?group=DU-101');
    expect(du101Exams.status).toBe(200);
    expect(du101Exams.body.some((e: { code: string }) => e.code === 'NEW-101')).toBe(true);

    // DU-101 student receives notification; DU-205 student does not
    const aNotifs = await aigul.get('/api/v1/notifications');
    expect(
      aNotifs.body.items.some((n: { title: string }) =>
        n.title.includes('Теория международных договоров')
      )
    ).toBe(true);
    const tNotifs = await timur.get('/api/v1/notifications');
    expect(
      tNotifs.body.items.some((n: { title: string }) =>
        n.title.includes('Теория международных договоров')
      )
    ).toBe(false);

    // Mutate LAW-201 then reset to originalSnapshot
    const mutateRes = await staff.post('/api/v1/staff/exam-changes').send({
      examId: 'LAW-201',
      room: 'Ауд. В-999',
      status: 'room_changed',
      changeNote: 'Временный перенос',
      notifyGroup: false,
    });
    expect(mutateRes.status).toBe(200);
    expect(mutateRes.body.room).toBe('Ауд. В-999');

    const resetRes = await staff.post('/api/v1/staff/exams/LAW-201/reset');
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.room).toBe('Ауд. 312');
    expect(resetRes.body.date).toBe('12 декабря 2026');
    expect(resetRes.body.status).toBe('scheduled');
    expect(resetRes.body.changeNote).toBeNull();

    const missingReset = await staff.post('/api/v1/staff/exams/DOES-NOT-EXIST/reset');
    expect(missingReset.status).toBe(404);
  });

  it('Staff GET /api/v1/schedule handles ?group=all, unknown group, specific group, and default', async () => {
    const staff = await loginAs('dean.office@demo.edu', 'DemoStaff123!');

    const allRes = await staff.get('/api/v1/schedule?group=all');
    expect(allRes.status).toBe(200);
    const allGroups = new Set(allRes.body.map((e: { groupId: string }) => e.groupId));
    expect(allGroups.has('DU-101')).toBe(true);
    expect(allGroups.has('DU-205')).toBe(true);

    const unknownRes = await staff.get('/api/v1/schedule?group=UNKNOWN-999');
    expect(unknownRes.status).toBe(200);
    expect(unknownRes.body).toEqual([]);

    const du205Res = await staff.get('/api/v1/schedule?group=DU-205');
    expect(du205Res.status).toBe(200);
    expect(du205Res.body.length).toBeGreaterThan(0);
    expect(du205Res.body.every((e: { groupId: string }) => e.groupId === 'DU-205')).toBe(true);

    const defaultRes = await staff.get('/api/v1/schedule');
    expect(defaultRes.status).toBe(200);
    expect(defaultRes.body.every((e: { groupId: string }) => e.groupId === 'DU-101')).toBe(true);
  });

  it('Staff error envelopes, status transitions (needs_info -> in_review -> rejected), targeted announcements & 404 checks', async () => {
    const staff = await loginAs('dean.office@demo.edu', 'DemoStaff123!');
    const lina = await loginAs('lina.okafor@demo.edu', 'DemoStudent123!');
    const timur = await loginAs('timur.belov@demo.edu', 'DemoStudent123!');

    // DELETE /staff/announcements/:id returns standard { code: 'NOT_FOUND', message }
    const badUuidDel = await staff.delete('/api/v1/staff/announcements/not-a-uuid');
    expect(badUuidDel.status).toBe(404);
    expect(badUuidDel.body).toEqual({ code: 'NOT_FOUND', message: 'Announcement not found' });

    const missingUuidDel = await staff.delete(
      '/api/v1/staff/announcements/99999999-9999-4999-8999-999999999999'
    );
    expect(missingUuidDel.status).toBe(404);
    expect(missingUuidDel.body).toEqual({ code: 'NOT_FOUND', message: 'Announcement not found' });

    // 404 on unknown scheduleEntry, exam, and request
    expect(
      (
        await staff.post('/api/v1/staff/schedule-changes').send({
          scheduleEntryId: '99999999-9999-4999-8999-999999999999',
          status: 'cancelled',
        })
      ).status
    ).toBe(404);
    expect(
      (
        await staff.post('/api/v1/staff/exam-changes').send({
          examId: 'UNKNOWN-EXAM',
          status: 'cancelled',
        })
      ).status
    ).toBe(404);
    expect(
      (
        await staff
          .post('/api/v1/staff/requests/99999999-9999-4999-8999-999999999999/status')
          .send({ status: 'in_review' })
      ).status
    ).toBe(404);

    // Transition Timur's needs_info request: needs_info -> in_review -> rejected
    const toInReview = await staff
      .post(`/api/v1/staff/requests/${ids.timurReqNeedsInfoId}/status`)
      .send({ status: 'in_review', comment: 'Документы получены' });
    expect(toInReview.status).toBe(200);
    expect(toInReview.body.status).toBe('in_review');

    const toRejected = await staff
      .post(`/api/v1/staff/requests/${ids.timurReqNeedsInfoId}/status`)
      .send({ status: 'rejected', comment: 'Неполный пакет документов' });
    expect(toRejected.status).toBe(200);
    expect(toRejected.body.status).toBe('rejected');

    // Targeted user announcement reaches only Lina
    const userAnn = await staff.post('/api/v1/staff/announcements').send({
      title: 'Личное приглашение на встречу',
      body: 'Подойдите в каб. 201',
      targetUserId: ids.linaUserId,
    });
    expect(userAnn.status).toBe(201);
    expect(userAnn.body.count).toBe(1);

    // Global announcement reaches all 3 students
    const globalAnn = await staff.post('/api/v1/staff/announcements').send({
      title: 'Общефакультетское объявление',
      body: 'День открытых дверей',
      group: null,
    });
    expect(globalAnn.status).toBe(201);
    expect(globalAnn.body.count).toBe(3);

    const lNotifs = await lina.get('/api/v1/notifications');
    expect(
      lNotifs.body.items.some((n: { title: string }) => n.title === 'Личное приглашение на встречу')
    ).toBe(true);
    const tNotifs = await timur.get('/api/v1/notifications');
    expect(
      tNotifs.body.items.some((n: { title: string }) => n.title === 'Личное приглашение на встречу')
    ).toBe(false);

    // Schedule changes: moved & cancelled
    const movedRes = await staff.post('/api/v1/staff/schedule-changes').send({
      scheduleEntryId: ids.du101ScheduleId,
      status: 'moved',
      start: '09:00',
      end: '10:35',
      notifyGroup: false,
    });
    expect(movedRes.status).toBe(200);

    const cancelSchRes = await staff.post('/api/v1/staff/schedule-changes').send({
      scheduleEntryId: ids.du101ScheduleId,
      status: 'cancelled',
      notifyGroup: false,
    });
    expect(cancelSchRes.status).toBe(200);
  });
});
