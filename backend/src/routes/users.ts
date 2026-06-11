import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/authenticate';

const updateProfileSchema = z.object({
  username:    z.string().min(3).max(30).optional(),
  bio:         z.string().max(200).optional(),
  avatarEmoji: z.string().optional(),
});

const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const USER_SELECT = {
  id: true, username: true, handle: true,
  avatarEmoji: true, bio: true, role: true,
  isVerified: true, followersCount: true,
  followingCount: true, likesCount: true,
} as const;

export default async function usersRoutes(app: FastifyInstance) {

  // ── GET /api/users?page=1&limit=20&q=search ──────────────────────────
  app.get('/', async (req, reply) => {
    const { page, limit } = paginationSchema.parse(req.query);
    const { q } = req.query as { q?: string };

    // Auth optionnelle pour renvoyer isFollowing
    let currentUserId: string | null = null;
    try {
      await req.jwtVerify();
      currentUserId = (req.user as { userId: string }).userId;
    } catch { /* non authentifié, pas grave */ }

    const where = q
      ? { OR: [
          { username: { contains: q, mode: 'insensitive' as const } },
          { handle:   { contains: q, mode: 'insensitive' as const } },
        ]}
      : {};

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { followersCount: 'desc' },
        select: USER_SELECT,
      }),
      prisma.user.count({ where }),
    ]);

    // Enrichir avec isFollowing si connecté
    let enriched = users.map(u => ({ ...u, isFollowing: false }));
    if (currentUserId && users.length > 0) {
      const follows = await prisma.follow.findMany({
        where: { followerId: currentUserId, followedId: { in: users.map(u => u.id) } },
        select: { followedId: true },
      });
      const followed = new Set(follows.map(f => f.followedId));
      enriched = users.map(u => ({ ...u, isFollowing: followed.has(u.id) }));
    }

    return reply.send({
      success: true,
      data: { users: enriched, total, page, pages: Math.ceil(total / limit) },
    });
  });

  // ── GET /api/users/me ────────────────────────────────────────────────
  app.get('/me', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { ...USER_SELECT, email: true, phone: true, createdAt: true },
    });

    if (!user) return reply.code(404).send({ success: false, error: 'Introuvable' });
    return reply.send({ success: true, data: { user } });
  });

  // ── PATCH /api/users/me ──────────────────────────────────────────────
  app.patch('/me', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user as { userId: string };

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: parsed.error.errors[0].message });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: parsed.data,
      select: USER_SELECT,
    });

    return reply.send({ success: true, data: { user } });
  });

  // ── GET /api/users/:id ───────────────────────────────────────────────
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };

    const user = await prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) return reply.code(404).send({ success: false, error: 'Utilisateur introuvable' });

    return reply.send({ success: true, data: { user } });
  });

  // ── POST /api/users/:id/follow ───────────────────────────────────────
  app.post('/:id/follow', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user as { userId: string };
    const { id: targetId } = req.params as { id: string };

    if (userId === targetId) {
      return reply.code(400).send({ success: false, error: 'Tu ne peux pas te suivre toi-même' });
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) return reply.code(404).send({ success: false, error: 'Utilisateur introuvable' });

    // Upsert pour éviter les doublons
    const existing = await prisma.follow.findUnique({
      where: { followerId_followedId: { followerId: userId, followedId: targetId } },
    });

    if (existing) {
      return reply.send({ success: true, data: { following: true, message: 'Déjà abonné' } });
    }

    await prisma.$transaction([
      prisma.follow.create({ data: { followerId: userId, followedId: targetId } }),
      prisma.user.update({ where: { id: targetId }, data: { followersCount: { increment: 1 } } }),
      prisma.user.update({ where: { id: userId },   data: { followingCount: { increment: 1 } } }),
    ]);

    return reply.code(201).send({ success: true, data: { following: true } });
  });

  // ── DELETE /api/users/:id/follow ─────────────────────────────────────
  app.delete('/:id/follow', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user as { userId: string };
    const { id: targetId } = req.params as { id: string };

    const existing = await prisma.follow.findUnique({
      where: { followerId_followedId: { followerId: userId, followedId: targetId } },
    });

    if (!existing) {
      return reply.send({ success: true, data: { following: false, message: 'Pas abonné' } });
    }

    await prisma.$transaction([
      prisma.follow.delete({ where: { id: existing.id } }),
      prisma.user.update({ where: { id: targetId }, data: { followersCount: { decrement: 1 } } }),
      prisma.user.update({ where: { id: userId },   data: { followingCount: { decrement: 1 } } }),
    ]);

    return reply.send({ success: true, data: { following: false } });
  });

  // ── GET /api/users/:id/followers ─────────────────────────────────────
  app.get('/:id/followers', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { page, limit } = paginationSchema.parse(req.query);

    const [followers, total] = await prisma.$transaction([
      prisma.follow.findMany({
        where: { followedId: id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { follower: { select: USER_SELECT }, createdAt: true },
      }),
      prisma.follow.count({ where: { followedId: id } }),
    ]);

    return reply.send({
      success: true,
      data: {
        users: followers.map(f => f.follower),
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  });

  // ── GET /api/users/:id/following ──────────────────────────────────────
  app.get('/:id/following', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { page, limit } = paginationSchema.parse(req.query);

    const [following, total] = await prisma.$transaction([
      prisma.follow.findMany({
        where: { followerId: id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { followed: { select: USER_SELECT }, createdAt: true },
      }),
      prisma.follow.count({ where: { followerId: id } }),
    ]);

    return reply.send({
      success: true,
      data: {
        users: following.map(f => f.followed),
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  });
}
