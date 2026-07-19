import { Hono } from 'hono';
import { resolveUserId } from '../lib/auth.js';
import {
  isValidTimezone,
  markMissedDoseEvents,
  materializeDoseEvents,
  zonedTimeToUtc,
} from '../lib/dosing.js';
import { prisma } from '../lib/prisma.js';

export const dailySnapshotRoutes = new Hono();

const DAY_MS = 24 * 60 * 60 * 1000;
const REFILL_LOOKAHEAD_DAYS = 7;

function nextLocalDay(year: number, month: number, day: number): [number, number, number] {
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return [next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()];
}

dailySnapshotRoutes.get('/', async (c) => {
  const userId = resolveUserId(c);
  const now = new Date();

  const timezoneParam = c.req.query('timezone');
  if (timezoneParam && !isValidTimezone(timezoneParam)) {
    return c.json({ error: 'Invalid IANA timezone' }, 400);
  }
  const timezone = timezoneParam ?? 'UTC';

  const dateParam = c.req.query('date');
  let year: number;
  let month: number;
  let day: number;
  if (dateParam) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateParam);
    if (!match) return c.json({ error: 'date must be YYYY-MM-DD' }, 400);
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  } else {
    const dtf = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const [y, m, d] = dtf.format(now).split('-').map(Number);
    year = y;
    month = m;
    day = d;
  }

  const dayStart = zonedTimeToUtc(year, month, day, 0, 0, timezone);
  const [ny, nm, nd] = nextLocalDay(year, month, day);
  const dayEnd = zonedTimeToUtc(ny, nm, nd, 0, 0, timezone);

  await materializeDoseEvents(userId, dayStart, dayEnd);
  await markMissedDoseEvents(userId, now);

  const [statusCounts, upcomingDoses, refillsDue, latestWearable, activeInteractionCount] =
    await Promise.all([
      prisma.doseEvent.groupBy({
        by: ['status'],
        where: { userId, scheduledFor: { gte: dayStart, lt: dayEnd } },
        _count: { _all: true },
      }),
      prisma.doseEvent.findMany({
        where: {
          userId,
          status: { in: ['DUE', 'SNOOZED'] },
          scheduledFor: { gte: now, lt: dayEnd },
        },
        include: { cabinetItem: { include: { substance: true } }, schedule: true },
        orderBy: { scheduledFor: 'asc' },
        take: 10,
      }),
      prisma.cabinetItem.findMany({
        where: {
          userId,
          active: true,
          refillDate: { lte: new Date(now.getTime() + REFILL_LOOKAHEAD_DAYS * DAY_MS) },
        },
        include: { substance: true },
        orderBy: { refillDate: 'asc' },
        take: 25,
      }),
      prisma.wearableSnapshot.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
      }),
      prisma.interaction.count({
        where: {
          userId,
          OR: [{ snoozedUntil: null }, { snoozedUntil: { lt: now } }],
        },
      }),
    ]);

  const counts = { due: 0, taken: 0, skipped: 0, snoozed: 0, missed: 0, total: 0 };
  for (const row of statusCounts) {
    const n = row._count._all;
    counts.total += n;
    switch (row.status) {
      case 'DUE':
        counts.due += n;
        break;
      case 'TAKEN':
        counts.taken += n;
        break;
      case 'SKIPPED':
        counts.skipped += n;
        break;
      case 'SNOOZED':
        counts.snoozed += n;
        break;
      case 'MISSED':
        counts.missed += n;
        break;
    }
  }

  return c.json({
    date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    timezone,
    generatedAt: now.toISOString(),
    doses: {
      counts,
      upcoming: upcomingDoses,
    },
    refillsDueSoon: refillsDue.map((item) => ({
      id: item.id,
      displayName: item.displayName ?? item.substance.name,
      refillDate: item.refillDate,
      quantity: item.quantity,
      overdue: item.refillDate !== null && item.refillDate < now,
    })),
    latestWearableSnapshot: latestWearable,
    activeInteractionCount,
    disclaimer:
      'This summary is informational only and not medical advice. The absence of alerts does not mean an absence of risk.',
  });
});
