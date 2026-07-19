import { Hono } from 'hono';
import { z } from 'zod';
import {
  checkSubstanceInteractions,
} from '../lib/analysis-engine/index.js';
import {
  highestRiskLevel,
  interactionRiskScore,
} from '../lib/analysis-engine/interactions.js';
import { ENGINE_VERSION } from '../lib/analysis-engine/types.js';
import { writeAudit } from '../lib/audit.js';
import { resolveUserId } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

export const interactionCheckRoutes = new Hono();

const DISCLAIMER =
  'Informational only — not medical advice. Absence of findings does not mean an absence of risk. No combination is labeled safe; consult a healthcare professional for personal guidance.';

const createSchema = z
  .object({
    substanceId: z.string().min(1).optional(),
    substanceIds: z.array(z.string().min(1)).max(20).optional(),
    freeText: z.string().max(500).optional(),
    includeCabinet: z.boolean().optional(),
    includeRecentIntakes: z.boolean().optional(),
  })
  .refine(
    (body) =>
      Boolean(body.substanceId) ||
      Boolean(body.substanceIds?.length) ||
      Boolean(body.freeText?.trim()),
    { message: 'Provide substanceId, substanceIds, or freeText' }
  );

function serializeCheck(
  check: {
    id: string;
    createdAt: Date;
    riskScore: number | null;
    highestRisk: 'LOW' | 'MODERATE' | 'HIGH' | null;
    disclaimer: string;
    contextSnapshot: unknown;
    items: Array<{
      substanceId: string | null;
      substanceName: string;
      role: string;
    }>;
    findings: Array<{
      riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
      title: string;
      description: string;
      advice: string | null;
      source: string | null;
      sortOrder: number;
    }>;
  }
) {
  const snapshot =
    check.contextSnapshot && typeof check.contextSnapshot === 'object'
      ? (check.contextSnapshot as Record<string, unknown>)
      : {};

  return {
    id: check.id,
    createdAt: check.createdAt.toISOString(),
    proposed: check.items
      .filter((i) => i.role === 'PROPOSED')
      .map((i) => ({
        id: i.substanceId ?? i.substanceName,
        name: i.substanceName,
      })),
    context: {
      cabinetCount: Number(snapshot.cabinetCount ?? 0),
      recentIntakeCount: Number(snapshot.recentIntakeCount ?? 0),
      allergies: (snapshot.allergies as string | null | undefined) ?? null,
      conditions: (snapshot.conditions as string | null | undefined) ?? null,
    },
    findings: [...check.findings]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((f) => ({
        riskLevel: f.riskLevel,
        title: f.title,
        description: f.description,
        advice: f.advice,
        source: f.source,
      })),
    riskScore: check.riskScore,
    highestRisk: check.highestRisk,
    disclaimer: check.disclaimer,
  };
}

