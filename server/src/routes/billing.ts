import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { resolveUserId } from '../lib/auth.js';
import {
  applyCheckoutCompleted,
  clearSubscriptionForCustomer,
  syncSubscriptionToUser,
} from '../lib/billing.js';
import { prisma } from '../lib/prisma.js';
import {
  appOriginForPlatform,
  getPriceIdForPeriod,
  getStripe,
  isPremiumSubscriptionStatus,
  isStripeConfigured,
  periodFromPriceId,
  type BillingPeriod,
} from '../lib/stripe.js';

export const billingRoutes = new Hono();

const checkoutSchema = z.object({
  period: z.enum(['monthly', 'yearly']),
  platform: z.enum(['web', 'native']).default('native'),
});

const confirmSchema = z.object({
  sessionId: z.string().min(1),
});

async function ensureStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });
  if (!user) throw new HTTPException(404, { message: 'User not found' });
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user.id },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

billingRoutes.get('/config', async (c) => {
  return c.json({
    configured: isStripeConfigured(),
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? null,
    prices: {
      monthly: process.env.STRIPE_PRICE_MONTHLY ?? null,
      yearly: process.env.STRIPE_PRICE_YEARLY ?? null,
    },
  });
});

billingRoutes.get('/status', async (c) => {
  const userId = resolveUserId(c);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isPremium: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripePriceId: true,
      stripeSubscriptionStatus: true,
      premiumExpiresAt: true,
    },
  });
  if (!user) return c.json({ error: 'User not found' }, 404);

  return c.json({
    isPremium: user.isPremium,
    status: user.stripeSubscriptionStatus,
    priceId: user.stripePriceId,
    period: periodFromPriceId(user.stripePriceId),
    expiresAt: user.premiumExpiresAt,
    hasCustomer: Boolean(user.stripeCustomerId),
    configured: isStripeConfigured(),
  });
});

billingRoutes.post('/checkout-session', async (c) => {
  if (!isStripeConfigured()) {
    throw new HTTPException(503, { message: 'Stripe billing is not configured yet' });
  }

  const userId = resolveUserId(c);
  const body = checkoutSchema.parse(await c.req.json());
  const period = body.period as BillingPeriod;
  const priceId = getPriceIdForPeriod(period);
  const customerId = await ensureStripeCustomer(userId);
  const origin = appOriginForPlatform(body.platform);
  const stripe = getStripe();

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true, stripeSubscriptionStatus: true },
  });
  if (existing && isPremiumSubscriptionStatus(existing.stripeSubscriptionStatus)) {
    throw new HTTPException(409, {
      message: 'You already have an active Dosify Pro subscription. Manage it from the billing portal.',
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url:
      body.platform === 'native'
        ? `${origin}pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`
        : `${origin}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:
      body.platform === 'native'
        ? `${origin}pricing?checkout=cancel`
        : `${origin}/pricing?checkout=cancel`,
    metadata: { userId, period },
    subscription_data: {
      metadata: { userId, period },
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    throw new HTTPException(500, { message: 'Stripe did not return a checkout URL' });
  }

  return c.json({ url: session.url, sessionId: session.id });
});

billingRoutes.post('/portal-session', async (c) => {
  if (!isStripeConfigured()) {
    throw new HTTPException(503, { message: 'Stripe billing is not configured yet' });
  }

  const userId = resolveUserId(c);
  const body = z
    .object({ platform: z.enum(['web', 'native']).default('native') })
    .parse((await c.req.json().catch(() => ({}))) ?? {});

  const customerId = await ensureStripeCustomer(userId);
  const origin = appOriginForPlatform(body.platform);
  const stripe = getStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url:
      body.platform === 'native' ? `${origin}pricing` : `${origin}/pricing`,
  });

  return c.json({ url: session.url });
});

/** Confirm checkout immediately if the webhook is delayed. */
billingRoutes.post('/confirm-session', async (c) => {
  if (!isStripeConfigured()) {
    throw new HTTPException(503, { message: 'Stripe billing is not configured yet' });
  }

  const userId = resolveUserId(c);
  const { sessionId } = confirmSchema.parse(await c.req.json());
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });

  const sessionUserId = session.client_reference_id ?? session.metadata?.userId;
  if (sessionUserId !== userId) {
    throw new HTTPException(403, { message: 'Checkout session does not belong to this user' });
  }

  if (session.status !== 'complete') {
    return c.json({ ok: false, status: session.status, isPremium: false });
  }

  await applyCheckoutCompleted(session);

  if (session.subscription && typeof session.subscription !== 'string') {
    await syncSubscriptionToUser(session.subscription);
  } else if (typeof session.subscription === 'string') {
    const sub = await stripe.subscriptions.retrieve(session.subscription);
    await syncSubscriptionToUser(sub);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true, stripeSubscriptionStatus: true },
  });

  return c.json({
    ok: true,
    isPremium: Boolean(user?.isPremium),
    status: user?.stripeSubscriptionStatus ?? null,
  });
});

billingRoutes.post('/webhook', async (c) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new HTTPException(503, { message: 'Stripe webhook secret is not configured' });
  }

  const signature = c.req.header('stripe-signature');
  if (!signature) {
    throw new HTTPException(400, { message: 'Missing stripe-signature header' });
  }

  const rawBody = await c.req.text();
  const stripe = getStripe();

  let event: import('stripe').Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    console.error('[billing] webhook signature failed:', message);
    throw new HTTPException(400, { message: `Webhook Error: ${message}` });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      await applyCheckoutCompleted(event.data.object);
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      await syncSubscriptionToUser(event.data.object);
      break;
    }
    case 'customer.subscription.deleted': {
      await syncSubscriptionToUser(event.data.object);
      break;
    }
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subRef = invoice.parent?.subscription_details?.subscription;
      const subId = typeof subRef === 'string' ? subRef : subRef?.id;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncSubscriptionToUser(sub);
      }
      break;
    }
    case 'customer.deleted': {
      const customer = event.data.object;
      await clearSubscriptionForCustomer(customer.id);
      break;
    }
    default:
      break;
  }

  return c.json({ received: true });
});
