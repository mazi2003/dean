import type { IncomingMessage, ServerResponse } from 'node:http';
import Fastify from 'fastify';
import { configureApp, getFastifyOptions } from './createApp';

const fastifyApp = configureApp(Fastify(getFastifyOptions()));

let readyPromise: Promise<unknown> | null = null;

function ensureReady(): Promise<unknown> {
  if (!readyPromise) {
    readyPromise = Promise.resolve(fastifyApp.ready());
  }
  return readyPromise;
}

type VercelFastifyApp = ((req: IncomingMessage, res: ServerResponse) => Promise<void>) &
  typeof fastifyApp;

/**
 * Callable Node.js (req, res) handler for Vercel Serverless / Fluid Compute (@vercel/backends & @vercel/node),
 * while also exposing Fastify lifecycle methods (.ready, .close, .inject, .listen, .server) for tests.
 */
const handler = async function vercelFastifyHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  await ensureReady();
  fastifyApp.server.emit('request', req, res);
};

Object.assign(handler, {
  ready: () => ensureReady(),
  close: async () => {
    readyPromise = null;
    await fastifyApp.close();
  },
  inject: fastifyApp.inject.bind(fastifyApp),
  listen: fastifyApp.listen.bind(fastifyApp),
});

Object.defineProperty(handler, 'server', {
  get() {
    return fastifyApp.server;
  },
  enumerable: true,
});

Object.defineProperty(handler, 'log', {
  get() {
    return fastifyApp.log;
  },
  enumerable: true,
});

const app = handler as unknown as VercelFastifyApp;

export default app;
