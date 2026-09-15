import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/authenticate';
import { startCheckout, hasStreamAccess, PROVIDER, PLATFORM_FEE_PERCENT } from '../services/payments';

const streamAccessSchema = z.object({ streamId: z.string().min(1) });
const depositSchema      = z.object({ amountXOF: z.number().int().min(500).max(1_000_000) });

export default async function paymentsRoutes(app: FastifyInstance) {

  // ── GET /api/payments/config — Fournisseur actif + commission ───────
  app.get('/config', async () => ({
    success: true,
    data: { provider: PROVIDER, platformFeePercent: PLATFORM_FEE_PERCENT, simulated: PROVIDER === 'mock' },
  }));

  // ── POST /api/payments/stream-access — Payer l'accès à un live privé ─
  app.post('/stream-access', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user as { userId: string };
    const parsed = streamAccessSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ success: false, error: 'streamId requis' });

    const stream = await prisma.liveStream.findUnique({ where: { id: parsed.data.streamId } });
    if (!stream || !stream.isLive)       return reply.code(404).send({ success: false, error: 'Live introuvable ou terminé' });
    if (stream.visibility !== 'PRIVATE') return reply.code(400).send({ success: false, error: 'Ce live est public' });
    if (stream.hostId === userId)        return reply.code(400).send({ success: false, error: "Tu es l'hôte de ce live" });
    if (await hasStreamAccess(userId, stream.id)) {
      return reply.send({ success: true, data: { status: 'COMPLETED', alreadyPaid: true } });
    }

    try {
      const result = await startCheckout({
        userId, streamId: stream.id, amountXOF: stream.priceXOF ?? 0, type: 'STREAM_ACCESS',
      });
      return reply.send({ success: true, data: result });
    } catch (err) {
      req.log.error(err);
      return reply.code(503).send({ success: false, error: 'Paiement indisponible pour le moment' });
    }
  });

  // ── POST /api/payments/deposit — Recharger son solde (pour les cadeaux) ─
  app.post('/deposit', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user as { userId: string };
    const parsed = depositSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ success: false, error: 'Montant invalide (500 à 1 000 000 FCFA)' });

    try {
      const result = await startCheckout({ userId, amountXOF: parsed.data.amountXOF, type: 'DEPOSIT' });
      return reply.send({ success: true, data: result });
    } catch (err) {
      req.log.error(err);
      return reply.code(503).send({ success: false, error: 'Paiement indisponible pour le moment' });
    }
  });

  // ── GET /api/payments/:id — Statut d'un paiement (polling après checkout) ─
  app.get('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user as { userId: string };
    const { id }     = req.params as { id: string };
    const payment = await prisma.payment.findFirst({
      where: { id, userId }, select: { id: true, status: true, amountXOF: true, type: true, streamId: true },
    });
    if (!payment) return reply.code(404).send({ success: false, error: 'Paiement introuvable' });
    return reply.send({ success: true, data: { payment } });
  });

  // ── POST /api/payments/webhook/:provider — Callback du fournisseur ──
  // À implémenter lors du branchement CinetPay / Wave : vérifier la signature,
  // retrouver le paiement via providerRef ou metadata, puis completePayment(id).
  app.post('/webhook/:provider', { config: { rateLimit: false } }, async (req, reply) => {
    const { provider } = req.params as { provider: string };
    req.log.warn({ provider, body: req.body }, 'Webhook reçu mais aucun adaptateur configuré');
    return reply.code(501).send({ success: false, error: `Webhook ${provider} non implémenté` });
  });
}
