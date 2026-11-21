import Fastify, { FastifyError, FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

import { getCookieSigningKey } from './lib/config';
import { prisma } from './lib/prisma';
import { authRoutes } from './routes/auth';
import { profileRoutes } from './routes/profile';
import { scheduleRoutes } from './routes/schedule';
import { gradesRoutes } from './routes/grades';
import { requestsRoutes } from './routes/requests';
import { notificationsRoutes } from './routes/notifications';
import { staffRoutes } from './routes/staff';
import { assistantRoutes } from './routes/assistant';

export function resolveCorsOrigins(): string | string[] {
  const configured = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const vercelOrigins =
    process.env.VERCEL === '1'
      ? [
          process.env.VERCEL_URL,
          process.env.VERCEL_BRANCH_URL,
          process.env.VERCEL_PROJECT_PRODUCTION_URL,
        ]
          .filter((host): host is string => Boolean(host && host.trim()))
          .map((host) => (host.startsWith('http') ? host : `https://${host}`))
      : [];

  const combined = [...new Set([...(configured ?? []), ...vercelOrigins])];
  if (combined.length === 0) {
    return 'http://localhost:5173';
  }
  return combined.length === 1 ? combined[0] : combined;
}

export function configureApp(app: FastifyInstance): FastifyInstance {
  // Security plugins
  app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
  });

  app.register(cors, {
    origin: resolveCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  });

  app.register(cookie, {
    secret: getCookieSigningKey(),
  });

  app.register(rateLimit, {
    global: false, // per-route opt-in
    max: 100,
    timeWindow: '1 minute',
  });

  // Central error handler — registered BEFORE routes so child scopes inherit it cleanly
  app.setErrorHandler((error: FastifyError | unknown, _request, reply) => {
    const fastifyErr = (
      typeof error === 'object' && error !== null ? error : {}
    ) as Partial<FastifyError>;
    const statusCode = typeof fastifyErr.statusCode === 'number' ? fastifyErr.statusCode : 500;
    const message = typeof fastifyErr.message === 'string' ? fastifyErr.message : 'Error';
    const code =
      statusCode === 429
        ? 'TOO_MANY_REQUESTS'
        : statusCode === 404
          ? 'NOT_FOUND'
          : statusCode === 403
            ? 'FORBIDDEN'
            : statusCode === 401
              ? 'UNAUTHORIZED'
              : statusCode === 422
                ? 'VALIDATION_ERROR'
                : statusCode === 400
                  ? 'BAD_REQUEST'
                  : 'INTERNAL_ERROR';

    // Only log 5xx
    if (statusCode >= 500) {
      app.log.error({ err: message, code: statusCode }, 'Server error');
    }

    return reply.code(statusCode).send({
      code,
      message: statusCode < 500 ? message : 'Internal server error',
    });
  });

  // 404 handler
  app.setNotFoundHandler((_request, reply) => {
    return reply.code(404).send({ code: 'NOT_FOUND', message: 'Route not found' });
  });

  // Health check (no auth). Pass ?db=1 to verify PostgreSQL connectivity & seed state.
  app.get('/api/v1/health', async (req, reply) => {
    const query = (req.query ?? {}) as { db?: string };
    const base = { status: 'ok', timestamp: new Date().toISOString() };
    if (query.db !== '1') {
      return reply.send(base);
    }

    try {
      const usersCount = await prisma.user.count();
      return reply.send({ ...base, db: 'ok', seeded: usersCount > 0 });
    } catch {
      return reply.code(503).send({ ...base, db: 'error', seeded: false });
    }
  });

  // Routes under /api/v1 prefix
  app.register(
    async (v1) => {
      await v1.register(authRoutes);
      await v1.register(profileRoutes);
      await v1.register(scheduleRoutes);
      await v1.register(gradesRoutes);
      await v1.register(requestsRoutes);
      await v1.register(notificationsRoutes);
      await v1.register(staffRoutes);
      await v1.register(assistantRoutes);
    },
    { prefix: '/api/v1' }
  );

  return app;
}

export function getFastifyOptions() {
  return {
    trustProxy: process.env.TRUST_PROXY !== 'false',
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    },
  };
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify(getFastifyOptions());
  configureApp(app);
  await app.ready();
  return app;
}
