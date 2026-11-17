import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

export function computePointsAndGpa(grades: Array<{ points: number | null; grade: number | null }>) {
  const pointItems = grades.filter((g) => g.points !== null);
  const averageScore = pointItems.length > 0
    ? Math.round((pointItems.reduce((s, g) => s + (g.points ?? 0), 0) / pointItems.length) * 10) / 10
    : 0;

  // 5-point Russian GPA scale matching frontend UI (e.g. 4.8, 3.4, 4.2)
  const gradedItems = grades.filter((g) => g.grade !== null);
  const gpa = gradedItems.length > 0
    ? Math.round((gradedItems.reduce((s, g) => s + (g.grade ?? 0), 0) / gradedItems.length) * 100) / 100
    : 0;

  return { averageScore, gpa };
}

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
              grades: true,
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
      if (!sp) {
        // Staff profile
        return reply.send({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          faculty: 'Деканат Факультета МО',
          program: 'Административное управление',
          year: 0,
          group: 'ДЕКАНАТ-МО',
          studentNumber: 'ТАБ-0441',
        });
      }

      const { averageScore, gpa } = computePointsAndGpa(sp.grades ?? []);

      return reply.send({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        faculty: sp.group?.program?.faculty?.name ?? null,
        program: sp.group?.program?.name ?? null,
        year: sp.year ?? null,
        group: sp.group?.code ?? null,
        studentNumber: sp.studentNumber ?? null,
        studyForm: sp.studyForm ?? 'Бюджет',
        averageScore,
        gpa,
      });
    },
  });
}
