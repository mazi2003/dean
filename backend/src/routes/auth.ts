import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  // POST /api/v1/auth/login
  app.post('/auth/login', {
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
    handler: async (request, reply) => {
      const parsed = LoginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(422).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: parsed.error.flatten(),
        });
      }
      const { email, password } = parsed.data;

      // Always do the hash comparison (constant-time, no early exit on "user not found")
      const user = await prisma.user.findUnique({ where: { email } });

      // Use a dummy hash if user not found (constant-time protection)
      const dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$dummysaltdummysalt$dummyhashresultdummyhashresultdummyhashresult';
      const hashToVerify = user?.passwordHash ?? dummyHash;

      let valid = false;
      try {
        valid = await argon2.verify(hashToVerify, password);
      } catch {
        valid = false;
      }

      if (!user || !valid) {
        return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
      }

      const secret = process.env.JWT_SECRET ?? 'changeme';
      const token = jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        secret,
        { expiresIn: '24h' }
      );

      const isProduction = process.env.NODE_ENV === 'production';
      reply.setCookie('dean_session', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      return reply.send({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      });
    },
  });

  // POST /api/v1/auth/logout
  app.post('/auth/logout', async (_request, reply) => {
    reply.clearCookie('dean_session', { path: '/' });
    return reply.code(204).send();
  });

  // GET /api/v1/auth/me
  app.get('/auth/me', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const userId = request.user!.sub;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      }
      return reply.send({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      });
    },
  });
}
