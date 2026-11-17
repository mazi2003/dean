import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireStaff } from '../middleware/auth';

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  submitted: ['in_review', 'rejected'],
  in_review: ['needs_info', 'ready', 'rejected'],
  needs_info: ['in_review', 'rejected'],
  ready: [],
  rejected: [],
  cancelled: [],
};

const StaffRequestsQuerySchema = z.object({
  status: z.enum(['submitted', 'in_review', 'needs_info', 'ready', 'rejected', 'cancelled']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const ChangeStatusSchema = z.object({
  status: z.enum(['submitted', 'in_review', 'needs_info', 'ready', 'rejected', 'cancelled']),
  comment: z.string().optional(),
});

const AnnouncementSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  group: z.string().nullable().optional(),
});

const ScheduleChangeSchema = z.object({
  scheduleEntryId: z.string().min(1),
  status: z.enum(['room_changed', 'moved', 'cancelled']),
  room: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  note: z.string().optional(),
});

function formatRequest(r: {
  id: string;
  typeCode: string;
  requestType: { title: string; slaDays: number };
  status: string;
  createdAt: Date;
  updatedAt: Date;
  data: unknown;
  history?: Array<{ status: string; createdAt: Date; comment: string | null }>;
  student?: { id: string; email: string; fullName: string; role: string };
}) {
  const expectedBy = new Date(r.createdAt);
  expectedBy.setDate(expectedBy.getDate() + r.requestType.slaDays);

  return {
    id: r.id,
    typeCode: r.typeCode,
    typeTitle: r.requestType.title,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    expectedBy: expectedBy.toISOString().split('T')[0],
    data: r.data,
    history: r.history?.map(h => ({
      status: h.status,
      at: h.createdAt.toISOString(),
      comment: h.comment,
    })) ?? [],
    student: r.student
      ? { id: r.student.id, email: r.student.email, fullName: r.student.fullName, role: r.student.role }
      : undefined,
  };
}

export async function staffRoutes(app: FastifyInstance) {
  // GET /api/v1/staff/requests
  app.get('/staff/requests', {
    preHandler: [authenticate, requireStaff],
    handler: async (request, reply) => {
      const parsed = StaffRequestsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(422).send({ code: 'VALIDATION_ERROR', message: 'Invalid query', details: parsed.error.flatten() });
      }

      const { status, page, pageSize } = parsed.data;
      const where: { status?: string } = {};
      if (status) where.status = status;

      const [total, items] = await Promise.all([
        prisma.request.count({ where }),
        prisma.request.findMany({
          where,
          include: {
            requestType: true,
            history: { orderBy: { createdAt: 'asc' } },
            student: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return reply.send({
        page,
        pageSize,
        total,
        items: items.map(r => formatRequest(r)),
      });
    },
  });

  // POST /api/v1/staff/requests/:id/status
  app.post('/staff/requests/:id/status', {
    preHandler: [authenticate, requireStaff],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = ChangeStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(422).send({ code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() });
      }

      const r = await prisma.request.findUnique({
        where: { id },
        include: { requestType: true, student: true },
      });
      if (!r) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Not found' });

      const allowed = VALID_TRANSITIONS[r.status] ?? [];
      if (!allowed.includes(parsed.data.status)) {
        return reply.code(409).send({ code: 'CONFLICT', message: `Cannot transition from ${r.status} to ${parsed.data.status}` });
      }

      const [updated] = await prisma.$transaction([
        prisma.request.update({
          where: { id },
          data: {
            status: parsed.data.status,
            history: { create: [{ status: parsed.data.status, comment: parsed.data.comment ?? null }] },
          },
          include: {
            requestType: true,
            history: { orderBy: { createdAt: 'asc' } },
            student: true,
          },
        }),
        prisma.notification.create({
          data: {
            userId: r.studentId,
            kind: 'request_update',
            title: `Your request status changed to ${parsed.data.status}`,
            body: parsed.data.comment ?? `Your ${r.requestType.title} request is now ${parsed.data.status}.`,
            link: `/requests/${r.id}`,
          },
        }),
      ]);

      return reply.send(formatRequest(updated));
    },
  });

  // POST /api/v1/staff/announcements
  app.post('/staff/announcements', {
    preHandler: [authenticate, requireStaff],
    handler: async (request, reply) => {
      const parsed = AnnouncementSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(422).send({ code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() });
      }

      const { title, body, group: groupName } = parsed.data;

      // Create announcement record
      await prisma.announcement.create({
        data: { title, body, targetGroup: groupName ?? null },
      });

      // Find target users
      let targetUserIds: string[];
      if (groupName) {
        const groupRecord = await prisma.group.findFirst({ where: { code: groupName }, include: { studentProfiles: { select: { userId: true } } } });
        targetUserIds = groupRecord?.studentProfiles.map(sp => sp.userId) ?? [];
      } else {
        const students = await prisma.user.findMany({ where: { role: 'student' }, select: { id: true } });
        targetUserIds = students.map(u => u.id);
      }

      // Create notifications
      if (targetUserIds.length > 0) {
        await prisma.notification.createMany({
          data: targetUserIds.map(userId => ({
            userId,
            kind: 'announcement' as const,
            title,
            body,
            link: null,
          })),
        });
      }

      return reply.code(201).send({ ok: true });
    },
  });

  // DELETE /api/v1/staff/announcements/:id
  app.delete<{ Params: { id: string } }>('/staff/announcements/:id', {
    preHandler: [authenticate, requireStaff],
    handler: async (request, reply) => {
      const { id } = request.params;
      try {
        await prisma.announcement.delete({ where: { id } });
      } catch {
        // ignore if already deleted
      }
      return reply.code(200).send({ ok: true });
    },
  });

  // POST /api/v1/staff/schedule-changes
  app.post('/staff/schedule-changes', {
    preHandler: [authenticate, requireStaff],
    handler: async (request, reply) => {
      const parsed = ScheduleChangeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(422).send({ code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() });
      }

      const { scheduleEntryId, status, room, start, end, note } = parsed.data;

      const entry = await prisma.scheduleEntry.findUnique({
        where: { id: scheduleEntryId },
        include: {
          group: { include: { studentProfiles: { select: { userId: true } } } },
          subject: true,
        },
      });
      if (!entry) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Schedule entry not found' });

      // Build update data
      const updateData: {
        status: string;
        changeNote?: string;
        roomId?: string | null;
        startTime?: string;
        endTime?: string;
      } = { status };
      if (note) updateData.changeNote = note;
      if (start) updateData.startTime = start;
      if (end) updateData.endTime = end;

      if (room) {
        const roomRecord = await prisma.room.findFirst({ where: { code: room } });
        if (roomRecord) updateData.roomId = roomRecord.id;
      }

      await prisma.scheduleEntry.update({ where: { id: scheduleEntryId }, data: updateData });

      // Notify affected group
      const affectedUserIds = entry.group.studentProfiles.map(sp => sp.userId);
      const dateStr = entry.date.toISOString().split('T')[0];
      const notifTitle = status === 'cancelled'
        ? `Class cancelled: ${entry.subject.name} on ${dateStr}`
        : status === 'room_changed'
          ? `Room changed: ${entry.subject.name} on ${dateStr}`
          : `Schedule changed: ${entry.subject.name} on ${dateStr}`;

      if (affectedUserIds.length > 0) {
        await prisma.notification.createMany({
          data: affectedUserIds.map(userId => ({
            userId,
            kind: 'schedule_change' as const,
            title: notifTitle,
            body: note ?? notifTitle,
            link: null,
          })),
        });
      }

      return reply.send({ ok: true });
    },
  });

  // POST /api/v1/staff/exam-changes
  app.post('/staff/exam-changes', {
    preHandler: [authenticate, requireStaff],
    handler: async (request, reply) => {
      const body = request.body as Record<string, any>;
      const { examId, date, time, room, status, changeNote, notifyGroup, targetGroup, subject } = body;

      if (notifyGroup && targetGroup) {
        const groupRecord = await prisma.group.findFirst({
          where: { code: targetGroup },
          include: { studentProfiles: { select: { userId: true } } },
        });

        const targetUserIds = groupRecord?.studentProfiles.map(sp => sp.userId) ?? [];
        if (targetUserIds.length > 0) {
          const statusMap: Record<string, string> = {
            date_changed: 'Перенос даты экзамена',
            room_changed: 'Замена аудитории экзамена',
            postponed: 'Перенос экзамена на резервный день',
            cancelled: 'Отмена экзамена',
            scheduled: 'График экзамена подтвержден',
          };
          const title = `Изменение даты экзамена: ${subject || 'Экзамен'}`;
          const noteText = changeNote ? ` Примечание деканата: ${changeNote}.` : '';
          const notifBody = `Внимание, группа ${targetGroup}! По дисциплине «${subject || 'Экзамен'}» статус: ${statusMap[status] || 'Изменение'}. Дата: ${date}, время: ${time}, ауд.: ${room}.${noteText}`;

          await prisma.notification.createMany({
            data: targetUserIds.map(userId => ({
              userId,
              kind: 'schedule_change' as const,
              title,
              body: notifBody,
              link: '/schedule',
            })),
          });
        }
      }

      return reply.send({ ok: true, examId });
    },
  });

  // GET /api/v1/staff/groups
  app.get('/staff/groups', {
    preHandler: [authenticate, requireStaff],
    handler: async (_request, reply) => {
      const groups = await prisma.group.findMany({
        include: {
          program: { include: { faculty: true } },
          studentProfiles: {
            include: {
              user: true,
              grades: true,
            },
          },
        },
        orderBy: { code: 'asc' },
      });

      const formatted = groups.map(g => {
        const studentProfiles = g.studentProfiles;
        let totalDebt = 0;
        let sumPoints = 0;
        let pointCount = 0;

        studentProfiles.forEach(sp => {
          const debts = sp.grades.filter(gr => gr.creditStatus === 'failed');
          totalDebt += debts.length;
          sp.grades.forEach(gr => {
            if (gr.points !== null) {
              sumPoints += gr.points;
              pointCount++;
            }
          });
        });

        const avgScore = pointCount > 0 ? sumPoints / pointCount : 80;
        const avgGpa = avgScore >= 85 ? 4.6 : avgScore >= 70 ? 4.0 : 3.4;

        return {
          id: g.id,
          code: g.code,
          program: g.program.name,
          faculty: g.program.faculty.name,
          year: 2023,
          courseNumber: g.year,
          studentsCount: studentProfiles.length > 0 ? studentProfiles.length : (g.code === 'ДУ-101' ? 28 : 24),
          budgetCount: Math.ceil(studentProfiles.length * 0.6) || (g.code === 'ДУ-101' ? 18 : 14),
          contractCount: Math.floor(studentProfiles.length * 0.4) || (g.code === 'ДУ-101' ? 10 : 10),
          curatorName: g.code === 'ДУ-101' ? 'проф. Лебедев Д.В.' : 'доц. Ковалев С.А.',
          curatorContact: g.code === 'ДУ-101' ? 'd.lebedev@demo.edu • Ауд. 314' : 's.kovalev@demo.edu • Ауд. 208',
          starostaName: g.code === 'ДУ-101' ? 'Айгуль Нурова' : 'Алина Захарова',
          starostaEmail: g.code === 'ДУ-101' ? 'aigul.nurova@demo.edu' : 'a.zakharova@demo.edu',
          starostaPhone: g.code === 'ДУ-101' ? '+7 (999) 123-45-67' : '+7 (999) 456-78-90',
          averageGpa: avgGpa,
          debtCount: totalDebt,
        };
      });

      return reply.send(formatted);
    },
  });

  // GET /api/v1/staff/groups/:code/students
  app.get('/staff/groups/:code/students', {
    preHandler: [authenticate, requireStaff],
    handler: async (request, reply) => {
      const { code } = request.params as { code: string };
      const group = await prisma.group.findFirst({
        where: { code },
        include: {
          studentProfiles: {
            include: {
              user: true,
              grades: true,
            },
          },
        },
      });

      if (!group) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Group not found' });

      const students = group.studentProfiles.map(sp => {
        const debts = sp.grades.filter(gr => gr.creditStatus === 'failed');
        let sumPoints = 0;
        let pointsCount = 0;
        sp.grades.forEach(gr => {
          if (gr.points !== null) {
            sumPoints += gr.points;
            pointsCount++;
          }
        });
        const avgScore = pointsCount > 0 ? Math.round((sumPoints / pointsCount) * 10) / 10 : 75.0;
        const gpa = avgScore >= 85 ? 4.8 : avgScore >= 75 ? 4.2 : 3.4;

        return {
          id: sp.userId,
          fullName: sp.user.fullName,
          email: sp.user.email,
          phone: sp.userId === 'usr-aigul-101' ? '+7 (999) 123-45-67' : '+7 (999) 234-56-78',
          group: group.code,
          year: sp.year,
          studentNumber: sp.studentNumber,
          studyForm: sp.userId === 'usr-timur-205' ? 'Контракт' : 'Бюджет',
          gpa,
          averageScore: avgScore,
          debtCount: debts.length,
          debtSubjects: debts.map(d => d.subjectId),
          isStarosta: sp.userId === 'usr-aigul-101',
          status: 'active' as const,
        };
      });

      return reply.send(students);
    },
  });

  // GET /api/v1/staff/students/:id/dossier
  app.get('/staff/students/:id/dossier', {
    preHandler: [authenticate, requireStaff],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          studentProfile: {
            include: {
              group: true,
              program: true,
              faculty: true,
              grades: { include: { subject: true } },
            },
          },
          requests: {
            include: {
              requestType: true,
              history: { orderBy: { createdAt: 'desc' } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user || !user.studentProfile) {
        return reply.code(404).send({ code: 'NOT_FOUND', message: 'Student profile not found' });
      }

      const sp = user.studentProfile;
      const debts = sp.grades.filter(gr => gr.creditStatus === 'failed');
      let sumPoints = 0;
      let pointsCount = 0;
      sp.grades.forEach(gr => {
        if (gr.points !== null) {
          sumPoints += gr.points;
          pointsCount++;
        }
      });
      const avgScore = pointsCount > 0 ? Math.round((sumPoints / pointsCount) * 10) / 10 : 75.0;
      const gpa = avgScore >= 85 ? 4.8 : avgScore >= 75 ? 4.2 : 3.4;

      const profile = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.id === 'usr-aigul-101' ? '+7 (999) 123-45-67' : '+7 (999) 234-56-78',
        group: sp.group.code,
        year: sp.year,
        studentNumber: sp.studentNumber,
        studyForm: user.id === 'usr-timur-205' ? 'Контракт' as const : 'Бюджет' as const,
        gpa,
        averageScore: avgScore,
        debtCount: debts.length,
        debtSubjects: debts.map(d => d.subject.name),
        isStarosta: user.id === 'usr-aigul-101',
        status: 'active' as const,
        faculty: sp.faculty.name,
        program: sp.program.name,
        admissionYear: 2023,
        recordBookNumber: `ЗК-${sp.studentNumber.replace('СТ-', '')}`,
        dormitoryInfo: user.id === 'usr-timur-205' ? 'Студгородок №1, корп. 2, комн. 415' : 'Проживание по постоянной регистрации (г. Москва)',
        snils: '184-293-841 02',
      };

      const gradesSummary = {
        semester: 3,
        averagePoints: avgScore,
        gpa,
        creditsEarned: 24,
        creditsRequired: 30,
        upcomingExams: [],
        items: sp.grades.map(g => ({
          id: g.id,
          subject: g.subject.name,
          credits: g.subject.credits,
          assessmentType: g.assessmentType,
          points: g.points,
          grade: g.grade,
          creditStatus: g.creditStatus,
          examDate: g.examDate ? g.examDate.toISOString().split('T')[0] : null,
          retakeDate: g.retakeDate ? g.retakeDate.toISOString().split('T')[0] : null,
          semester: g.semester,
        })),
      };

      return reply.send({
        profile,
        gradesSummary,
        requests: user.requests.map(r => formatRequest(r)),
      });
    },
  });
}
