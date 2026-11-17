import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const GradesQuerySchema = z.object({
  semester: z.coerce.number().int().positive().optional(),
});

function gradeToGpa(grade: number | null): number {
  // Russian grade system: 5→4.0, 4→3.0, 3→2.0, 2→1.0
  if (grade === 5) return 4.0;
  if (grade === 4) return 3.0;
  if (grade === 3) return 2.0;
  if (grade === 2) return 1.0;
  return 0;
}

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
        semester: g.semester,
      }));

      const earnedItems = items.filter((i) => i.creditStatus === 'earned');
      const creditsEarned = earnedItems.reduce((sum: number, i) => sum + i.credits, 0);
      const creditsRequired = 240; // standard

      const pointItems = items.filter((i) => i.points !== null);
      const averagePoints = pointItems.length > 0
        ? Math.round((pointItems.reduce((s: number, i) => s + (i.points ?? 0), 0) / pointItems.length) * 10) / 10
        : 0;

      const gradedItems = items.filter((i) => i.grade !== null);
      const gpa = gradedItems.length > 0
        ? Math.round((gradedItems.reduce((s: number, i) => s + gradeToGpa(i.grade), 0) / gradedItems.length) * 100) / 100
        : 0;

      const now = new Date();
      const upcomingExams = items.filter((i) =>
        i.examDate !== null && new Date(i.examDate) > now && i.creditStatus !== 'earned'
      );

      return reply.send({
        semester: parsed.data.semester ?? null,
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
