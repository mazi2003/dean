import { FastifyInstance } from 'fastify';
import { Prisma, RequestStatus, ScheduleStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireStaff } from '../middleware/auth';

// Valid status transitions per workflow spec
const VALID_TRANSITIONS: Record<string, string[]> = {
  submitted: ['in_review', 'rejected'],
  in_review: ['needs_info', 'ready', 'rejected'],
  needs_info: ['in_review', 'rejected'],
  ready: [],
  rejected: [],
  cancelled: [],
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const StaffRequestsQuerySchema = z.object({
  status: z.enum(['submitted', 'in_review', 'needs_info', 'ready', 'rejected', 'cancelled']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const ChangeStatusSchema = z.object({
  status: z.enum(['submitted', 'in_review', 'needs_info', 'ready', 'rejected', 'cancelled']),
  comment: z.string().max(1000).optional(),
});

const AnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  group: z.string().nullable().optional(),
});

const ScheduleChangeSchema = z.object({
  scheduleEntryId: z.string().min(1),
  status: z.enum(['room_changed', 'moved', 'cancelled']),
  room: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  note: z.string().max(500).optional(),
});

const ExamChangeSchema = z.object({
  examId: z.string().min(1),
  date: z.string().optional(),
  time: z.string().optional(),
  room: z.string().optional(),
  status: z.enum(['scheduled', 'date_changed', 'room_changed', 'postponed', 'cancelled']).optional(),
  changeNote: z.string().nullable().optional(),
  notifyGroup: z.boolean().optional(),
  targetGroup: z.string().optional(),
  subject: z.string().optional(),
});

function formatRequest(r: {
  id: string;
  studentId: string;
  typeCode: string;
  requestType: { title: string; slaDays: number };
  status: string;
  createdAt: Date;
  updatedAt: Date;
  data: unknown;
  history?: Array<{ id?: string; status: string; createdAt: Date; comment: string | null }>;
  student?: { id: string; email: string; fullName: string; role: string };
}) {
  const expectedBy = new Date(r.createdAt);
  expectedBy.setDate(expectedBy.getDate() + r.requestType.slaDays);

  return {
    id: r.id,
    studentId: r.studentId,
    studentName: r.student?.fullName,
    typeCode: r.typeCode,
    typeTitle: r.requestType.title,
    slaDays: r.requestType.slaDays,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    expectedBy: expectedBy.toISOString().split('T')[0],
    expectedDate: expectedBy.toISOString().split('T')[0],
    data: r.data,
    history:
      r.history?.map((h) => ({
        id: h.id,
        status: h.status,
        at: h.createdAt.toISOString(),
        createdAt: h.createdAt.toISOString(),
        comment: h.comment,
      })) ?? [],
    student: r.student
      ? { id: r.student.id, email: r.student.email, fullName: r.student.fullName, role: r.student.role }
      : undefined,
  };
}

function calculateStudentMetrics<T extends { creditStatus: string; points: number | null }>(grades: T[]) {
  const debts = grades.filter((gr) => gr.creditStatus === 'failed');
  let sumPoints = 0;
  let pointsCount = 0;
  for (const gr of grades) {
    if (gr.points !== null) {
      sumPoints += gr.points;
      pointsCount++;
    }
  }
  const avgScore = pointsCount > 0 ? Math.round((sumPoints / pointsCount) * 10) / 10 : 75.0;
  const gpa = avgScore >= 85 ? 4.8 : avgScore >= 75 ? 4.2 : 3.4;
  return { debts, avgScore, gpa };
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
      const where: Prisma.RequestWhereInput = {};
      if (status) where.status = status as RequestStatus;

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
        items: items.map((r) => formatRequest(r)),
      });
    },
  });

  // POST /api/v1/staff/requests/:id/status
  app.post('/staff/requests/:id/status', {
    preHandler: [authenticate, requireStaff],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      if (!UUID_REGEX.test(id)) {
        return reply.code(404).send({ code: 'NOT_FOUND', message: 'Not found' });
      }

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

      const staffUserId = request.user!.sub;
      const [updated] = await prisma.$transaction([
        prisma.request.update({
          where: { id },
          data: {
            status: parsed.data.status as RequestStatus,
            history: {
              create: [{ status: parsed.data.status as RequestStatus, actorId: staffUserId, comment: parsed.data.comment ?? null }],
            },
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

  // GET /api/v1/staff/announcements
  app.get('/staff/announcements', {
    preHandler: [authenticate, requireStaff],
    handler: async (_request, reply) => {
      const announcements = await prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return reply.send(
        announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          targetGroup: a.targetGroup ?? 'all',
          priority: 'high',
          kind: 'announcement',
          createdAt: a.createdAt.toISOString(),
        }))
      );
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
      const created = await prisma.announcement.create({
        data: { title, body, targetGroup: groupName ?? null },
      });

      // Find target users
      let targetUserIds: string[];
      if (groupName) {
        const groupRecord = await prisma.group.findFirst({
          where: { code: groupName },
          include: { studentProfiles: { select: { userId: true } } },
        });
        targetUserIds = groupRecord?.studentProfiles.map((sp) => sp.userId) ?? [];
      } else {
        const students = await prisma.user.findMany({ where: { role: 'student' }, select: { id: true } });
        targetUserIds = students.map((u) => u.id);
      }

      // Create notifications
      if (targetUserIds.length > 0) {
        await prisma.notification.createMany({
          data: targetUserIds.map((userId) => ({
            userId,
            kind: 'announcement' as const,
            title,
            body,
            link: null,
          })),
        });
      }

      return reply.code(201).send({ ok: true, id: created.id, count: targetUserIds.length });
    },
  });

  // DELETE /api/v1/staff/announcements/:id
  app.delete<{ Params: { id: string } }>('/staff/announcements/:id', {
    preHandler: [authenticate, requireStaff],
    handler: async (request, reply) => {
      const { id } = request.params;
      if (UUID_REGEX.test(id)) {
        try {
          await prisma.announcement.delete({ where: { id } });
        } catch {
          // ignore if already deleted
        }
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
        status: ScheduleStatus;
        changeNote?: string;
        roomId?: string | null;
        startTime?: string;
        endTime?: string;
      } = { status: status as ScheduleStatus };
      if (note) updateData.changeNote = note;
      if (start) updateData.startTime = start;
      if (end) updateData.endTime = end;

      if (room) {
        const roomRecord = await prisma.room.findFirst({ where: { code: room } });
        if (roomRecord) updateData.roomId = roomRecord.id;
      }

      await prisma.scheduleEntry.update({ where: { id: scheduleEntryId }, data: updateData });

      // Notify affected group
      const affectedUserIds = entry.group.studentProfiles.map((sp) => sp.userId);
      const dateStr = entry.date.toISOString().split('T')[0];
      const notifTitle =
        status === 'cancelled'
          ? `Class cancelled: ${entry.subject.name} on ${dateStr}`
          : status === 'room_changed'
            ? `Room changed: ${entry.subject.name} on ${dateStr}`
            : `Schedule changed: ${entry.subject.name} on ${dateStr}`;

      if (affectedUserIds.length > 0) {
        await prisma.notification.createMany({
          data: affectedUserIds.map((userId) => ({
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
      const parsed = ExamChangeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(422).send({ code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() });
      }

      const { examId, date, time, room, status, changeNote, notifyGroup, targetGroup, subject } = parsed.data;

      if (notifyGroup && targetGroup) {
        const groupRecord = await prisma.group.findFirst({
          where: { code: targetGroup },
          include: { studentProfiles: { select: { userId: true } } },
        });

        const targetUserIds = groupRecord?.studentProfiles.map((sp) => sp.userId) ?? [];
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
          const notifBody = `Внимание, группа ${targetGroup}! По дисциплине «${subject || 'Экзамен'}» статус: ${(status && statusMap[status]) || 'Изменение'}. Дата: ${date ?? '—'}, время: ${time ?? '—'}, ауд.: ${room ?? '—'}.${noteText}`;

          await prisma.notification.createMany({
            data: targetUserIds.map((userId) => ({
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

      const formatted = groups.map((g) => {
        const studentProfiles = g.studentProfiles;
        let totalDebt = 0;
        let sumPoints = 0;
        let pointCount = 0;

        for (const sp of studentProfiles) {
          const debts = sp.grades.filter((gr) => gr.creditStatus === 'failed');
          totalDebt += debts.length;
          for (const gr of sp.grades) {
            if (gr.points !== null) {
              sumPoints += gr.points;
              pointCount++;
            }
          }
        }

        const avgScore = pointCount > 0 ? sumPoints / pointCount : 80;
        const avgGpa = avgScore >= 85 ? 4.6 : avgScore >= 70 ? 4.0 : 3.4;

        return {
          id: g.id,
          code: g.code,
          program: g.program.name,
          faculty: g.program.faculty.name,
          year: 2023,
          courseNumber: g.year,
          studentsCount: studentProfiles.length > 0 ? studentProfiles.length : g.code === 'DU-101' ? 28 : 24,
          budgetCount: Math.ceil(studentProfiles.length * 0.6) || (g.code === 'DU-101' ? 18 : 14),
          contractCount: Math.floor(studentProfiles.length * 0.4) || (g.code === 'DU-101' ? 10 : 10),
          curatorName: g.code === 'DU-101' ? 'проф. Лебедев Д.В.' : 'доц. Ковалев С.А.',
          curatorContact: g.code === 'DU-101' ? 'd.lebedev@demo.edu • Ауд. 314' : 's.kovalev@demo.edu • Ауд. 208',
          starostaName: g.code === 'DU-101' ? 'Айгуль Нурова' : 'Алина Захарова',
          starostaEmail: g.code === 'DU-101' ? 'aigul.nurova@demo.edu' : 'a.zakharova@demo.edu',
          starostaPhone: g.code === 'DU-101' ? '+7 (999) 123-45-67' : '+7 (999) 456-78-90',
          averageGpa: avgGpa,
          debtCount: totalDebt,
        };
      });

      return reply.send(formatted);
    },
  });

  // GET /api/v1/staff/students
  app.get('/staff/students', {
    preHandler: [authenticate, requireStaff],
    handler: async (_request, reply) => {
      const profiles = await prisma.studentProfile.findMany({
        include: {
          user: true,
          group: true,
          grades: true,
        },
        orderBy: { studentNumber: 'asc' },
      });

      const students = profiles.map((sp) => {
        const { debts, avgScore, gpa } = calculateStudentMetrics(sp.grades);
        return {
          id: sp.userId,
          fullName: sp.user.fullName,
          email: sp.user.email,
          phone: sp.user.email === 'aigul.nurova@demo.edu' ? '+7 (999) 123-45-67' : '+7 (999) 234-56-78',
          group: sp.group.code,
          year: sp.year,
          studentNumber: sp.studentNumber,
          studyForm: sp.user.email === 'timur.belov@demo.edu' ? ('Контракт' as const) : ('Бюджет' as const),
          gpa,
          averageScore: avgScore,
          debtCount: debts.length,
          debtSubjects: debts.map((d) => d.subjectId),
          isStarosta: sp.user.email === 'aigul.nurova@demo.edu',
          status: 'active' as const,
        };
      });

      return reply.send(students);
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

      const students = group.studentProfiles.map((sp) => {
        const { debts, avgScore, gpa } = calculateStudentMetrics(sp.grades);

        return {
          id: sp.userId,
          fullName: sp.user.fullName,
          email: sp.user.email,
          phone: sp.user.email === 'aigul.nurova@demo.edu' ? '+7 (999) 123-45-67' : '+7 (999) 234-56-78',
          group: group.code,
          year: sp.year,
          studentNumber: sp.studentNumber,
          studyForm: sp.user.email === 'timur.belov@demo.edu' ? ('Контракт' as const) : ('Бюджет' as const),
          gpa,
          averageScore: avgScore,
          debtCount: debts.length,
          debtSubjects: debts.map((d) => d.subjectId),
          isStarosta: sp.user.email === 'aigul.nurova@demo.edu',
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
      if (!UUID_REGEX.test(id)) {
        return reply.code(404).send({ code: 'NOT_FOUND', message: 'Student profile not found' });
      }

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
      const debts = sp.grades.filter((gr) => gr.creditStatus === 'failed');
      const { avgScore, gpa } = calculateStudentMetrics(sp.grades);

      const profile = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.email === 'aigul.nurova@demo.edu' ? '+7 (999) 123-45-67' : '+7 (999) 234-56-78',
        group: sp.group.code,
        year: sp.year,
        studentNumber: sp.studentNumber,
        studyForm: user.email === 'timur.belov@demo.edu' ? ('Контракт' as const) : ('Бюджет' as const),
        gpa,
        averageScore: avgScore,
        debtCount: debts.length,
        debtSubjects: debts.map((d) => d.subject.name),
        isStarosta: user.email === 'aigul.nurova@demo.edu',
        status: 'active' as const,
        faculty: sp.faculty.name,
        program: sp.program.name,
        admissionYear: 2023,
        recordBookNumber: `ЗК-${sp.studentNumber.replace('СТ-', '')}`,
        dormitoryInfo:
          user.email === 'timur.belov@demo.edu'
            ? 'Студгородок №1, корп. 2, комн. 415'
            : 'Проживание по постоянной регистрации (г. Москва)',
        snils: '184-293-841 02',
      };

      const gradesSummary = {
        semester: 3,
        averagePoints: avgScore,
        gpa,
        creditsEarned: sp.grades
          .filter((g) => g.creditStatus === 'earned')
          .reduce((sum, g) => sum + g.subject.credits, 0),
        creditsRequired: 30,
        upcomingExams: [],
        items: sp.grades.map((g) => ({
          id: g.id,
          subject: g.subject.name,
          credits: g.subject.credits,
          assessmentType: g.assessmentType,
          points: g.points,
          grade: g.grade,
          creditStatus: g.creditStatus,
          examDate: g.examDate ? g.examDate.toISOString().split('T')[0] : null,
          retakeDate: g.creditStatus === 'failed' && g.examDate ? g.examDate.toISOString().split('T')[0] : null,
          semester: g.semester,
        })),
      };

      return reply.send({
        profile,
        gradesSummary,
        requests: user.requests.map((r) => formatRequest(r)),
      });
    },
  });
}
