import type { Notification, NotificationType } from '@prisma/client';
import { prisma } from './prisma.js';

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Skip create if same user+type+title exists within this window (default 24h). */
  dedupeWindowHours?: number;
};

/** Create an inbox notification. */
export async function createNotification(
  input: Omit<CreateNotificationInput, 'dedupeWindowHours'>
): Promise<Notification> {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title.slice(0, 200),
      body: input.body.slice(0, 1000),
    },
  });
}

/** Create only if no matching notification was created recently (noise control). */
export async function notifyOnce(
  input: CreateNotificationInput
): Promise<Notification | null> {
  const hours = input.dedupeWindowHours ?? 24;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const existing = await prisma.notification.findFirst({
    where: {
      userId: input.userId,
      type: input.type,
      title: input.title.slice(0, 200),
      createdAt: { gte: since },
    },
  });
  if (existing) return null;

  return createNotification(input);
}

export async function notifyMissedDoses(
  userId: string,
  doses: Array<{ id: string; name: string }>
): Promise<void> {
  if (doses.length === 0) return;

  if (doses.length === 1) {
    await notifyOnce({
      userId,
      type: 'DOSE_MISSED',
      title: `Missed: ${doses[0].name}`,
      body: 'This dose was marked missed after the grace window. Open Today’s doses to review.',
      dedupeWindowHours: 12,
    });
    return;
  }

  const names = doses
    .slice(0, 3)
    .map((d) => d.name)
    .join(', ');
  const more = doses.length > 3 ? ` +${doses.length - 3} more` : '';
  await notifyOnce({
    userId,
    type: 'DOSE_MISSED',
    title: `${doses.length} doses missed`,
    body: `${names}${more}. Open Today’s doses to review adherence.`,
    dedupeWindowHours: 12,
  });
}

export async function notifyRefillAndStock(userId: string): Promise<void> {
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const items = await prisma.cabinetItem.findMany({
    where: { userId, active: true },
    include: { substance: { select: { name: true } } },
  });

  for (const item of items) {
    const name = item.displayName?.trim() || item.substance.name;

    if (item.refillDate && item.refillDate <= weekAhead) {
      const overdue = item.refillDate < now;
      await notifyOnce({
        userId,
        type: 'REFILL_DUE',
        title: overdue ? `Refill overdue: ${name}` : `Refill soon: ${name}`,
        body: overdue
          ? 'This medication’s refill date has passed. Check your cabinet and pharmacy.'
          : 'A refill is due within the next 7 days. Plan ahead so you don’t run out.',
        dedupeWindowHours: 48,
      });
    }

    if (item.quantity != null && item.quantity <= 5) {
      await notifyOnce({
        userId,
        type: 'LOW_STOCK',
        title: `Low stock: ${name}`,
        body: `Only ${item.quantity} left in your Health Cabinet. Consider refilling soon.`,
        dedupeWindowHours: 48,
      });
    }
  }
}

export async function maybeNotifyPerfectDay(userId: string): Promise<void> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const doses = await prisma.doseEvent.findMany({
    where: {
      userId,
      scheduledFor: { gte: start, lte: end },
      status: { not: 'SKIPPED' },
    },
    select: { status: true },
  });

  if (doses.length === 0) return;
  if (!doses.every((d) => d.status === 'TAKEN')) return;

  await notifyOnce({
    userId,
    type: 'GOAL_SUCCESS',
    title: 'All doses taken today',
    body: `Nice work — ${doses.length} of ${doses.length} doses logged as taken.`,
    dedupeWindowHours: 20,
  });
}
