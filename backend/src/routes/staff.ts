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
  student?: { user: { id: string; email: string; fullName: string; role: string } };
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
      ? { id: r.student.user.id, email: r.student.user.email, fullName: r.student.user.fullName, role: r.student.user.role }
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
            student: { include: { user: true } },
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
        include: { requestType: true, student: { include: { user: true } } },
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
            student: { include: { user: true } },
          },
        }),
        prisma.notification.create({
          data: {
            userId: r.student.userId,
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
        data: { title, body, group: groupName ?? null },
      });

      // Find target users
      let targetUserIds: string[];
      if (groupName) {
        const groupRecord = await prisma.group.findFirst({ where: { name: groupName }, include: { studentProfiles: { select: { userId: true } } } });
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
        const roomRecord = await prisma.room.findFirst({ where: { name: room } });
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
}
