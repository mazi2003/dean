import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const NotifQuerySchema = z.object({
  unread: z.enum(['true', 'false']).optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
  kind: z.enum(['announcement', 'deadline', 'request_update', 'schedule_change']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function notificationsRoutes(app: FastifyInstance) {
  // GET /api/v1/notifications
  app.get('/notifications', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const parsed = NotifQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(422).send({ code: 'VALIDATION_ERROR', message: 'Invalid query', details: parsed.error.flatten() });
      }

      const userId = request.user!.sub;
      const { unread, kind, page, pageSize } = parsed.data;

      const where: { userId: string; read?: boolean; kind?: string } = { userId };
      if (unread !== undefined) where.read = !unread;
      if (kind) where.kind = kind;

      const [total, unreadCount, items] = await Promise.all([
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId, read: false } }),
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return reply.send({
        page,
        pageSize,
        total,
        unreadCount,
        items: items.map(n => ({
          id: n.id,
          kind: n.kind,
          title: n.title,
          body: n.body,
          createdAt: n.createdAt.toISOString(),
          read: n.read,
          link: n.link,
        })),
      });
    },
  });

  // POST /api/v1/notifications/:id/read
  app.post('/notifications/:id/read', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.sub;

      const notif = await prisma.notification.findFirst({ where: { id, userId } });
      if (!notif) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Not found' });

      await prisma.notification.update({ where: { id }, data: { read: true } });
      return reply.code(204).send();
    },
  });

  // POST /api/v1/notifications/read-all
  app.post('/notifications/read-all', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const userId = request.user!.sub;
      await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
      return reply.code(204).send();
    },
  });
}
