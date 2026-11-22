import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const ScheduleQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  group: z.string().min(1).max(50).optional(),
});

function formatEntry(entry: {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  subject: { name: string };
  type: string;
  room: { code: string } | null;
  teacher: { fullName: string } | null;
  group?: { code: string } | null;
  status: string;
  changeNote: string | null;
}) {
  const jsDay = entry.date.getUTCDay();
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;
  return {
    id: entry.id,
    date: entry.date.toISOString().split('T')[0],
    dayOfWeek,
    start: entry.startTime,
    end: entry.endTime,
    startTime: entry.startTime,
    endTime: entry.endTime,
    subject: entry.subject.name,
    type: entry.type,
    room: entry.room?.code ?? '',
    teacher: entry.teacher?.fullName ?? '',
    groupId: entry.group?.code ?? '',
    status: entry.status,
    changeNote: entry.changeNote,
  };
}

export function formatExam(ex: {
  id: string;
  code: string;
  group?: { code: string } | null;
  subject: string;
  format: string;
  examiner: string;
  commissionMembers: string | null;
  date: string;
  rawDate: string;
  time: string;
  room: string;
  consultation: string;
  credits: number;
  status: string;
  changeNote: string | null;
  retakeDate: string | null;
  isDebt: boolean;
}) {
  return {
    id: ex.id,
    code: ex.code,
    groupId: ex.group?.code ?? '',
    subject: ex.subject,
    format: ex.format,
    examiner: ex.examiner,
    commissionMembers: ex.commissionMembers ?? undefined,
    date: ex.date,
    rawDate: ex.rawDate,
    time: ex.time,
    room: ex.room,
    consultation: ex.consultation,
    credits: ex.credits,
    status: ex.status,
    changeNote: ex.changeNote,
    retakeDate: ex.retakeDate,
    isDebt: ex.isDebt,
  };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export async function scheduleRoutes(app: FastifyInstance) {
  // GET /api/v1/schedule?from=&to=&date=&group=
  app.get('/schedule', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const parsed = ScheduleQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(422).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid query params',
          details: parsed.error.flatten(),
        });
      }

      const userId = request.user!.sub;
      let targetGroupId: string | undefined;

      if (request.user!.role === 'staff') {
        if (parsed.data.group === 'all') {
          targetGroupId = undefined;
        } else if (parsed.data.group) {
          const grp = await prisma.group.findFirst({ where: { code: parsed.data.group } });
          if (!grp) return reply.send([]);
          targetGroupId = grp.id;
        } else {
          const firstGrp = await prisma.group.findFirst({ orderBy: { code: 'asc' } });
          if (!firstGrp) return reply.send([]);
          targetGroupId = firstGrp.id;
        }
      } else {
        const sp = await prisma.studentProfile.findUnique({ where: { userId } });
        if (!sp) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Profile not found' });
        targetGroupId = sp.groupId;
      }

      // Default to current week Mon-Sun in UTC (matching PostgreSQL DATE storage)
      const now = new Date();
      const dayOfWeek = now.getUTCDay();
      const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMon)
      );
      const sunday = new Date(
        Date.UTC(
          monday.getUTCFullYear(),
          monday.getUTCMonth(),
          monday.getUTCDate() + 6,
          23,
          59,
          59,
          999
        )
      );

      const fromStr = parsed.data.date ?? parsed.data.from;
      const toStr = parsed.data.date ?? parsed.data.to;
      const from = fromStr ? new Date(`${fromStr}T00:00:00.000Z`) : monday;
      const to = toStr ? new Date(`${toStr}T23:59:59.999Z`) : sunday;

      const entries = await prisma.scheduleEntry.findMany({
        where: {
          ...(targetGroupId ? { groupId: targetGroupId } : {}),
          date: { gte: from, lte: to },
        },
        include: {
          subject: true,
          room: true,
          teacher: true,
          group: true,
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      });

      return reply.send(entries.map(formatEntry));
    },
  });

  // GET /api/v1/schedule/today
  app.get('/schedule/today', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const userId = request.user!.sub;
      const sp = await prisma.studentProfile.findUnique({ where: { userId } });
      if (!sp) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Profile not found' });

      const now = new Date();
      const todayStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
      );
      const todayEnd = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
      );

      const [todayEntries, futureNextEntry] = await Promise.all([
        prisma.scheduleEntry.findMany({
          where: { groupId: sp.groupId, date: { gte: todayStart, lte: todayEnd } },
          include: { subject: true, room: true, teacher: true, group: true },
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        }),
        prisma.scheduleEntry.findFirst({
          where: {
            groupId: sp.groupId,
            date: { gt: todayEnd },
            status: { not: 'cancelled' },
          },
          include: { subject: true, room: true, teacher: true, group: true },
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        }),
      ]);

      const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
      const nextToday = todayEntries.find(
        (e) => e.status !== 'cancelled' && toMinutes(e.startTime) > nowMinutes
      );
      const nextEntry = nextToday ?? futureNextEntry;

      return reply.send({
        today: todayEntries.map(formatEntry),
        next: nextEntry ? formatEntry(nextEntry) : null,
      });
    },
  });

  const ExamsQuerySchema = z.object({
    group: z.string().min(1).max(50).optional(),
  });

  // GET /api/v1/exams (student: own group only; staff: all or ?group=)
  app.get('/exams', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const parsedQuery = ExamsQuerySchema.safeParse(request.query);
      if (!parsedQuery.success) {
        return reply.code(422).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid query params',
          details: parsedQuery.error.flatten(),
        });
      }
      const userId = request.user!.sub;
      if (request.user!.role === 'staff') {
        const groupQuery = parsedQuery.data.group;
        const where: { group?: { code: string } } = {};
        if (groupQuery && groupQuery !== 'all') {
          where.group = { code: groupQuery };
        }
        const exams = await prisma.exam.findMany({
          where,
          include: { group: true },
          orderBy: { rawDate: 'asc' },
        });
        return reply.send(exams.map(formatExam));
      }

      const sp = await prisma.studentProfile.findUnique({ where: { userId } });
      if (!sp) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Profile not found' });

      const exams = await prisma.exam.findMany({
        where: { groupId: sp.groupId },
        include: { group: true },
        orderBy: { rawDate: 'asc' },
      });
      return reply.send(exams.map(formatExam));
    },
  });
}
