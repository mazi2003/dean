import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const RequestsQuerySchema = z.object({
  status: z.enum(['submitted', 'in_review', 'needs_info', 'ready', 'rejected', 'cancelled']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const CreateRequestSchema = z.object({
  typeCode: z.string().min(1),
  data: z.record(z.unknown()),
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

export async function requestsRoutes(app: FastifyInstance) {
  // GET /api/v1/request-types
  app.get('/request-types', {
    preHandler: [authenticate],
    handler: async (_request, reply) => {
      const types = await prisma.requestType.findMany({ orderBy: { code: 'asc' } });
      return reply.send(types.map(t => ({
        code: t.code,
        title: t.title,
        description: t.description,
        slaDays: t.slaDays,
        fields: t.fields,
      })));
    },
  });

  // GET /api/v1/requests
  app.get('/requests', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const parsed = RequestsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(422).send({ code: 'VALIDATION_ERROR', message: 'Invalid query', details: parsed.error.flatten() });
      }

      const userId = request.user!.sub;
      const sp = await prisma.studentProfile.findUnique({ where: { userId } });
      if (!sp) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Profile not found' });

      const { status, page, pageSize } = parsed.data;
      const where: { studentId: string; status?: string } = { studentId: sp.id };
      if (status) where.status = status;

      const [total, items] = await Promise.all([
        prisma.request.count({ where }),
        prisma.request.findMany({
          where,
          include: {
            requestType: true,
            history: { orderBy: { createdAt: 'asc' } },
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

  // POST /api/v1/requests
  app.post('/requests', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      // Students only
      if (request.user!.role !== 'student') {
        return reply.code(403).send({ code: 'FORBIDDEN', message: 'Students only' });
      }

      const parsed = CreateRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(422).send({ code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() });
      }

      const userId = request.user!.sub;
      const sp = await prisma.studentProfile.findUnique({ where: { userId } });
      if (!sp) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Profile not found' });

      const rt = await prisma.requestType.findUnique({ where: { code: parsed.data.typeCode } });
      if (!rt) {
        return reply.code(422).send({ code: 'VALIDATION_ERROR', message: 'Unknown request type' });
      }

      const newRequest = await prisma.request.create({
        data: {
          studentId: sp.id,
          typeCode: parsed.data.typeCode,
          data: parsed.data.data,
          status: 'submitted',
          history: {
            create: [{ status: 'submitted', comment: null }],
          },
        },
        include: {
          requestType: true,
          history: { orderBy: { createdAt: 'asc' } },
        },
      });

      return reply.code(201).send(formatRequest(newRequest));
    },
  });

  // GET /api/v1/requests/:id
  app.get('/requests/:id', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.sub;
      const sp = await prisma.studentProfile.findUnique({ where: { userId } });
      if (!sp) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Not found' });

      const r = await prisma.request.findFirst({
        where: { id, studentId: sp.id }, // IDOR protection: must be owner
        include: {
          requestType: true,
          history: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (!r) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Not found' });
      return reply.send(formatRequest(r));
    },
  });

  // POST /api/v1/requests/:id/cancel
  app.post('/requests/:id/cancel', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.sub;
      const sp = await prisma.studentProfile.findUnique({ where: { userId } });
      if (!sp) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Not found' });

      const r = await prisma.request.findFirst({
        where: { id, studentId: sp.id },
        include: { requestType: true },
      });

      if (!r) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Not found' });

      if (!['submitted', 'in_review'].includes(r.status)) {
        return reply.code(409).send({ code: 'CONFLICT', message: 'Cannot cancel in current status' });
      }

      const updated = await prisma.request.update({
        where: { id },
        data: {
          status: 'cancelled',
          history: { create: [{ status: 'cancelled', comment: 'Cancelled by student' }] },
        },
        include: {
          requestType: true,
          history: { orderBy: { createdAt: 'asc' } },
        },
      });

      return reply.send(formatRequest(updated));
    },
  });
}
