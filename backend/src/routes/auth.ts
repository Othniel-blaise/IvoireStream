import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const REFRESH_TOKEN_TTL_DAYS = 30;

const registerSchema = z.object({
  username:    z.string().min(3).max(30),
  handle:      z.string().min(3).max(30).regex(/^@?[a-zA-Z0-9_]+$/, 'Handle invalide'),
  email:       z.string().email('Email invalide'),
  password:    z.string().min(8, 'Mot de passe trop court (min 8 caractères)'),
  phone:       z.string().optional(),
  avatarEmoji: z.string().default('👤'),
});

const loginSchema = z.object({
  emailOrPhone: z.string().min(1),
  password:     z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

function normalizeHandle(raw: string): string {
  const h = raw.startsWith('@') ? raw : `@${raw}`;
  return h.toLowerCase();
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export default async function authRoutes(app: FastifyInstance) {

  // ── POST /api/auth/register ──────────────────────────────────────────
  app.post('/register', async (req, reply) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: parsed.error.errors[0].message,
      });
    }

    const { username, email, password, phone, avatarEmoji } = parsed.data;
    const handle = normalizeHandle(parsed.data.handle);

    // Check duplicates
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { handle }, { phone: phone ?? undefined }] },
    });
    if (existing) {
      const field = existing.email === email ? 'email'
        : existing.handle === handle ? 'handle'
        : 'téléphone';
      return reply.code(409).send({ success: false, error: `Ce ${field} est déjà utilisé` });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        handle,
        email,
        phone,
        passwordHash,
        avatarEmoji,
        role: 'CREATOR',
        wallet: { create: {} },
      },
      select: {
        id: true, username: true, handle: true,
        email: true, avatarEmoji: true, role: true, isVerified: true,
        followersCount: true, followingCount: true, likesCount: true,
      },
    });

    const accessToken = app.jwt.sign(
      { userId: user.id, role: user.role },
      { expiresIn: '15m' },
    );

    const rawRefresh = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: rawRefresh,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 86400_000),
      },
    });

    return reply.code(201).send({
      success: true,
      data: { user, accessToken, refreshToken: rawRefresh },
    });
  });

  // ── POST /api/auth/login ─────────────────────────────────────────────
  app.post('/login', async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: 'Données invalides' });
    }

    const { emailOrPhone, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrPhone },
          { phone: emailOrPhone },
        ],
      },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.code(401).send({ success: false, error: 'Identifiants incorrects' });
    }

    const accessToken = app.jwt.sign(
      { userId: user.id, role: user.role },
      { expiresIn: '15m' },
    );

    const rawRefresh = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: rawRefresh,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 86400_000),
      },
    });

    const { passwordHash: _, ...safeUser } = user;

    return reply.send({
      success: true,
      data: { user: safeUser, accessToken, refreshToken: rawRefresh },
    });
  });

  // ── POST /api/auth/refresh ───────────────────────────────────────────
  app.post('/refresh', async (req, reply) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: 'Token manquant' });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: parsed.data.refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
      return reply.code(401).send({ success: false, error: 'Session expirée, reconnecte-toi' });
    }

    const accessToken = app.jwt.sign(
      { userId: stored.user.id, role: stored.user.role },
      { expiresIn: '15m' },
    );

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const newRawRefresh = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        userId: stored.user.id,
        token: newRawRefresh,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 86400_000),
      },
    });

    return reply.send({
      success: true,
      data: { accessToken, refreshToken: newRawRefresh },
    });
  });

  // ── POST /api/auth/logout ────────────────────────────────────────────
  app.post('/logout', async (req, reply) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (parsed.success) {
      await prisma.refreshToken.deleteMany({
        where: { token: parsed.data.refreshToken },
      });
    }
    return reply.send({ success: true });
  });

  // ── GET /api/auth/me ─────────────────────────────────────────────────
  app.get('/me', {
    preHandler: async (req, reply) => {
      try { await req.jwtVerify(); }
      catch { reply.code(401).send({ success: false, error: 'Non authentifié' }); }
    },
  }, async (req, reply) => {
    const { userId } = req.user as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, username: true, handle: true, email: true,
        phone: true, avatarEmoji: true, bio: true, role: true,
        isVerified: true, followersCount: true, followingCount: true, likesCount: true,
        createdAt: true,
      },
    });

    if (!user) return reply.code(404).send({ success: false, error: 'Utilisateur introuvable' });

    return reply.send({ success: true, data: { user } });
  });
}
