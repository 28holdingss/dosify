import { Hono } from 'hono';
import { z } from 'zod';
import { resolveUserId } from '../lib/auth.js';
import {
  buildDashboardIndicators,
  highestRiskLevel,
  resolveHealthScore,
  scoreToRiskLevel,
} from '../lib/dashboard.js';
import { prisma } from '../lib/prisma.js';

export const userRoutes = new Hono();

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

const updateHealthProfileSchema = z.object({
  age: z.number().int().min(1).max(120).nullable().optional(),
  weightKg: z.number().min(1).max(500).nullable().optional(),
  heightCm: z.number().min(50).max(300).nullable().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).nullable().optional(),
  medicalConditions: z.string().max(500).nullable().optional(),
  allergies: z.string().max(500).nullable().optional(),
  emergencyInfo: z.string().max(1000).nullable().optional(),
});

const updateGoalsSchema = z.object({
  goals: z.array(z.string().min(1).max(100)).max(10),
});

async function getUserWithRelations(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { healthProfile: true, healthGoals: true },
  });
}

userRoutes.get('/me', async (c) => {
  const userId = resolveUserId(c);
  const user = await getUserWithRelations(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json(user);
});

userRoutes.patch('/me', async (c) => {
  const userId = resolveUserId(c);
  const body = updateUserSchema.parse(await c.req.json());

  const user = await prisma.user.update({
    where: { id: userId },
    data: { ...(body.name !== undefined ? { name: body.name } : {}) },
    include: { healthProfile: true, healthGoals: true },
  });

  return c.json(user);
});

userRoutes.post('/me/onboarding-complete', async (c) => {
  const userId = resolveUserId(c);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompleted: true },
    include: { healthProfile: true, healthGoals: true },
  });
  return c.json(user);
});

userRoutes.patch('/me/health-profile', async (c) => {
  const userId = resolveUserId(c);
  const body = updateHealthProfileSchema.parse(await c.req.json());

  const profile = await prisma.healthProfile.upsert({
    where: { userId },
    update: {
      ...(body.age !== undefined && { age: body.age }),
      ...(body.weightKg !== undefined && { weightKg: body.weightKg }),
      ...(body.heightCm !== undefined && { heightCm: body.heightCm }),
      ...(body.gender !== undefined && { gender: body.gender }),
      ...(body.medicalConditions !== undefined && { medicalConditions: body.medicalConditions }),
      ...(body.allergies !== undefined && { allergies: body.allergies }),
      ...(body.emergencyInfo !== undefined && { emergencyInfo: body.emergencyInfo }),
    },
    create: {
      userId,
      age: body.age ?? null,
      weightKg: body.weightKg ?? null,
      heightCm: body.heightCm ?? null,
      gender: body.gender ?? null,
      medicalConditions: body.medicalConditions ?? null,
      allergies: body.allergies ?? null,
      emergencyInfo: body.emergencyInfo ?? null,
    },
  });

  const user = await getUserWithRelations(userId);
  return c.json({ healthProfile: profile, user });
});

userRoutes.put('/me/health-goals', async (c) => {
  const userId = resolveUserId(c);
  const { goals } = updateGoalsSchema.parse(await c.req.json());

  await prisma.$transaction([
    prisma.healthGoal.deleteMany({ where: { userId } }),
    ...goals.map((goal) =>
      prisma.healthGoal.create({ data: { userId, goal } })
    ),
  ]);

  const user = await getUserWithRelations(userId);
  return c.json(user);
});

userRoutes.get('/dashboard', async (c) => {
  const userId = resolveUserId(c);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

  const [user, recentIntakes, interactions, latestRecovery, todayIntakes, unreadNotifications, alcoholIntakes] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      prisma.intakeLog.findMany({
        where: { userId },
        orderBy: { takenAt: 'desc' },
        take: 5,
        include: {
          substance: { include: { category: true } },
          analysis: true,
        },
      }),
      prisma.interaction.findMany({
        where: { userId, snoozedUntil: null },
        include: { substanceA: true, substanceB: true },
        orderBy: { detectedAt: 'desc' },
        take: 10,
      }),
      prisma.recoverySnapshot.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
      }),
      prisma.intakeLog.count({
        where: { userId, takenAt: { gte: todayStart } },
      }),
      prisma.notification.count({ where: { userId, read: false } }),
      prisma.intakeLog.findMany({
        where: {
          userId,
          takenAt: { gte: weekAgo },
          substance: { category: { slug: 'alcohol' } },
        },
        include: { substance: true },
      }),
    ]);

  const latestAnalysis = recentIntakes.find((i) => i.analysis)?.analysis;
  const healthScore = resolveHealthScore(latestAnalysis, latestRecovery);
  const indicators = buildDashboardIndicators(latestAnalysis, latestRecovery, alcoholIntakes);
  const interactionRiskLevel = highestRiskLevel(interactions.map((i) => i.riskLevel));

  return c.json({
    userName: user?.name ?? 'User',
    healthScore,
    riskLevel: scoreToRiskLevel(healthScore),
    indicators,
    interactionAlertCount: interactions.length,
    interactionRiskLevel,
    unreadNotificationCount: unreadNotifications,
    todayIntakeCount: todayIntakes,
    recovery: latestRecovery,
    recentIntakes,
    interactions,
  });
});
