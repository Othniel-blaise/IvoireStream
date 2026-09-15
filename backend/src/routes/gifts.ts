import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/authenticate';
import { creatorShare } from '../services/payments';
import { broadcastToRoom } from './chat';

// Catalogue serveur : le client ne choisit jamais le prix
export const GIFT_CATALOG = [
  { id: 'rose',     emoji: '🌹', label: 'Rose',       xofValue: 100    },
  { id: 'clap',     emoji: '👏', label: 'Bravo',      xofValue: 200    },
  { id: 'fire',     emoji: '🔥', label: 'Feu',        xofValue: 500    },
  { id: 'heart',    emoji: '💖', label: 'Cœur',       xofValue: 1_000  },
  { id: 'crown',    emoji: '👑', label: 'Couronne',   xofValue: 2_500  },
  { id: 'diamond',  emoji: '💎', label: 'Diamant',    xofValue: 5_000  },
  { id: 'rocket',   emoji: '🚀', label: 'Fusée',      xofValue: 10_000 },
  { id: 'lion',     emoji: '🦁', label: 'Lion',       xofValue: 25_000 },
] as const;

const sendSchema = z.object({ giftId: z.string().min(1) });

export default async function giftsRoutes(app: FastifyInstance) {

  // ── GET /api/gifts/catalog ───────────────────────────────────────────
  app.get('/catalog', async () => ({ success: true, data: { gifts: GIFT_CATALOG } }));

  // ── POST /api/gifts/:streamId — Envoyer un cadeau (débit solde) ──────
  app.post('/:streamId', { preHandler: authenticate }, async (req, reply) => {
    const { userId }   = req.user as { userId: string };
    const { streamId } = req.params as { streamId: string };

    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ success: false, error: 'giftId requis' });
    const gift = GIFT_CATALOG.find(g => g.id === parsed.data.giftId);
    if (!gift) return reply.code(400).send({ success: false, error: 'Cadeau inconnu' });

    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId }, select: { id: true, hostId: true, isLive: true, title: true },
    });
    if (!stream || !stream.isLive) return reply.code(404).send({ success: false, error: 'Live introuvable ou terminé' });
    if (stream.hostId === userId)  return reply.code(400).send({ success: false, error: "Tu ne peux pas t'offrir un cadeau" });

    const sender = await prisma.user.findUnique({
      where: { id: userId }, select: { id: true, username: true, avatarEmoji: true },
    });
    if (!sender) return reply.code(404).send({ success: false, error: 'Utilisateur introuvable' });

    const share = creatorShare(gift.xofValue);

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Débit atomique : échoue si solde insuffisant
        const debited = await tx.wallet.updateMany({
          where: { userId, balanceXOF: { gte: gift.xofValue } },
          data:  { balanceXOF: { decrement: gift.xofValue } },
        });
        if (debited.count === 0) throw new Error('INSUFFICIENT');

        const senderWallet = await tx.wallet.findUnique({ where: { userId } });
        await tx.transaction.create({
          data: { walletId: senderWallet!.id, type: 'GIFT_SENT', label: `${gift.label} envoyé`, amountXOF: -gift.xofValue, emoji: gift.emoji },
        });

        // Crédit du créateur (part après commission)
        await tx.wallet.upsert({
          where:  { userId: stream.hostId },
          create: { userId: stream.hostId, balanceXOF: share },
          update: { balanceXOF: { increment: share } },
        });
        const hostWallet = await tx.wallet.findUnique({ where: { userId: stream.hostId } });
        await tx.transaction.create({
          data: { walletId: hostWallet!.id, type: 'GIFT_RECEIVED', label: `${gift.label} de ${sender.username}`, amountXOF: share, emoji: gift.emoji },
        });

        const saved = await tx.gift.create({
          data: { streamId, senderId: userId, emoji: gift.emoji, label: gift.label, coinsValue: gift.xofValue, xofValue: gift.xofValue },
        });

        return { giftRecord: saved, newBalance: senderWallet!.balanceXOF };
      });

      // Animation en direct pour toute la room (hôte inclus)
      broadcastToRoom(streamId, {
        type:   'gift',
        id:     result.giftRecord.id,
        gift:   { id: gift.id, emoji: gift.emoji, label: gift.label, xofValue: gift.xofValue },
        sender: sender,
        sentAt: result.giftRecord.sentAt,
      });

      return reply.send({ success: true, data: { gift: result.giftRecord, balanceXOF: result.newBalance } });
    } catch (err: any) {
      if (err?.message === 'INSUFFICIENT') {
        return reply.code(402).send({ success: false, error: 'Solde insuffisant. Recharge ton portefeuille.' });
      }
      req.log.error(err);
      return reply.code(500).send({ success: false, error: "Impossible d'envoyer le cadeau" });
    }
  });
}
