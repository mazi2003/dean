import { FastifyInstance } from 'fastify';
import {
  NotificationKind,
  Prisma,
  RequestStatus,
  ScheduleStatus,
  ExamStatus,
} from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireStaff } from '../middleware/auth';
import { computePointsAndGpa } from './profile';
import { formatRequest } from './requests';
import { formatExam } from './schedule';

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
  status: z
    .enum(['submitted', 'in_review', 'needs_info', 'ready', 'rejected', 'cancelled'])
    .optional(),
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
  targetUserId: z.string().regex(UUID_REGEX, 'Invalid targetUserId UUID').nullable().optional(),
  priority: z.enum(['normal', 'high', 'urgent']).optional().default('high'),
  kind: z
    .enum(['announcement', 'deadline', 'request_update', 'schedule_change'])
    .optional()
    .default('announcement'),
});

const ScheduleChangeSchema = z.object({
  scheduleEntryId: z.string().regex(UUID_REGEX, 'Invalid scheduleEntryId UUID'),
  status: z.enum(['normal', 'room_changed', 'moved', 'cancelled']),
  room: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  note: z.string().max(500).optional(),
  notifyGroup: z.boolean().optional().default(true),
});

const StaffExamsQuerySchema = z.object({
  group: z.string().min(1).max(50).optional(),
});

const ExamCreateSchema = z.object({
  code: z.string().min(1).max(40),
  groupId: z.string().min(1), // group code like ДУ-101
  subject: z.string().min(1).max(200),
  format: z.string().min(1).max(200),
  examiner: z.string().min(1).max(200),
  commissionMembers: z.string().max(300).optional(),
  date: z.string().min(1).max(100),
  rawDate: z.string().optional(),
  time: z.string().min(1).max(60),
  room: z.string().min(1).max(100),
  consultation: z.string().max(200).optional().default(''),
  credits: z.coerce.number().int().min(1).max(12).default(4),
  status: z
    .enum(['scheduled', 'date_changed', 'room_changed', 'postponed', 'cancelled'])
    .optional()
    .default('scheduled'),
  changeNote: z.string().nullable().optional(),
  isDebt: z.boolean().optional().default(false),
  notifyGroup: z.boolean().optional().default(true),
});

const ExamChangeSchema = z.object({
  examId: z.string().min(1),
  date: z.string().optional(),
  rawDate: z.string().optional(),
  time: z.string().optional(),
  room: z.string().optional(),
  examiner: z.string().optional(),
  commissionMembers: z.string().optional(),
  consultation: z.string().optional(),
  status: z
    .enum(['scheduled', 'date_changed', 'room_changed', 'postponed', 'cancelled'])
    .optional(),
  changeNote: z.string().nullable().optional(),
  notifyGroup: z.boolean().optional().default(true),
  targetGroup: z.string().optional(),
  subject: z.string().optional(),
});

const requestInclude = {
  requestType: true,
  history: {
    orderBy: { createdAt: 'asc' as const },
    include: { actor: { select: { fullName: true } } },
  },
  student: {
    include: {
      studentProfile: {
        include: { group: { select: { code: true } } },
      },
    },
  },
};

function calculateStudentMetrics<
  T extends { creditStatus: string; points: number | null; grade: number | null },
>(grades: T[]) {
  const debts = grades.filter((gr) => gr.creditStatus === 'failed');
  const { averageScore, gpa } = computePointsAndGpa(grades);
  return { debts, avgScore: averageScore, gpa };
}

