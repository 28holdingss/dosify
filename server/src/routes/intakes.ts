import { Hono } from 'hono';
import { z } from 'zod';
import { resolveUserId } from '../lib/auth.js';
import { runIntakeAnalysis, persistAnalysis } from '../lib/analysis-engine/index.js';
import {
  assessDose,
  doseAssessmentLabel,
  estimatePeakWindow,
  parseJsonStringArray,
  riskLevelLabel,
  scoreToRiskLevel,
} from '../lib/reports.js';
import { prisma } from '../lib/prisma.js';

export const intakeRoutes = new Hono();

const createIntakeSchema = z.object({
  substanceId: z.string(),
  dose: z.number().positive(),
  unit: z.string().min(1),
  takenAt: z.string().datetime(),
  method: z.enum(['ORAL', 'TOPICAL', 'INJECTION', 'INHALATION', 'OTHER']).optional(),
  purpose: z.string().optional(),
  status: z.enum(['DRAFT', 'LOGGED', 'ANALYZED']).optional(),
});

intakeRoutes.get('/', async (c) => {
  const userId = resolveUserId(c);
  const limit = Number(c.req.query('limit') ?? 20);

  const intakes = await prisma.intakeLog.findMany({
    where: { userId },
    include: { substance: true, analysis: true },
    orderBy: { takenAt: 'desc' },
    take: limit,
  });

  return c.json(intakes);
});

intakeRoutes.get('/calendar', async (c) => {
  const userId = resolveUserId(c);
  const month = c.req.query('month');

  const start = month
    ? new Date(`${month}-01T00:00:00.000Z`)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);

  const intakes = await prisma.intakeLog.findMany({
    where: { userId, takenAt: { gte: start, lte: end } },
    include: { substance: { include: { category: true } }, analysis: true },
    orderBy: { takenAt: 'asc' },
  });

  return c.json(intakes);
});

intakeRoutes.post('/', async (c) => {
  const userId = resolveUserId(c);
  const body = createIntakeSchema.parse(await c.req.json());

  const intake = await prisma.intakeLog.create({
    data: {
      userId,
      substanceId: body.substanceId,
      dose: body.dose,
      unit: body.unit,
      takenAt: new Date(body.takenAt),
      method: body.method ?? 'ORAL',
      purpose: body.purpose,
      status: body.status ?? 'LOGGED',
    },
    include: { substance: true },
  });

  return c.json(intake, 201);
});

intakeRoutes.post('/:id/analyze', async (c) => {
  const userId = resolveUserId(c);
  const intakeId = c.req.param('id');

  try {
    const result = await runIntakeAnalysis(userId, intakeId);
    const analysis = await persistAnalysis(userId, intakeId, result);

    return c.json({
      ...analysis,
      recommendations: result.recommendations,
      warnings: result.warnings,
      detectedInteractions: result.detectedInteractions,
      riskLevel: scoreToRiskLevel(result.overallScore),
      riskLabel: riskLevelLabel(scoreToRiskLevel(result.overallScore)),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Analysis failed';
    if (message === 'Intake not found') {
      return c.json({ error: message }, 404);
    }
    console.error('Analysis error:', e);
    return c.json({ error: message }, 500);
  }
});

intakeRoutes.get('/:id/report', async (c) => {
  const userId = resolveUserId(c);
  const intakeId = c.req.param('id');

  const intake = await prisma.intakeLog.findFirst({
    where: { id: intakeId, userId },
    include: {
      substance: { include: { category: true } },
      analysis: true,
    },
  });

  if (!intake) return c.json({ error: 'Intake not found' }, 404);
  if (!intake.analysis) return c.json({ error: 'No analysis for this intake' }, 404);

  const [interactions, recentIntakes] = await Promise.all([
    prisma.interaction.findMany({
      where: {
        userId,
        snoozedUntil: null,
        OR: [{ substanceAId: intake.substanceId }, { substanceBId: intake.substanceId }],
      },
      include: { substanceA: true, substanceB: true },
      orderBy: { detectedAt: 'desc' },
    }),
    prisma.intakeLog.findMany({
      where: {
        userId,
        takenAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
      include: { substance: true },
      orderBy: { takenAt: 'desc' },
    }),
  ]);

  const analysis = intake.analysis;
  const doseLevel = assessDose(intake.dose, intake.substance.minDose, intake.substance.maxDose);
  const peak = estimatePeakWindow(analysis.durationMinHours, analysis.durationMaxHours);
  const riskLevel = scoreToRiskLevel(analysis.overallScore);

  const activeSubstances = [...new Map(
    recentIntakes.map((item) => [item.substance.id, item.substance.name])
  ).entries()].map(([id, name]) => ({ id, name }));

  return c.json({
    intake: {
      id: intake.id,
      dose: intake.dose,
      unit: intake.unit,
      takenAt: intake.takenAt.toISOString(),
      method: intake.method,
      purpose: intake.purpose,
      substance: intake.substance,
    },
    analysis: {
      ...analysis,
      recommendations: parseJsonStringArray(analysis.recommendations),
      warnings: parseJsonStringArray(analysis.warnings),
      riskLevel,
      riskLabel: riskLevelLabel(riskLevel),
      doseAssessment: doseLevel,
      doseAssessmentLabel: doseAssessmentLabel(doseLevel),
      peakWindow: peak,
    },
    interactions,
    activeSubstances,
    disclaimer: 'For informational purposes only. Not medical advice.',
  });
});

intakeRoutes.delete('/:id', async (c) => {
  const userId = resolveUserId(c);
  const id = c.req.param('id');

  const intake = await prisma.intakeLog.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!intake) return c.json({ error: 'Intake not found' }, 404);

  await prisma.intakeLog.delete({ where: { id } });
  return c.json({ ok: true });
});

intakeRoutes.get('/:id', async (c) => {
  const userId = resolveUserId(c);
  const intake = await prisma.intakeLog.findFirst({
    where: { id: c.req.param('id'), userId },
    include: { substance: { include: { category: true } }, analysis: true },
  });
  if (!intake) return c.json({ error: 'Intake not found' }, 404);

  const analysis = intake.analysis
    ? {
        ...intake.analysis,
        recommendations: parseJsonStringArray(intake.analysis.recommendations),
        warnings: parseJsonStringArray(intake.analysis.warnings),
        riskLevel: scoreToRiskLevel(intake.analysis.overallScore),
        riskLabel: riskLevelLabel(scoreToRiskLevel(intake.analysis.overallScore)),
      }
    : null;

  return c.json({ ...intake, analysis });
});
