import { Hono } from 'hono';
import { resolveUserId } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

export const recoveryRoutes = new Hono();

recoveryRoutes.get('/latest', async (c) => {
  const userId = resolveUserId(c);

  const [snapshot, latestIntake] = await Promise.all([
    prisma.recoverySnapshot.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    }),
    prisma.intakeLog.findFirst({
      where: { userId, status: 'ANALYZED' },
      orderBy: { takenAt: 'desc' },
      include: {
        substance: { include: { profile: true, category: true } },
      },
    }),
  ]);

  const latestSubstance = latestIntake
    ? {
        name: latestIntake.substance.name,
        drugClass: latestIntake.substance.profile?.drugClass ?? null,
        categorySlug: latestIntake.substance.category.slug,
      }
    : null;

  if (!snapshot) {
    return c.json({
      score: 68,
      cognitivePct: 72,
      cardiovascularPct: 64,
      liverPct: 58,
      sleepPct: 70,
      estimatedRecoveryAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
      latestSubstance,
    });
  }

  return c.json({ ...snapshot, latestSubstance });
});

recoveryRoutes.get('/history', async (c) => {
  const userId = resolveUserId(c);
  const days = Number(c.req.query('days') ?? 7);

  const snapshots = await prisma.recoverySnapshot.findMany({
    where: {
      userId,
      recordedAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    },
    orderBy: { recordedAt: 'asc' },
  });

  return c.json(snapshots);
});

recoveryRoutes.post('/snapshot', async (c) => {
  const userId = resolveUserId(c);
  const body = await c.req.json();

  const snapshot = await prisma.recoverySnapshot.create({
    data: {
      userId,
      score: body.score,
      cognitivePct: body.cognitivePct,
      cardiovascularPct: body.cardiovascularPct,
      liverPct: body.liverPct,
      sleepPct: body.sleepPct,
      estimatedRecoveryAt: body.estimatedRecoveryAt
        ? new Date(body.estimatedRecoveryAt)
        : undefined,
    },
  });

  return c.json(snapshot, 201);
});
