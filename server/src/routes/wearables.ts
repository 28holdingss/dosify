import { Hono } from 'hono';
import { z } from 'zod';
import { resolveUserId } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { applyWearableToRecovery } from '../lib/wearable-sync.js';

export const wearableRoutes = new Hono();

const SNAPSHOT_DEDUPE_MS = 45 * 60 * 1000;

const syncSchema = z.object({
  heartRateAvg: z.number().min(30).max(220).nullable().optional(),
  restingHeartRate: z.number().min(30).max(220).nullable().optional(),
  steps: z.number().int().min(0).nullable().optional(),
  sleepHours: z.number().min(0).max(24).nullable().optional(),
  activeEnergyKcal: z.number().min(0).nullable().optional(),
  source: z.string().max(32).optional(),
  recordedAt: z.string().datetime().optional(),
});

wearableRoutes.get('/status', async (c) => {
  const userId = resolveUserId(c);

  const latest = await prisma.wearableSnapshot.findFirst({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
  });

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return c.json({
    lastSyncAt: latest?.recordedAt.toISOString() ?? null,
    latest,
    syncedToday: latest != null && latest.recordedAt >= dayAgo,
    todaySnapshot: latest,
  });
});

wearableRoutes.get('/history', async (c) => {
  const userId = resolveUserId(c);
  const days = Math.min(30, Math.max(1, Number(c.req.query('days') ?? 7)));

  const snapshots = await prisma.wearableSnapshot.findMany({
    where: {
      userId,
      recordedAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    },
    orderBy: { recordedAt: 'desc' },
    take: 100,
  });

  // One row per calendar day (latest sync that day) for charts.
  const byDay = new Map<string, (typeof snapshots)[number]>();
  for (const snap of snapshots) {
    const key = snap.recordedAt.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, snap);
  }

  return c.json({
    snapshots,
    daily: [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, snap]) => snap),
  });
});

wearableRoutes.post('/sync', async (c) => {
  const userId = resolveUserId(c);
  const body = syncSchema.parse(await c.req.json());
  const recordedAt = body.recordedAt ? new Date(body.recordedAt) : new Date();

  const fields = {
    source: body.source ?? 'HEALTHKIT',
    heartRateAvg: body.heartRateAvg ?? null,
    restingHeartRate: body.restingHeartRate ?? null,
    steps: body.steps ?? null,
    sleepHours: body.sleepHours ?? null,
    activeEnergyKcal: body.activeEnergyKcal ?? null,
    recordedAt,
  };

  const recent = await prisma.wearableSnapshot.findFirst({
    where: {
      userId,
      recordedAt: { gte: new Date(Date.now() - SNAPSHOT_DEDUPE_MS) },
    },
    orderBy: { recordedAt: 'desc' },
  });

  const snapshot = recent
    ? await prisma.wearableSnapshot.update({
        where: { id: recent.id },
        data: fields,
      })
    : await prisma.wearableSnapshot.create({
        data: { userId, ...fields },
      });

  const recovery = await applyWearableToRecovery(userId, body, prisma);

  return c.json({
    snapshot,
    recoveryUpdated: recovery != null,
    deduped: recent != null,
    message: recent
      ? 'Watch data updated'
      : 'Watch data synced successfully',
  });
});
