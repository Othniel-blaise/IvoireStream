import { prisma } from '../lib/prisma';

// ─────────────────────────────────────────────────────────────────────────
//  Couche paiement indépendante du fournisseur.
//  PAYMENT_PROVIDER=mock (défaut) : les paiements sont validés immédiatement,
//  sans argent réel. Brancher CinetPay / Wave = ajouter un adaptateur ici et
//  un handler de webhook dans routes/payments.ts, sans toucher au reste.
// ─────────────────────────────────────────────────────────────────────────

export const PLATFORM_FEE_PERCENT = parseInt(process.env.PLATFORM_FEE_PERCENT ?? '15', 10);
export const PROVIDER = (process.env.PAYMENT_PROVIDER ?? 'mock').toLowerCase();

export interface CheckoutResult {
  paymentId:    string;
  status:       'PENDING' | 'COMPLETED';
  checkoutUrl?: string;   // URL à ouvrir (fournisseur réel) — absent en mode mock
}

/** Part reversée au créateur après commission plateforme. */
export function creatorShare(amountXOF: number): number {
  return Math.floor(amountXOF * (100 - PLATFORM_FEE_PERCENT) / 100);
}

/** Le viewer a-t-il déjà payé l'accès à ce live ? */
export async function hasStreamAccess(userId: string, streamId: string): Promise<boolean> {
  const p = await prisma.payment.findFirst({
    where: { userId, streamId, type: 'STREAM_ACCESS', status: 'COMPLETED' },
    select: { id: true },
  });
  return !!p;
}

/**
 * Valide un paiement (appelé par le webhook du fournisseur, ou immédiatement en mock).
 * Idempotent : un paiement déjà COMPLETED n'est pas recrédité.
 */
export async function completePayment(paymentId: string, providerRef?: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { stream: { select: { id: true, hostId: true, title: true, emoji: true } } },
    });
    if (!payment || payment.status === 'COMPLETED') return;

    await tx.payment.update({
      where: { id: paymentId },
      data:  { status: 'COMPLETED', ...(providerRef ? { providerRef } : {}) },
    });

    if (payment.type === 'STREAM_ACCESS' && payment.stream) {
      // Le créateur touche sa part, la plateforme garde la commission
      const share = creatorShare(payment.amountXOF);
      await tx.wallet.upsert({
        where:  { userId: payment.stream.hostId },
        create: { userId: payment.stream.hostId, balanceXOF: share },
        update: { balanceXOF: { increment: share } },
      });
      const wallet = await tx.wallet.findUnique({ where: { userId: payment.stream.hostId } });
      await tx.transaction.create({
        data: {
          walletId:  wallet!.id,
          type:      'PRIVATE_LIVE',
          label:     `Accès live privé · ${payment.stream.title}`,
          amountXOF: share,
          emoji:     '🔒',
        },
      });
    }

    if (payment.type === 'DEPOSIT') {
      await tx.wallet.upsert({
        where:  { userId: payment.userId },
        create: { userId: payment.userId, balanceXOF: payment.amountXOF },
        update: { balanceXOF: { increment: payment.amountXOF } },
      });
      const wallet = await tx.wallet.findUnique({ where: { userId: payment.userId } });
      await tx.transaction.create({
        data: {
          walletId:  wallet!.id,
          type:      'DEPOSIT',
          label:     'Rechargement',
          amountXOF: payment.amountXOF,
          emoji:     '💳',
        },
      });
    }
  });
}

/**
 * Crée un paiement et lance le checkout chez le fournisseur.
 * Mode mock : validé sur-le-champ.
 */
export async function startCheckout(opts: {
  userId: string; amountXOF: number; type: 'STREAM_ACCESS' | 'DEPOSIT'; streamId?: string;
}): Promise<CheckoutResult> {
  const payment = await prisma.payment.create({
    data: {
      userId:    opts.userId,
      streamId:  opts.streamId,
      amountXOF: opts.amountXOF,
      type:      opts.type,
      provider:  PROVIDER,
    },
  });

  switch (PROVIDER) {
    case 'mock':
      await completePayment(payment.id, `mock_${payment.id}`);
      return { paymentId: payment.id, status: 'COMPLETED' };

    // case 'cinetpay': → appeler l'API CinetPay, retourner { paymentId, status: 'PENDING', checkoutUrl }
    default:
      throw new Error(`Fournisseur de paiement non configuré : ${PROVIDER}`);
  }
}
