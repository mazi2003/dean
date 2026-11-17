import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { computePointsAndGpa } from './profile';

const GradesQuerySchema = z.object({
  semester: z.coerce.number().int().positive().optional(),
});

export async function gradesRoutes(app: FastifyInstance) {
  // GET /api/v1/grades?semester=
  app.get('/grades', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const parsed = GradesQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(422).send({ code: 'VALIDATION_ERROR', message: 'Invalid query', details: parsed.error.flatten() });
      }

      const userId = request.user!.sub;
      const sp = await prisma.studentProfile.findUnique({ where: { userId } });
      if (!sp) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Profile not found' });

      const where: { studentProfileId: string; semester?: number } = { studentProfileId: sp.id };
      if (parsed.data.semester) where.semester = parsed.data.semester;

      const grades = await prisma.grade.findMany({
        where,
        include: { subject: true },
        orderBy: [{ semester: 'asc' }, { subject: { name: 'asc' } }],
      });

      const items = grades.map((g) => ({
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
      }));

      const earnedItems = items.filter((i) => i.creditStatus === 'earned');
      const creditsEarned = earnedItems.reduce((sum: number, i) => sum + i.credits, 0);
      const creditsRequired = 30;

      const { averageScore: averagePoints, gpa } = computePointsAndGpa(items);

      const now = new Date();
      const upcomingExams = items.filter((i) => {
        if (i.creditStatus === 'failed' && i.retakeDate) return true;
        return i.examDate !== null && new Date(i.examDate) > now && i.creditStatus !== 'earned';
      });

      return reply.send({
        semester: parsed.data.semester ?? 3,
        averagePoints,
        gpa,
        creditsEarned,
        creditsRequired,
        upcomingExams,
        items,
      });
    },
  });
}
