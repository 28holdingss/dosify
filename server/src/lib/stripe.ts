import Stripe from 'stripe';
import { HTTPException } from 'hono/http-exception';

let stripeClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_MONTHLY &&
      process.env.STRIPE_PRICE_YEARLY
  );
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new HTTPException(503, { message: 'Stripe is not configured' });
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    });
  }
  return stripeClient;
}

export type BillingPeriod = 'monthly' | 'yearly';

export function getPriceIdForPeriod(period: BillingPeriod): string {
  const priceId =
    period === 'yearly' ? process.env.STRIPE_PRICE_YEARLY : process.env.STRIPE_PRICE_MONTHLY;
  if (!priceId) {
    throw new HTTPException(503, { message: `Stripe ${period} price is not configured` });
  }
  return priceId;
}

export function periodFromPriceId(priceId: string | null | undefined): BillingPeriod | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_YEARLY) return 'yearly';
  if (priceId === process.env.STRIPE_PRICE_MONTHLY) return 'monthly';
  return null;
}

/** Active or trialing subscriptions grant Pro access. */
export function isPremiumSubscriptionStatus(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing';
}

export function appOriginForPlatform(platform: 'web' | 'native'): string {
  if (platform === 'native') {
    return 'dosify://';
  }
  const web = (process.env.WEB_APP_URL ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .find(Boolean);
  return web || 'http://localhost:8081';
}
