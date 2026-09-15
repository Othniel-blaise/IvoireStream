import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/authenticate';

// Types côté mobile (minuscules) ← enum Prisma
const TX_TYPE: Record<string, string> = {
  GIFT_RECEIVED: 'gift_received',
  PRIVATE_LIVE:  'private_live',
  WITHDRAWAL:    'withdrawal',
  DEPOSIT:       'deposit',
};

function monthStart(offset = 0): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + offset, 1);
}

export default async function walletRoutes(app: FastifyInstance) {

  // ── GET /api/wallet — Solde, stats et 30 dernières transactions ──────
  app.get('/', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user as { userId: string };

    // Le wallet est créé à l'inscription ; upsert par sécurité pour les anciens comptes
    const wallet = await prisma.wallet.upsert({
      where:  { userId },
      create: { userId },
      update: {},
      include: {
        transactions: { orderBy: { date: 'desc' }, take: 30 },
      },
    });

    // Tendance : revenus (crédits) du mois en cours vs mois précédent
    const [thisMonth, lastMonth] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amountXOF: true },
        where: { walletId: wallet.id, amountXOF: { gt: 0 }, date: { gte: monthStart(0) } },
      }),
      prisma.transaction.aggregate({
        _sum: { amountXOF: true },
        where: { walletId: wallet.id, amountXOF: { gt: 0 }, date: { gte: monthStart(-1), lt: monthStart(0) } },
      }),
    ]);
    const cur  = thisMonth._sum.amountXOF ?? 0;
    const prev = lastMonth._sum.amountXOF ?? 0;
    const trendPercent = prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

    return reply.send({
      success: true,
      data: {
        wallet: {
          balanceXOF:        wallet.balanceXOF,
          trendPercent,
          livesCount:        wallet.livesCount,
          privateLivesCount: wallet.privateLivesCount,
          totalViewers:      wallet.totalViewers,
          transactions: wallet.transactions.map(t => ({
            id:        t.id,
            type:      TX_TYPE[t.type] ?? 'deposit',
            label:     t.label,
            amountXOF: t.amountXOF,
            emoji:     t.emoji,
            date:      t.date,
          })),
        },
      },
    });
  });
}
