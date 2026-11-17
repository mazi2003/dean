import Fastify from 'fastify';
import { configureApp, getFastifyOptions } from './createApp';

const app = configureApp(Fastify(getFastifyOptions()));

export default app;
