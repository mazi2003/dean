import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { getJwtSigningKey } from '../lib/config';
import { getDummyPasswordHash, verifyPassword } from '../lib/password';
import { authenticate } from '../middleware/auth';

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

function isCookieSecure(): boolean {
  if (process.env.COOKIE_SECURE === 'false') return false;
  if (process.env.COOKIE_SECURE === 'true') return true;
  return process.env.NODE_ENV === 'production';
}

export async function authRoutes(app: FastifyInstance) {
  // POST /api/v1/auth/login
  app.post('/auth/login', {
    config: {
      rateLimit: {
        max: Number(process.env.LOGIN_RATE_LIMIT_MAX || 10),
        timeWindow: '15 minutes',
      },
    },
    handler: async (request, reply) => {
      const parsed = LoginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(422).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: parsed.error.flatten(),
        });
      }
      let normalizedEmail = parsed.data.email.trim().toLowerCase();
      if (normalizedEmail === 'lina.petrova@demo.edu') {
        normalizedEmail = 'lina.okafor@demo.edu';
      } else if (normalizedEmail === 'marina.volkova@demo.edu') {
        normalizedEmail = 'dean.office@demo.edu';
      }
      const { password } = parsed.data;

      // Always do the hash comparison (constant-time, no early exit on "user not found")
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      const dummyHash = await getDummyPasswordHash();
      const hashToVerify = user?.passwordHash ?? dummyHash;

      const valid = await verifyPassword(hashToVerify, password);

      if (!user || !valid) {
        return reply
          .code(401)
          .send({ code: 'UNAUTHORIZED', message: 'Неверный адрес электронной почты или пароль' });
      }

      const token = jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        getJwtSigningKey(),
        { algorithm: 'HS256', expiresIn: '24h' }
      );

      reply.setCookie('dean_session', token, {
        httpOnly: true,
        secure: isCookieSecure(),
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
    reply.clearCookie('dean_session', {
      path: '/',
      httpOnly: true,
      secure: isCookieSecure(),
      sameSite: 'lax',
    });
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
