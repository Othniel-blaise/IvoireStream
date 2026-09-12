import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { prisma } from './lib/prisma';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import streamsRoutes from './routes/streams';
import chatRoutes from './routes/chat';

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      ...(process.env.NODE_ENV !== 'production' && {
        transport: { target: 'pino-pretty', options: { colorize: true } },
      }),
    },
  });

  // ── Security ────────────────────────────────────────────────────────
  await app.register(helmet, { global: true });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN === '*'
      ? true
      : (process.env.CORS_ORIGIN ?? '').split(',').map(s => s.trim()),
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      success: false,
      error: 'Trop de requêtes. Réessaie dans une minute.',
    }),
  });

  // ── Auth plugin ─────────────────────────────────────────────────────
  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'change-in-production',
  });

  // ── Health ──────────────────────────────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    service: 'IvoireStream API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }));

  // ── WebSocket ────────────────────────────────────────────────────────
  await app.register(websocket);

  // ── Routes ──────────────────────────────────────────────────────────
  await app.register(authRoutes,    { prefix: '/api/auth' });
  await app.register(usersRoutes,   { prefix: '/api/users' });
  await app.register(streamsRoutes, { prefix: '/api/streams' });
  await app.register(chatRoutes,    { prefix: '/api/chat' });

  // ── Graceful shutdown ───────────────────────────────────────────────
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  return app;
}
