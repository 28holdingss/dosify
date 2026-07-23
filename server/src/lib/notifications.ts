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

type SmartIntakeContext = {
  userId: string;
  intakeId: string;
  substanceId: string;
  substanceName: string;
  dose: number;
  unit: string;
  minDose?: number | null;
  maxDose?: number | null;
  /** Analysis overall load 0–100 when available. */
  overallScore?: number | null;
};

/**
 * Detect unusual dosing vs the user's own history / catalog norms and notify.
 * Covers: catalog-high dose, above personal average, frequent same-day logs,
 * and elevated analysis load.
 */
export async function maybeNotifySmartIntakeSignals(
  ctx: SmartIntakeContext
): Promise<void> {
  const name = ctx.substanceName.trim() || 'This medication';
  const unit = ctx.unit.trim() || 'dose';
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const historyStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [todaySame, historySame, substance] = await Promise.all([
    prisma.intakeLog.findMany({
      where: {
        userId: ctx.userId,
        substanceId: ctx.substanceId,
        takenAt: { gte: dayStart },
        id: { not: ctx.intakeId },
      },
      select: { dose: true, unit: true },
    }),
    prisma.intakeLog.findMany({
      where: {
        userId: ctx.userId,
        substanceId: ctx.substanceId,
        takenAt: { gte: historyStart, lt: dayStart },
        id: { not: ctx.intakeId },
        unit: { equals: unit, mode: 'insensitive' },
      },
      select: { dose: true, takenAt: true },
      take: 40,
    }),
    prisma.substance.findUnique({
      where: { id: ctx.substanceId },
      select: { minDose: true, maxDose: true },
    }),
  ]);

  const minDose = ctx.minDose ?? substance?.minDose ?? null;
  const maxDose = ctx.maxDose ?? substance?.maxDose ?? null;

  // 1) Catalog high dose
  const { assessDose } = await import('./reports.js');
  const doseLevel = assessDose(ctx.dose, minDose, maxDose);
  if (doseLevel === 'high') {
    await notifyOnce({
      userId: ctx.userId,
      type: 'DOSE_PATTERN',
      title: `High dose: ${name}`,
      body: `You logged ${ctx.dose} ${unit}, which is above the typical range for ${name}. Double-check the amount if this wasn’t intentional.`,
      dedupeWindowHours: 12,
    });
  }

  // 2) Above personal average (need enough history)
  if (historySame.length >= 3) {
    const avg =
      historySame.reduce((sum, row) => sum + row.dose, 0) / historySame.length;
    if (avg > 0 && ctx.dose >= avg * 1.5) {
      const pct = Math.round((ctx.dose / avg - 1) * 100);
      await notifyOnce({
        userId: ctx.userId,
        type: 'DOSE_PATTERN',
        title: `Above your usual: ${name}`,
        body: `This dose (${ctx.dose} ${unit}) is about ${pct}% higher than your 14-day average of ${avg.toFixed(1)} ${unit}.`,
        dedupeWindowHours: 12,
      });
    }
  }

  // 3) Frequent same-day logging / taking
  const todayCount = todaySame.length + 1; // include current
  const historyDays = new Map<string, number>();
  for (const row of historySame) {
    const key = row.takenAt.toISOString().slice(0, 10);
    historyDays.set(key, (historyDays.get(key) ?? 0) + 1);
  }
  const dailyCounts = [...historyDays.values()];
  const avgDaily =
    dailyCounts.length >= 3
      ? dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length
      : null;

  if (todayCount >= 4 || (avgDaily != null && todayCount >= Math.ceil(avgDaily * 1.75) && todayCount >= 3)) {
    await notifyOnce({
      userId: ctx.userId,
      type: 'DOSE_PATTERN',
      title: `Frequent dosing: ${name}`,
      body:
        avgDaily != null
          ? `You’ve logged ${name} ${todayCount} times today — above your usual (~${avgDaily.toFixed(1)}/day). Consider spacing doses if appropriate.`
          : `You’ve logged ${name} ${todayCount} times today. If that wasn’t planned, review your schedule and interactions.`,
      dedupeWindowHours: 8,
    });
  }

  // 4) Elevated analysis load
  if (ctx.overallScore != null && ctx.overallScore >= 70) {
    await notifyOnce({
      userId: ctx.userId,
      type: 'DOSE_PATTERN',
      title: `Elevated load: ${name}`,
      body: `Dosify scored this intake at ${Math.round(ctx.overallScore)}/100. Open Insights or Check interactions if you’re combining substances.`,
      dedupeWindowHours: 12,
    });
  } else if (ctx.overallScore != null && ctx.overallScore >= 55) {
    await notifyOnce({
      userId: ctx.userId,
      type: 'DOSE_PATTERN',
      title: `Moderate load: ${name}`,
      body: `This intake scored ${Math.round(ctx.overallScore)}/100. Keep an eye on how you feel and avoid stacking similar effects.`,
      dedupeWindowHours: 18,
    });
  }
}