export async function staffRoutes(app: FastifyInstance) {
  // GET /api/v1/staff/requests
  app.get('/staff/requests', {
    preHandler: [authenticate, requireStaff],
    handler: async (request, reply) => {
      const parsed = StaffRequestsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(422).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid query',
          details: parsed.error.flatten(),
        });
      }

      const { status, page, pageSize } = parsed.data;
      const where: Prisma.RequestWhereInput = {};
      if (status) where.status = status as RequestStatus;

      const [total, items] = await Promise.all([
        prisma.request.count({ where }),
        prisma.request.findMany({
          where,
          include: requestInclude,
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
        return reply.code(422).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: parsed.error.flatten(),
        });
      }

      const r = await prisma.request.findUnique({
        where: { id },
        include: { requestType: true, student: true },
      });
      if (!r) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Not found' });

      const allowed = VALID_TRANSITIONS[r.status] ?? [];
      if (!allowed.includes(parsed.data.status)) {
        return reply.code(409).send({
          code: 'CONFLICT',
          message: `Cannot transition from ${r.status} to ${parsed.data.status}`,
        });
      }

      const staffUserId = request.user!.sub;
      const statusLabels: Record<string, string> = {
        submitted: 'Подано',
        in_review: 'В обработке',
        needs_info: 'Требуется уточнение',
        ready: 'Готово к выдаче',
        rejected: 'Отклонено',
        cancelled: 'Отменено',
      };

      const [updated] = await prisma.$transaction([
        prisma.request.update({
          where: { id },
          data: {
            status: parsed.data.status as RequestStatus,
            history: {
              create: [
                {
                  status: parsed.data.status as RequestStatus,
                  actorId: staffUserId,
                  comment: parsed.data.comment ?? null,
                },
              ],
            },
          },
          include: requestInclude,
        }),
        prisma.notification.create({
          data: {
            userId: r.studentId,
            kind: 'request_update',
            title: `Статус заявления изменен: ${statusLabels[parsed.data.status] ?? parsed.data.status}`,
            body:
              parsed.data.comment ??
              `${r.requestType.title}: статус обновлен на "${statusLabels[parsed.data.status] ?? parsed.data.status}".`,
            priority:
              parsed.data.status === 'needs_info'
                ? 'urgent'
                : parsed.data.status === 'ready'
                  ? 'high'
                  : 'normal',
            link: '/requests',
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
          priority: a.priority ?? 'high',
          kind: a.kind ?? 'announcement',
          createdAt: a.createdAt.toISOString(),
          recipientCount: a.recipientCount ?? 0,
          recipients: Array.isArray(a.recipients) ? a.recipients : undefined,
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
        return reply.code(422).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: parsed.error.flatten(),
        });
      }

      const { title, body, group: groupName, targetUserId, priority, kind } = parsed.data;
      const normalizedGroup = groupName === 'all' ? null : (groupName ?? null);

      let targets: Array<{ id: string; fullName: string }> = [];
      if (targetUserId) {
        const u = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { id: true, fullName: true, role: true },
        });
        if (u && u.role === 'student') targets = [{ id: u.id, fullName: u.fullName }];
      } else if (normalizedGroup) {
        const groupRecord = await prisma.group.findFirst({
          where: { code: normalizedGroup },
          include: {
            studentProfiles: { include: { user: { select: { id: true, fullName: true } } } },
          },
        });
        targets = groupRecord?.studentProfiles.map((sp) => sp.user) ?? [];
      } else {
        targets = await prisma.user.findMany({
          where: { role: 'student' },
          select: { id: true, fullName: true },
        });
      }

      const created = await prisma.announcement.create({
        data: {
          title,
          body,
          targetGroup: normalizedGroup,
          targetUserId: targetUserId ?? null,
          priority,
          kind: kind as NotificationKind,
          recipientCount: targets.length,
          recipients: targets.map((t) => t.fullName) as Prisma.InputJsonValue,
        },
      });

      const link =
        kind === 'schedule_change' ? '/schedule' : kind === 'request_update' ? '/requests' : null;

      if (targets.length > 0) {
        await prisma.notification.createMany({
          data: targets.map((u) => ({
            userId: u.id,
            kind: kind as NotificationKind,
            title,
            body,
            priority,
            link,
          })),
        });
      }

      return reply.code(201).send({ ok: true, id: created.id, count: targets.length });
    },
  });

  // DELETE /api/v1/staff/announcements/:id
  app.delete<{ Params: { id: string } }>('/staff/announcements/:id', {
    preHandler: [authenticate, requireStaff],
    handler: async (request, reply) => {
      const { id } = request.params;
      if (!UUID_REGEX.test(id)) {
        return reply.code(404).send({ error: 'Announcement not found' });
      }
      try {
        await prisma.announcement.delete({ where: { id } });
      } catch (err: unknown) {
        return reply.code(404).send({ error: 'Announcement not found' });
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
        return reply.code(422).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: parsed.error.flatten(),
        });
      }

      const { scheduleEntryId, status, room, start, end, note, notifyGroup } = parsed.data;

      const entry = await prisma.scheduleEntry.findUnique({
        where: { id: scheduleEntryId },
        include: {
          group: { include: { studentProfiles: { select: { userId: true } } } },
          subject: true,
        },
      });
      if (!entry)
        return reply.code(404).send({ code: 'NOT_FOUND', message: 'Schedule entry not found' });

      const updateData: {
        status: ScheduleStatus;
        changeNote?: string | null;
        roomId?: string | null;
        startTime?: string;
        endTime?: string;
      } = { status: status as ScheduleStatus };
      if (note !== undefined) updateData.changeNote = note || null;
      if (start) updateData.startTime = start;
      if (end) updateData.endTime = end;

      if (room) {
        let roomRecord = await prisma.room.findFirst({ where: { code: room } });
        if (!roomRecord) {
          roomRecord = await prisma.room.create({ data: { code: room } });
        }
        updateData.roomId = roomRecord.id;
      }

      await prisma.scheduleEntry.update({ where: { id: scheduleEntryId }, data: updateData });

      if (notifyGroup) {
        const affectedUserIds = entry.group.studentProfiles.map((sp) => sp.userId);
        const dateStr = entry.date.toISOString().split('T')[0];
        const statusLabels: Record<string, string> = {
          normal: 'Расписание подтверждено',
          room_changed: `Замена аудитории на ${room || 'новую'}`,
          moved: `Перенос времени на ${start || entry.startTime}-${end || entry.endTime}`,
          cancelled: 'Занятие отменено',
        };
        const notifTitle = `Изменение в расписании: ${entry.subject.name}`;
        const notifBody =
          note ||
          `Внимание, группа ${entry.group.code} (${dateStr})! По дисциплине "${entry.subject.name}" статус: ${statusLabels[status]}.`;

        if (affectedUserIds.length > 0) {
          await prisma.notification.createMany({
            data: affectedUserIds.map((userId) => ({
              userId,
              kind: 'schedule_change' as const,
              title: notifTitle,
              body: notifBody,
              priority: 'urgent',
              link: '/schedule',
            })),
          });
        }
      }

      return reply.send({ ok: true });
    },
  });

  // GET /api/v1/staff/exams?group=CODE
  app.get('/staff/exams', {
    preHandler: [authenticate, requireStaff],
    handler: async (request, reply) => {
      const parsedQuery = StaffExamsQuerySchema.safeParse(request.query);
      if (!parsedQuery.success) {
        return reply.code(422).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid query params',
          details: parsedQuery.error.flatten(),
        });
      }
      const groupCode = parsedQuery.data.group;
      const where: Prisma.ExamWhereInput = {};
      if (groupCode && groupCode !== 'all') {
        where.group = { code: groupCode };
      }

      const exams = await prisma.exam.findMany({
        where,
        include: { group: true },
        orderBy: { rawDate: 'asc' },
      });

      return reply.send(exams.map(formatExam));
    },
  });

  // POST /api/v1/staff/exams
  app.post('/staff/exams', {
    preHandler: [authenticate, requireStaff],
    handler: async (request, reply) => {
      const parsed = ExamCreateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(422).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: parsed.error.flatten(),
        });
      }

      const d = parsed.data;
      const grp = await prisma.group.findFirst({
        where: { code: d.groupId },
        include: { studentProfiles: { select: { userId: true } } },
      });
      if (!grp) {
        return reply.code(404).send({ code: 'NOT_FOUND', message: 'Group not found' });
      }

      const rawDate = d.rawDate ?? new Date().toISOString().slice(0, 10);
      const snapshot = {
        date: d.date,
        rawDate,
        time: d.time,
        room: d.room,
        consultation: d.consultation,
        examiner: d.examiner,
        commissionMembers: d.commissionMembers ?? null,
        status: d.status,
        changeNote: d.changeNote ?? null,
      };

      const created = await prisma.exam.create({
        data: {
          code: d.code,
          groupId: grp.id,
          subject: d.subject,
          format: d.format,
          examiner: d.examiner,
          commissionMembers: d.commissionMembers ?? null,
          date: d.date,
          rawDate,
          time: d.time,
          room: d.room,
          consultation: d.consultation,
          credits: d.credits,
          status: d.status as ExamStatus,
          changeNote: d.changeNote ?? null,
          isDebt: d.isDebt,
          originalSnapshot: snapshot as Prisma.InputJsonValue,
        },
        include: { group: true },
      });

      if (d.notifyGroup) {
        const targetUserIds = grp.studentProfiles.map((sp) => sp.userId);
        if (targetUserIds.length > 0) {
          await prisma.notification.createMany({
            data: targetUserIds.map((userId) => ({
              userId,
              kind: 'schedule_change' as const,
              title: `Утвержден экзамен: ${d.subject}`,
              body: `Внимание, группа ${grp.code}! В график сессии внесен экзамен по дисциплине «${d.subject}» на ${d.date} (${d.time}, ${d.room}). Экзаменатор: ${d.examiner}.`,
              priority: 'high',
              link: '/schedule',
            })),
          });
        }
      }

      return reply.code(201).send(formatExam(created));
    },
  });

  // POST /api/v1/staff/exam-changes
  app.post('/staff/exam-changes', {
    preHandler: [authenticate, requireStaff],
    handler: async (request, reply) => {
      const parsed = ExamChangeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(422).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: parsed.error.flatten(),
        });
      }

      const {
        examId,
        date,
        rawDate,
        time,
        room,
        examiner,
        commissionMembers,
        consultation,
        status,
        changeNote,
        notifyGroup,
        targetGroup,
        subject,
      } = parsed.data;

      // Locate exam by UUID or code if available in DB
      const existing = await prisma.exam.findFirst({
        where: UUID_REGEX.test(examId) ? { id: examId } : { code: examId },
        include: {
          group: { include: { studentProfiles: { select: { userId: true } } } },
        },
      });

      if (!existing) {
        return reply.code(404).send({ code: 'NOT_FOUND', message: 'Exam not found' });
      }

      const updatePayload: Prisma.ExamUpdateInput = {};
      if (date !== undefined) updatePayload.date = date;
      if (rawDate !== undefined) updatePayload.rawDate = rawDate;
      if (time !== undefined) updatePayload.time = time;
      if (room !== undefined) updatePayload.room = room;
      if (examiner !== undefined) updatePayload.examiner = examiner;
      if (commissionMembers !== undefined) updatePayload.commissionMembers = commissionMembers;
      if (consultation !== undefined) updatePayload.consultation = consultation;
      if (changeNote !== undefined) updatePayload.changeNote = changeNote;
      updatePayload.status = (status ?? 'date_changed') as ExamStatus;

      const updatedExam = await prisma.exam.update({
        where: { id: existing.id },
        data: updatePayload,
        include: { group: true },
      });

      const resolvedGroupCode = targetGroup ?? existing.group.code;
      const resolvedSubject = subject ?? existing.subject ?? 'Экзамен';
      const targetUserIds: string[] = existing.group.studentProfiles.map((sp) => sp.userId);

      if (notifyGroup && targetUserIds.length > 0) {
        const statusMap: Record<string, string> = {
          date_changed: 'Перенос даты экзамена',
          room_changed: 'Замена аудитории экзамена',
          postponed: 'Перенос экзамена на резервный день',
          cancelled: 'Отмена экзамена',
          scheduled: 'График экзамена подтвержден',
        };
        const finalStatus = updatedExam.status;
        const title = `Изменение даты экзамена: ${resolvedSubject}`;
        const noteText = updatedExam.changeNote
          ? ` Примечание деканата: ${updatedExam.changeNote}.`
          : '';
        const notifBody = `Внимание, группа ${resolvedGroupCode}! По дисциплине «${resolvedSubject}» статус: ${statusMap[finalStatus] || 'Изменение'}. Новая дата: ${updatedExam.date ?? date ?? '—'}, время: ${updatedExam.time ?? time ?? '—'}, ауд.: ${updatedExam.room ?? room ?? '—'}.${noteText}`;

        await prisma.notification.createMany({
          data: targetUserIds.map((userId) => ({
            userId,
            kind: 'schedule_change' as const,
            title,
            body: notifBody,
            priority: 'urgent',
            link: '/schedule',
          })),
        });
      }

      return reply.send(formatExam(updatedExam));
    },
  });

  // POST /api/v1/staff/exams/:id/reset
  app.post('/staff/exams/:id/reset', {
    preHandler: [authenticate, requireStaff],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const existing = await prisma.exam.findFirst({
        where: UUID_REGEX.test(id) ? { id } : { code: id },
        include: { group: true },
      });
      if (!existing) {
        return reply.code(404).send({ code: 'NOT_FOUND', message: 'Exam not found' });
      }

      const snap = (existing.originalSnapshot ?? {}) as Partial<{
        date: string;
        rawDate: string;
        time: string;
        room: string;
        consultation: string;
        examiner: string;
        commissionMembers: string | null;
        status: ExamStatus;
        changeNote: string | null;
      }>;

      const restored = await prisma.exam.update({
        where: { id: existing.id },
        data: {
          date: snap.date ?? existing.date,
          rawDate: snap.rawDate ?? existing.rawDate,
          time: snap.time ?? existing.time,
          room: snap.room ?? existing.room,
          consultation: snap.consultation ?? existing.consultation,
          examiner: snap.examiner ?? existing.examiner,
          commissionMembers:
            snap.commissionMembers !== undefined
              ? snap.commissionMembers
              : existing.commissionMembers,
          status: snap.status ?? 'scheduled',
          changeNote: snap.changeNote !== undefined ? snap.changeNote : null,
        },
        include: { group: true },
      });

      return reply.send(formatExam(restored));
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
        let sumGpa = 0;
        let gpaCount = 0;

        for (const sp of studentProfiles) {
          const { debts, gpa } = calculateStudentMetrics(sp.grades);
          totalDebt += debts.length;
          if (gpa > 0) {
            sumGpa += gpa;
            gpaCount++;
          }
        }

        const avgGpa = gpaCount > 0 ? Math.round((sumGpa / gpaCount) * 100) / 100 : 4.2;

        return {
          id: g.id,
          code: g.code,
          program: g.program.name,
          faculty: g.program.faculty.name,
          year: g.admissionYear ?? 2023,
          courseNumber: g.year,
          studentsCount: g.studentsCount ?? studentProfiles.length,
          budgetCount: g.budgetCount ?? Math.ceil(studentProfiles.length * 0.6),
          contractCount: g.contractCount ?? Math.floor(studentProfiles.length * 0.4),
          curatorName: g.curatorName ?? undefined,
          curatorContact: g.curatorContact ?? undefined,
          starostaName: g.starostaName ?? undefined,
          starostaEmail: g.starostaEmail ?? undefined,
          starostaPhone: g.starostaPhone ?? undefined,
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
          grades: { include: { subject: true } },
        },
        orderBy: { studentNumber: 'asc' },
      });

      const students = profiles.map((sp) => {
        const { debts, avgScore, gpa } = calculateStudentMetrics(sp.grades);
        return {
          id: sp.userId,
          fullName: sp.user.fullName,
          email: sp.user.email,
          phone: sp.phone ?? '+7 (999) 000-00-00',
          group: sp.group.code,
          year: sp.year,
          studentNumber: sp.studentNumber,
          studyForm: (sp.studyForm === 'Контракт' ? 'Контракт' : 'Бюджет') as 'Бюджет' | 'Контракт',
          gpa,
          averageScore: avgScore,
          debtCount: debts.length,
          debtSubjects: debts.map((d) => d.subject?.name ?? d.subjectId),
          isStarosta: sp.isStarosta ?? false,
          status: (sp.status as 'active' | 'academic_leave' | 'expelled') ?? 'active',
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
              grades: { include: { subject: true } },
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
          phone: sp.phone ?? '+7 (999) 000-00-00',
          group: group.code,
          year: sp.year,
          studentNumber: sp.studentNumber,
          studyForm: (sp.studyForm === 'Контракт' ? 'Контракт' : 'Бюджет') as 'Бюджет' | 'Контракт',
          gpa,
          averageScore: avgScore,
          debtCount: debts.length,
          debtSubjects: debts.map((d) => d.subject?.name ?? d.subjectId),
          isStarosta: sp.isStarosta ?? false,
          status: (sp.status as 'active' | 'academic_leave' | 'expelled') ?? 'active',
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
            include: requestInclude,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user || !user.studentProfile) {
        return reply.code(404).send({ code: 'NOT_FOUND', message: 'Student profile not found' });
      }

      const sp = user.studentProfile;
      const { debts, avgScore, gpa } = calculateStudentMetrics(sp.grades);

      const profile = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: sp.phone ?? '+7 (999) 000-00-00',
        group: sp.group.code,
        year: sp.year,
        studentNumber: sp.studentNumber,
        studyForm: (sp.studyForm === 'Контракт' ? 'Контракт' : 'Бюджет') as 'Бюджет' | 'Контракт',
        gpa,
        averageScore: avgScore,
        debtCount: debts.length,
        debtSubjects: debts.map((d) => d.subject.name),
        isStarosta: sp.isStarosta ?? false,
        status: (sp.status as 'active' | 'academic_leave' | 'expelled') ?? 'active',
        faculty: sp.faculty.name,
        program: sp.program.name,
        admissionYear: sp.group.admissionYear ?? 2023,
        recordBookNumber: `ЗК-${sp.studentNumber.replace('СТ-', '')}`,
        dormitoryInfo: sp.dormitoryInfo ?? 'Проживание по постоянной регистрации (г. Москва)',
        snils: sp.snils ?? '184-293-841 02',
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
          retakeDate: g.retakeDate ? g.retakeDate.toISOString().split('T')[0] : null,
          teacher: g.teacher ?? undefined,
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