interactionCheckRoutes.get('/', async (c) => {
  const userId = resolveUserId(c);
  const checks = await prisma.interactionCheck.findMany({
    where: { userId },
    include: {
      items: true,
      findings: { orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 25,
  });
  return c.json(checks.map(serializeCheck));
});

interactionCheckRoutes.get('/:id', async (c) => {
  const userId = resolveUserId(c);
  const check = await prisma.interactionCheck.findFirst({
    where: { id: c.req.param('id'), userId },
    include: {
      items: true,
      findings: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!check) return c.json({ error: 'Interaction check not found' }, 404);
  return c.json(serializeCheck(check));
});

interactionCheckRoutes.post('/', async (c) => {
  const userId = resolveUserId(c);
  const parsed = createSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Invalid request body', details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;
  const includeCabinet = body.includeCabinet ?? true;
  const includeRecentIntakes = body.includeRecentIntakes ?? true;

  const proposedIds = [
    ...new Set(
      [
        ...(body.substanceId ? [body.substanceId] : []),
        ...(body.substanceIds ?? []),
      ].filter(Boolean)
    ),
  ].slice(0, 20);

  const proposedSubstances = proposedIds.length
    ? await prisma.substance.findMany({
        where: { id: { in: proposedIds } },
        select: { id: true, name: true },
      })
    : [];

  if (proposedIds.length && proposedSubstances.length !== proposedIds.length) {
    return c.json({ error: 'One or more proposed substances were not found' }, 404);
  }

  const [healthProfile, allergyRows, conditionRows, cabinetItems, recentIntakes] =
    await Promise.all([
      prisma.healthProfile.findUnique({ where: { userId } }),
      prisma.allergy.findMany({ where: { userId }, take: 50 }),
      prisma.condition.findMany({
        where: { userId, status: 'ACTIVE' },
        take: 50,
      }),
      includeCabinet
        ? prisma.cabinetItem.findMany({
            where: { userId, active: true },
            include: { substance: { select: { id: true, name: true } } },
            take: 100,
          })
        : Promise.resolve([]),
      includeRecentIntakes
        ? prisma.intakeLog.findMany({
            where: {
              userId,
              takenAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
            },
            include: { substance: { select: { id: true, name: true } } },
            orderBy: { takenAt: 'desc' },
            take: 50,
          })
        : Promise.resolve([]),
    ]);

  const allergies =
    allergyRows.map((a) => a.allergen).join(', ') ||
    healthProfile?.allergies ||
    null;
  const conditions =
    conditionRows.map((row) => row.name).join(', ') ||
    healthProfile?.medicalConditions ||
    null;

  const contextIds = new Set<string>();
  for (const item of cabinetItems) contextIds.add(item.substanceId);
  for (const intake of recentIntakes) contextIds.add(intake.substanceId);
  for (const s of proposedSubstances) contextIds.add(s.id);

  const allIds = [...contextIds];
  const detected =
    allIds.length >= 2 ? await checkSubstanceInteractions(allIds) : [];

  // Keep findings that involve at least one proposed substance when proposed
  // substances exist; otherwise return all pairwise findings from context.
  const proposedIdSet = new Set(proposedSubstances.map((s) => s.id));
  const relevant =
    proposedIdSet.size > 0
      ? detected.filter(
          (d) =>
            proposedIdSet.has(d.substanceAId) || proposedIdSet.has(d.substanceBId)
        )
      : detected;

  const riskScore = interactionRiskScore(relevant);
  const highestRisk = highestRiskLevel(relevant);

  const check = await prisma.interactionCheck.create({
    data: {
      userId,
      freeText: body.freeText?.trim() || null,
      includeCabinet,
      includeRecentIntakes,
      contextSnapshot: {
        cabinetCount: cabinetItems.length,
        recentIntakeCount: recentIntakes.length,
        allergies,
        conditions,
        proposedIds: proposedSubstances.map((s) => s.id),
        contextSubstanceIds: allIds,
      },
      riskScore: relevant.length ? riskScore : null,
      highestRisk,
      disclaimer: DISCLAIMER,
      aiRephrased: false,
      engineVersion: ENGINE_VERSION,
      items: {
        create: [
          ...proposedSubstances.map((s) => ({
            substanceId: s.id,
            substanceName: s.name,
            role: 'PROPOSED' as const,
          })),
          ...cabinetItems.map((item) => ({
            substanceId: item.substanceId,
            substanceName: item.displayName ?? item.substance.name,
            role: 'CABINET' as const,
          })),
          ...[...new Map(recentIntakes.map((i) => [i.substanceId, i])).values()].map(
            (intake) => ({
              substanceId: intake.substanceId,
              substanceName: intake.substance.name,
              role: 'RECENT_INTAKE' as const,
            })
          ),
        ],
      },
      findings: {
        create: relevant.map((f, index) => ({
          substanceAId: f.substanceAId,
          substanceBId: f.substanceBId,
          riskLevel: f.riskLevel,
          title: f.title,
          description: f.description,
          advice: f.advice ?? null,
          source: f.source ?? null,
          sortOrder: index,
        })),
      },
    },
    include: {
      items: true,
      findings: { orderBy: { sortOrder: 'asc' } },
    },
  });

  await writeAudit(userId, 'interaction_check.created', 'InteractionCheck', check.id, {
    proposedCount: proposedSubstances.length,
    findingCount: relevant.length,
    highestRisk,
  });

  return c.json(serializeCheck(check), 201);
});
