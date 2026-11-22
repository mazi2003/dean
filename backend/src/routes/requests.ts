import { FastifyInstance } from 'fastify';
import { Prisma, RequestStatus, RequestTypeCode } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const RequestsQuerySchema = z.object({
  status: z
    .enum(['submitted', 'in_review', 'needs_info', 'ready', 'rejected', 'cancelled'])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const CreateRequestSchema = z.object({
  typeCode: z.enum([
    'study_certificate',
    'military_certificate',
    'scholarship_application',
    'academic_leave',
    'transcript',
    'dormitory_application',
  ]),
  data: z
    .record(
      z.string().min(1).max(64),
      z.union([z.string().max(1000), z.number(), z.boolean(), z.null()])
    )
    .refine((obj) => Object.keys(obj).length >= 1 && Object.keys(obj).length <= 20, {
      message: 'Request data must contain between 1 and 20 fields',
    }),
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function formatRequest(r: {
  id: string;
  studentId: string;
  typeCode: string;
  requestType: { title: string; slaDays: number };
  status: string;
  createdAt: Date;
  updatedAt: Date;
  data: unknown;
  history?: Array<{
    id?: string;
    status: string;
    createdAt: Date;
    comment: string | null;
    actor?: { fullName: string } | null;
  }>;
  student?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    studentProfile?: { group?: { code: string } | null } | null;
  };
}) {
  const expectedBy = new Date(r.createdAt);
  expectedBy.setDate(expectedBy.getDate() + r.requestType.slaDays);
  const expectedIso = expectedBy.toISOString().split('T')[0];

  return {
    id: r.id,
    studentId: r.studentId,
    studentName: r.student?.fullName,
    studentGroup: r.student?.studentProfile?.group?.code ?? undefined,
    typeCode: r.typeCode,
    typeTitle: r.requestType.title,
    slaDays: r.requestType.slaDays,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    expectedBy: expectedIso,
    expectedDate: expectedIso,
    data: r.data,
    digitalDocAvailable: r.typeCode === 'study_certificate' || r.typeCode === 'transcript',
    history:
      r.history?.map((h) => ({
        id: h.id,
        status: h.status,
        at: h.createdAt.toISOString(),
        createdAt: h.createdAt.toISOString(),
        comment: h.comment ?? undefined,
        authorName: h.actor?.fullName ?? r.student?.fullName ?? 'Система',
      })) ?? [],
    student: r.student
      ? {
          id: r.student.id,
          email: r.student.email,
          fullName: r.student.fullName,
          role: r.student.role,
        }
      : undefined,
  };
}

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

export async function requestsRoutes(app: FastifyInstance) {
  // GET /api/v1/request-types
  app.get('/request-types', {
    preHandler: [authenticate],
    handler: async (_request, reply) => {
      reply.header('cache-control', 'private, max-age=300, stale-while-revalidate=60');
      const types = await prisma.requestType.findMany({ orderBy: { code: 'asc' } });
      return reply.send(
        types.map((t) => ({
          code: t.code,
          title: t.title,
          description: t.description,
          slaDays: t.slaDays,
          fields: t.fields,
        }))
      );
    },
  });

  // GET /api/v1/requests
  app.get('/requests', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const parsed = RequestsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(422).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid query',
          details: parsed.error.flatten(),
        });
      }

      const userId = request.user!.sub;
      const { status, page, pageSize } = parsed.data;
      const where: Prisma.RequestWhereInput = { studentId: userId };
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

  // POST /api/v1/requests
  app.post('/requests', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      if (request.user!.role !== 'student') {
        return reply.code(403).send({ code: 'FORBIDDEN', message: 'Students only' });
      }

      const parsed = CreateRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(422).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: parsed.error.flatten(),
        });
      }

      const userId = request.user!.sub;
      const [sp, rt] = await Promise.all([
        prisma.studentProfile.findUnique({ where: { userId } }),
        prisma.requestType.findUnique({
          where: { code: parsed.data.typeCode as RequestTypeCode },
        }),
      ]);
      if (!sp) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Profile not found' });
      if (!rt) {
        return reply.code(422).send({ code: 'VALIDATION_ERROR', message: 'Unknown request type' });
      }

      const fields = Array.isArray(rt.fields)
        ? (rt.fields as Array<{ name?: string; required?: boolean }>)
        : [];
      const missingFields = fields
        .filter((f) => f.required && typeof f.name === 'string')
        .filter((f) => {
          const val = parsed.data.data[f.name!];
          return val === undefined || val === null || String(val).trim() === '';
        })
        .map((f) => f.name!);
      if (missingFields.length > 0) {
        return reply.code(422).send({
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: { missingFields },
        });
      }

      const newRequest = await prisma.$transaction(async (tx) => {
        const created = await tx.request.create({
          data: {
            studentId: userId,
            typeCode: parsed.data.typeCode as RequestTypeCode,
            data: parsed.data.data as Prisma.InputJsonValue,
            status: 'submitted',
            history: {
              create: [
                {
                  status: 'submitted',
                  actorId: userId,
                  comment: 'Заявление отправлено в деканат на рассмотрение.',
                },
              ],
            },
          },
          include: requestInclude,
        });

        // Confirmation notification for student
        await tx.notification.create({
          data: {
            userId,
            kind: 'request_update',
            title: `Заявление принято: ${rt.title}`,
            body: `Ваше заявление зарегистрировано и передано на рассмотрение в деканат.`,
            priority: 'normal',
            link: '/requests',
          },
        });

        return created;
      });

      return reply.code(201).send(formatRequest(newRequest));
    },
  });

  // GET /api/v1/requests/:id
  app.get('/requests/:id', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      if (!UUID_REGEX.test(id)) {
        return reply.code(404).send({ code: 'NOT_FOUND', message: 'Not found' });
      }

      const userId = request.user!.sub;
      const r = await prisma.request.findFirst({
        where: { id, studentId: userId }, // IDOR protection: must be owner
        include: requestInclude,
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
      if (!UUID_REGEX.test(id)) {
        return reply.code(404).send({ code: 'NOT_FOUND', message: 'Not found' });
      }

      const userId = request.user!.sub;
      const r = await prisma.request.findFirst({
        where: { id, studentId: userId }, // IDOR protection: must be owner
        include: { requestType: true },
      });

      if (!r) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Not found' });

      if (!['submitted', 'in_review'].includes(r.status)) {
        return reply
          .code(409)
          .send({ code: 'CONFLICT', message: 'Cannot cancel in current status' });
      }

      const updated = await prisma.request.update({
        where: { id },
        data: {
          status: 'cancelled',
          history: {
            create: [
              { status: 'cancelled', actorId: userId, comment: 'Заявление отменено студентом.' },
            ],
          },
        },
        include: requestInclude,
      });

      return reply.send(formatRequest(updated));
    },
  });
}
