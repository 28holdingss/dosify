import { Hono } from 'hono';
import { z } from 'zod';
import { resolveUserId } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { applyWearableToRecovery } from '../lib/wearable-sync.js';

export const wearableRoutes = new Hono();

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
  const todaySteps = await prisma.wearableSnapshot.findMany({
    where: { userId, recordedAt: { gte: dayAgo } },
    orderBy: { recordedAt: 'desc' },
    take: 1,
  });

  return c.json({
    lastSyncAt: latest?.recordedAt.toISOString() ?? null,
    latest,
    syncedToday: latest != null && latest.recordedAt >= dayAgo,
    todaySnapshot: todaySteps[0] ?? latest,
  });
});

wearableRoutes.get('/history', async (c) => {
  const userId = resolveUserId(c);
  const days = Number(c.req.query('days') ?? 7);

  const snapshots = await prisma.wearableSnapshot.findMany({
    where: {
      userId,
      recordedAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    },
    orderBy: { recordedAt: 'desc' },
    take: 50,
  });

  return c.json(snapshots);
});

wearableRoutes.post('/sync', async (c) => {
  const userId = resolveUserId(c);
  const body = syncSchema.parse(await c.req.json());

  const snapshot = await prisma.wearableSnapshot.create({
    data: {
      userId,
      source: body.source ?? 'HEALTHKIT',
      heartRateAvg: body.heartRateAvg ?? null,
      restingHeartRate: body.restingHeartRate ?? null,
      steps: body.steps ?? null,
      sleepHours: body.sleepHours ?? null,
      activeEnergyKcal: body.activeEnergyKcal ?? null,
      recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date(),
    },
  });

  const recovery = await applyWearableToRecovery(userId, body, prisma);

  return c.json({
    snapshot,
    recoveryUpdated: recovery != null,
    message: 'Watch data synced successfully',
  });
});
