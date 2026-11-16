import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

export async function profileRoutes(app: FastifyInstance) {
  // GET /api/v1/profile
  app.get('/profile', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const userId = request.user!.sub;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          studentProfile: {
            include: {
              group: {
                include: {
                  program: {
                    include: { faculty: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      }

      const sp = user.studentProfile;
      return reply.send({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        faculty: sp?.group?.program?.faculty?.name ?? null,
        program: sp?.group?.program?.name ?? null,
        year: sp?.year ?? null,
        group: sp?.group?.name ?? null,
        studentNumber: sp?.studentNumber ?? null,
      });
    },
  });
}
