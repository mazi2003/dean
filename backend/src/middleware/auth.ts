import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { getJwtSigningKey } from '../lib/config';

export interface JwtPayload {
  sub: string;    // userId
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = request.cookies['dean_session'];
  if (!token) {
    return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, getJwtSigningKey()) as JwtPayload;
    request.user = payload;
  } catch {
    return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
}

export async function requireStaff(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user || request.user.role !== 'staff') {
    return reply.code(403).send({ code: 'FORBIDDEN', message: 'Staff access required' });
  }
}

// Augment FastifyRequest
declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}
