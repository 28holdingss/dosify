import type Stripe from 'stripe';
import { prisma } from './prisma.js';
import { isPremiumSubscriptionStatus } from './stripe.js';

function customerIdOf(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
): string | null {
  if (!customer) return null;
  return typeof customer === 'string' ? customer : customer.id;
}

function periodEndFromSubscription(sub: Stripe.Subscription): Date | null {
  const end = sub.items?.data?.[0]?.current_period_end;
  return typeof end === 'number' ? new Date(end * 1000) : null;
}

async function findUserIdForSubscription(sub: Stripe.Subscription): Promise<string | null> {
  const metaUserId = sub.metadata?.userId;
  if (metaUserId) return metaUserId;

  const bySub = await prisma.user.findFirst({
    where: { stripeSubscriptionId: sub.id },
    select: { id: true },
  });
  if (bySub) return bySub.id;

  const customerId = customerIdOf(sub.customer);
  if (!customerId) return null;

  const byCustomer = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return byCustomer?.id ?? null;
}

export async function syncSubscriptionToUser(sub: Stripe.Subscription): Promise<void> {
  const userId = await findUserIdForSubscription(sub);
  if (!userId) {
    console.warn(`[billing] No user for subscription ${sub.id}`);
    return;
  }

  const priceId = sub.items.data[0]?.price?.id ?? null;
  const premium = isPremiumSubscriptionStatus(sub.status);
  const customerId = customerIdOf(sub.customer);

  await prisma.user.update({
    where: { id: userId },
    data: {
      isPremium: premium,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      stripeSubscriptionStatus: sub.status,
      premiumExpiresAt: periodEndFromSubscription(sub),
      ...(customerId ? { stripeCustomerId: customerId } : {}),
    },
  });
}

export async function clearSubscriptionForCustomer(customerId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      isPremium: false,
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeSubscriptionStatus: 'canceled',
      premiumExpiresAt: null,
    },
  });
}

export async function applyCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.client_reference_id ?? session.metadata?.userId ?? null;
  const customerId = customerIdOf(session.customer);
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

  if (!userId) {
    console.warn('[billing] checkout.session.completed missing user id');
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(customerId ? { stripeCustomerId: customerId } : {}),
      ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
      // Webhook subscription events will refine status; mark premium optimistically for Checkout.
      isPremium: true,
      stripeSubscriptionStatus: 'active',
    },
  });
}
