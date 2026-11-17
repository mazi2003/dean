import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const AskSchema = z.object({
  question: z.string().min(1).max(500),
});

export async function assistantRoutes(app: FastifyInstance) {
  app.post('/assistant/ask', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const parsed = AskSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(422).send({ code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() });
      }

      const apiKey = process.env.AI_API_KEY;
      if (!apiKey) {
        return reply.send({ answer: 'AI assistant is not configured. Please contact your system administrator.' });
      }

      // Gather caller's own data for context (never other users' data)
      const userId = request.user!.sub;
      const sp = await prisma.studentProfile.findUnique({
        where: { userId },
        include: {
          group: { include: { program: { include: { faculty: true } } } },
          grades: { include: { subject: true } },
        },
      });

      const failedGrades = sp?.grades
        .filter((g) => g.creditStatus === 'failed')
        .map((g) => g.subject.name) ?? [];

      const contextSummary = sp
        ? `Student: group ${sp.group?.code ?? 'N/A'}, program ${sp.group?.program?.name ?? 'N/A'}, failedSubjects: ${failedGrades.length > 0 ? failedGrades.join(', ') : 'none'}`
        : 'Staff member';

      try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a helpful dean's office assistant for Demo University (competition concept, fictional). Context: ${contextSummary}. Only answer questions relevant to the student's academic life. Question: ${parsed.data.question}`,
              }],
            }],
          }),
        });

        if (!response.ok) {
          return reply.send({ answer: 'AI assistant is temporarily unavailable.' });
        }

        const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No answer available.';
        return reply.send({ answer });
      } catch {
        return reply.send({ answer: 'AI assistant is temporarily unavailable.' });
      }
    },
  });
}
