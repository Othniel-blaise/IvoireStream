import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/authenticate';

const APP_ID   = process.env.AGORA_APP_ID!;
const APP_CERT = process.env.AGORA_APP_CERTIFICATE!;
const TOKEN_TTL = 7200; // 2h en secondes

function makeToken(channelName: string, uid: number, role: number): string {
  const expiredTs = Math.floor(Date.now() / 1000) + TOKEN_TTL;
  return RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERT, channelName, uid, role, expiredTs, 0);
}

const createSchema = z.object({
  title:       z.string().min(3).max(60),
  emoji:       z.string().max(8).default('🎤'),
  description: z.string().max(200).optional(),
  category:    z.enum(['MUSIC', 'COMEDY', 'BEAUTY', 'TECH', 'COOKING', 'SPORTS', 'EDUCATION', 'LIFESTYLE']),
  visibility:  z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  priceXOF:    z.number().int().min(500).max(100_000).optional(),
});

const listSchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(50).default(20),
  category: z.string().optional(),
});

const HOST_SELECT = {
  id: true, username: true, handle: true,
  avatarEmoji: true, isVerified: true, followersCount: true,
} as const;

export default async function streamsRoutes(app: FastifyInstance) {

  // ── POST /api/streams — Lancer un live ──────────────────────────────
  app.post('/', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user as { userId: string };

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: parsed.error.errors[0].message });
    }

    const { title, emoji, description, category, visibility, priceXOF } = parsed.data;

    // Clôturer tout live précédent du même hôte
    await prisma.liveStream.updateMany({
      where: { hostId: userId, isLive: true },
      data:  { isLive: false, endedAt: new Date() },
    });

    const stream = await prisma.liveStream.create({
      data: {
        hostId:      userId,
        title,
        emoji,
        description,
        category,
        visibility,
        priceXOF:    visibility === 'PRIVATE' ? (priceXOF ?? 2000) : null,
        isLive:      true,
      },
      include: { host: { select: HOST_SELECT } },
    });

    const channelName = stream.id;
    const agoraToken  = makeToken(channelName, 0, RtcRole.PUBLISHER);

    // Mise à jour du compteur de lives du wallet
    await prisma.wallet.update({
      where: { userId },
      data:  { livesCount: { increment: 1 } },
    }).catch(() => { /* wallet peut ne pas exister encore */ });

    return reply.code(201).send({
      success: true,
      data: { stream, channelName, agoraToken, appId: APP_ID },
    });
  });

  // ── GET /api/streams — Liste des lives actifs ────────────────────────
  app.get('/', async (req, reply) => {
    const { page, limit, category } = listSchema.parse(req.query);

    const where = {
      isLive:     true,
      visibility: 'PUBLIC' as const,
      ...(category ? { category: category.toUpperCase() as any } : {}),
    };

    const [streams, total] = await prisma.$transaction([
      prisma.liveStream.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { viewerCount: 'desc' },
        include: { host: { select: HOST_SELECT } },
      }),
      prisma.liveStream.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: { streams, total, page, pages: Math.ceil(total / limit) },
    });
  });

  // ── GET /api/streams/:id — Détail + token viewer ─────────────────────
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };

    const stream = await prisma.liveStream.findUnique({
      where:   { id },
      include: { host: { select: HOST_SELECT } },
    });

    if (!stream) return reply.code(404).send({ success: false, error: 'Stream introuvable' });

    const agoraToken = makeToken(stream.id, 0, RtcRole.SUBSCRIBER);

    return reply.send({
      success: true,
      data: { stream, channelName: stream.id, agoraToken, appId: APP_ID },
    });
  });

  // ── POST /api/streams/:id/end — Terminer le live ─────────────────────
  app.post('/:id/end', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user as { userId: string };
    const { id }     = req.params as { id: string };

    const stream = await prisma.liveStream.findUnique({ where: { id } });
    if (!stream)                  return reply.code(404).send({ success: false, error: 'Stream introuvable' });
    if (stream.hostId !== userId) return reply.code(403).send({ success: false, error: 'Non autorisé' });

    const updated = await prisma.liveStream.update({
      where: { id },
      data:  { isLive: false, endedAt: new Date() },
    });

    return reply.send({ success: true, data: { stream: updated } });
  });

  // ── POST /api/streams/:id/view — Incrémenter viewerCount ─────────────
  app.post('/:id/view', async (req, reply) => {
    const { id } = req.params as { id: string };

    const stream = await prisma.liveStream.update({
      where: { id, isLive: true },
      data:  { viewerCount: { increment: 1 } },
    }).catch(() => null);

    if (!stream) return reply.code(404).send({ success: false, error: 'Stream introuvable ou terminé' });

    return reply.send({ success: true, data: { viewerCount: stream.viewerCount } });
  });
}
