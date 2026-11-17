import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const ScheduleQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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
  return {
    id: entry.id,
    date: entry.date.toISOString().split('T')[0],
    start: entry.startTime,
    end: entry.endTime,
    subject: entry.subject.name,
    type: entry.type,
    room: entry.room?.code ?? null,
    teacher: entry.teacher?.fullName ?? null,
    groupId: entry.group?.code ?? undefined,
    status: entry.status,
    changeNote: entry.changeNote,
  };
}

export async function scheduleRoutes(app: FastifyInstance) {
  // GET /api/v1/schedule?from=&to=&date=
  app.get('/schedule', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const parsed = ScheduleQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(422).send({ code: 'VALIDATION_ERROR', message: 'Invalid query params', details: parsed.error.flatten() });
      }

      const userId = request.user!.sub;
      const sp = await prisma.studentProfile.findUnique({ where: { userId } });
      if (!sp) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Profile not found' });

      // Default to current week Mon-Sun
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
      const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMon);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const fromStr = parsed.data.date ?? parsed.data.from;
      const toStr = parsed.data.date ?? parsed.data.to;
      const from = fromStr ? new Date(fromStr) : monday;
      const to = toStr ? new Date(toStr + 'T23:59:59.999Z') : sunday;

      const entries = await prisma.scheduleEntry.findMany({
        where: {
          groupId: sp.groupId,
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
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const todayEntries = await prisma.scheduleEntry.findMany({
        where: { groupId: sp.groupId, date: { gte: todayStart, lte: todayEnd } },
        include: { subject: true, room: true, teacher: true, group: true },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      });

      // Next upcoming: first entry after today
      const nextEntry = await prisma.scheduleEntry.findFirst({
        where: {
          groupId: sp.groupId,
          date: { gt: todayEnd },
          status: { not: 'cancelled' },
        },
        include: { subject: true, room: true, teacher: true, group: true },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      });

      return reply.send({
        today: todayEntries.map(formatEntry),
        next: nextEntry ? formatEntry(nextEntry) : null,
      });
    },
  });
}
