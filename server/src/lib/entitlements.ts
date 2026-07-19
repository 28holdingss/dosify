import { HTTPException } from 'hono/http-exception';
import { prisma } from './prisma.js';

export type EntitlementSnapshot = {
  isPremium: boolean;
  source: 'user.isPremium';
};

export async function getEntitlement(userId: string): Promise<EntitlementSnapshot> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true },
  });
  return {
    isPremium: Boolean(user?.isPremium),
    source: 'user.isPremium',
  };
}

/** Server-side premium gate. Billing source of truth can replace isPremium later. */
export async function assertPremium(userId: string, feature: string): Promise<void> {
  const entitlement = await getEntitlement(userId);
  if (!entitlement.isPremium) {
    throw new HTTPException(402, {
      message: `Premium required for ${feature}`,
    });
  }
}
