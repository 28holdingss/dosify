import type { IntakeLog, InteractionRule, Substance, SubstanceProfile } from '@prisma/client';
import { prisma } from '../prisma.js';
import { detectInteractions, interactionRiskScore } from './interactions.js';
import { explainAnalysis, buildAnalysisResult, ENGINE_VERSION } from './explainer.js';
import { filterInteractionsForPrimary } from './substance-recommendations.js';
import { estimateDuration, scoreSubstanceEffects } from './scoring.js';
import type { AnalysisResult, SubstanceContext } from './types.js';

type IntakeWithSubstance = IntakeLog & {
  substance: Substance & {
    profile: SubstanceProfile | null;
    category: { slug: string } | null;
  };
};

function toSubstanceContext(
  intake: IntakeWithSubstance
): SubstanceContext & { substanceId: string } {
  const p = intake.substance.profile;
  return {
    substanceId: intake.substanceId,
    id: intake.substance.id,
    name: intake.substance.name,
    dose: intake.dose,
    unit: intake.unit,
    minDose: intake.substance.minDose,
    maxDose: intake.substance.maxDose,
    drugClass: p?.drugClass ?? null,
    categorySlug: intake.substance.category?.slug ?? null,
    halfLifeHours: p?.halfLifeHours ?? null,
    cognitiveImpact: p?.cognitiveImpact ?? 0.3,
    cardiovascularImpact: p?.cardiovascularImpact ?? 0.2,
    gastrointestinalImpact: p?.gastrointestinalImpact ?? 0.2,
    liverImpact: p?.liverImpact ?? 0.1,
    typicalDurationMinHours: p?.typicalDurationMinHours ?? null,
    typicalDurationMaxHours: p?.typicalDurationMaxHours ?? null,
  };
}

function defaultProfile(substance: Substance & { category?: { slug: string } | null }): SubstanceContext {
  return {
    id: substance.id,
    name: substance.name,
    dose: 0,
    unit: substance.defaultUnit,
    minDose: substance.minDose,
    maxDose: substance.maxDose,
    drugClass: null,
    categorySlug: substance.category?.slug ?? null,
    halfLifeHours: 4,
    cognitiveImpact: 0.3,
    cardiovascularImpact: 0.2,
    gastrointestinalImpact: 0.2,
    liverImpact: 0.1,
    typicalDurationMinHours: 2,
    typicalDurationMaxHours: 6,
  };
}

export async function runIntakeAnalysis(
  userId: string,
  intakeId: string
): Promise<AnalysisResult> {
  const intake = await prisma.intakeLog.findFirst({
    where: { id: intakeId, userId },
    include: { substance: { include: { profile: true, category: true } } },
  });

  if (!intake) throw new Error('Intake not found');

  const [healthProfile, recentIntakes, rules, latestWearable] = await Promise.all([
    prisma.healthProfile.findUnique({ where: { userId } }),
    prisma.intakeLog.findMany({
      where: {
        userId,
        takenAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
      include: { substance: { include: { profile: true, category: true } } },
      orderBy: { takenAt: 'desc' },
    }),
    prisma.interactionRule.findMany(),
    prisma.wearableSnapshot.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    }),
  ]);

  const primary = toSubstanceContext(intake as IntakeWithSubstance);

  const activeMap = new Map<string, SubstanceContext & { substanceId: string }>();
  for (const item of recentIntakes) {
    if (!activeMap.has(item.substanceId)) {
      activeMap.set(item.substanceId, toSubstanceContext(item as IntakeWithSubstance));
    }
  }
  activeMap.set(primary.substanceId, primary);
  const active = [...activeMap.values()];

  const allDetected = detectInteractions(rules, active);
  const detected = filterInteractionsForPrimary(allDetected, primary.substanceId);
  const intRisk = interactionRiskScore(detected);

  const wearableFresh =
    latestWearable?.recordedAt != null &&
    Date.now() - latestWearable.recordedAt.getTime() < 36 * 60 * 60 * 1000;

  const wearable = wearableFresh
    ? {
        heartRateAvg: latestWearable.heartRateAvg,
        restingHeartRate: latestWearable.restingHeartRate,
        sleepHours: latestWearable.sleepHours,
        steps: latestWearable.steps,
        activeEnergyKcal: latestWearable.activeEnergyKcal,
      }
    : null;

  const scores = scoreSubstanceEffects(primary, intRisk, {
    allergies: healthProfile?.allergies ?? null,
    medicalConditions: healthProfile?.medicalConditions ?? null,
    age: healthProfile?.age ?? null,
    weightKg: healthProfile?.weightKg ?? null,
    wearable,
  });

  const duration = estimateDuration(primary);
  const wearableHints = scores.wearableHints.map((h) => h.message);

  const explanation = await explainAnalysis({
    primary,
    scores: { ...scores, interactionRiskScore: intRisk },
    duration,
    interactions: detected,
    purpose: intake.purpose,
    wearableHints,
  });

  return buildAnalysisResult(
    { ...scores, interactionRiskScore: intRisk },
    duration,
    explanation,
    detected
  );
}

export async function checkSubstanceInteractions(
  substanceIds: string[]
): Promise<AnalysisResult['detectedInteractions']> {
  const substances = await prisma.substance.findMany({
    where: { id: { in: substanceIds } },
    include: { profile: true, category: true },
  });

  const active = substances.map((s) => ({
    ...defaultProfile(s),
    substanceId: s.id,
    drugClass: s.profile?.drugClass ?? null,
    halfLifeHours: s.profile?.halfLifeHours ?? null,
    cognitiveImpact: s.profile?.cognitiveImpact ?? 0.3,
    cardiovascularImpact: s.profile?.cardiovascularImpact ?? 0.2,
    gastrointestinalImpact: s.profile?.gastrointestinalImpact ?? 0.2,
    liverImpact: s.profile?.liverImpact ?? 0.1,
    typicalDurationMinHours: s.profile?.typicalDurationMinHours ?? null,
    typicalDurationMaxHours: s.profile?.typicalDurationMaxHours ?? null,
  }));

  const rules = await prisma.interactionRule.findMany();
  return detectInteractions(rules, active);
}

export async function persistAnalysis(
  userId: string,
  intakeId: string,
  result: AnalysisResult
) {
  const analysis = await prisma.analysis.upsert({
    where: { intakeLogId: intakeId },
    update: {
      overallScore: result.overallScore,
      cognitiveScore: result.cognitiveScore,
      cardiovascularScore: result.cardiovascularScore,
      gastrointestinalScore: result.gastrointestinalScore,
      interactionRiskScore: result.interactionRiskScore,
      durationMinHours: result.durationMinHours,
      durationMaxHours: result.durationMaxHours,
      summary: result.summary,
      recommendations: result.recommendations,
      warnings: result.warnings,
      aiGenerated: result.aiGenerated,
      engineVersion: ENGINE_VERSION,
    },
    create: {
      intakeLogId: intakeId,
      overallScore: result.overallScore,
      cognitiveScore: result.cognitiveScore,
      cardiovascularScore: result.cardiovascularScore,
      gastrointestinalScore: result.gastrointestinalScore,
      interactionRiskScore: result.interactionRiskScore,
      durationMinHours: result.durationMinHours,
      durationMaxHours: result.durationMaxHours,
      summary: result.summary,
      recommendations: result.recommendations,
      warnings: result.warnings,
      aiGenerated: result.aiGenerated,
      engineVersion: ENGINE_VERSION,
    },
  });

  await prisma.intakeLog.update({
    where: { id: intakeId },
    data: { status: 'ANALYZED' },
  });

  for (const interaction of result.detectedInteractions) {
    const existing = await prisma.interaction.findFirst({
      where: {
        userId,
        OR: [
          { substanceAId: interaction.substanceAId, substanceBId: interaction.substanceBId },
          { substanceAId: interaction.substanceBId, substanceBId: interaction.substanceAId },
        ],
        snoozedUntil: null,
      },
    });

    if (!existing) {
      await prisma.interaction.create({
        data: {
          userId,
          substanceAId: interaction.substanceAId,
          substanceBId: interaction.substanceBId,
          riskLevel: interaction.riskLevel,
          title: interaction.title,
          description: interaction.description,
          advice: interaction.advice,
        },
      });

      if (interaction.riskLevel === 'HIGH' || interaction.riskLevel === 'MODERATE') {
        const { notifyOnce } = await import('../notifications.js');
        await notifyOnce({
          userId,
          type: 'INTERACTION_ALERT',
          title: `${interaction.riskLevel === 'HIGH' ? 'High' : 'Moderate'} interaction detected`,
          body: interaction.description,
          dedupeWindowHours: 12,
        });
      }
    }
  }

  // Smart pattern alerts: above-average dose, frequent logging, elevated load.
  try {
    const intake = await prisma.intakeLog.findFirst({
      where: { id: intakeId, userId },
      include: {
        substance: { select: { name: true, minDose: true, maxDose: true } },
      },
    });
    if (intake) {
      const { maybeNotifySmartIntakeSignals } = await import('../notifications.js');
      await maybeNotifySmartIntakeSignals({
        userId,
        intakeId: intake.id,
        substanceId: intake.substanceId,
        substanceName: intake.substance.name,
        dose: intake.dose,
        unit: intake.unit,
        minDose: intake.substance.minDose,
        maxDose: intake.substance.maxDose,
        overallScore: result.overallScore,
      });
    }
  } catch (err) {
    console.warn('[analysis] smart intake signals failed', err);
  }

  const recoveryScore = Math.max(0, 100 - result.overallScore);

  // Prefer real HealthKit/Watch sleep over inventing sleep from substance score.
  const [latestWearable, priorRecovery] = await Promise.all([
    prisma.wearableSnapshot.findFirst({
      where: { userId, sleepHours: { not: null } },
      orderBy: { recordedAt: 'desc' },
    }),
    prisma.recoverySnapshot.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    }),
  ]);

  const wearableFresh =
    latestWearable?.recordedAt != null &&
    Date.now() - latestWearable.recordedAt.getTime() < 36 * 60 * 60 * 1000;

  let sleepPct = Math.max(0, 100 - Math.round(result.overallScore * 0.8));
  if (wearableFresh && latestWearable?.sleepHours != null) {
    const { deriveSleepPct } = await import('../wearable-sync.js');
    sleepPct = deriveSleepPct(latestWearable.sleepHours) ?? sleepPct;
  } else if (priorRecovery?.sleepPct != null) {
    // Keep prior sleep when analysis has no wearable truth — avoid stomping watch data.
    sleepPct = priorRecovery.sleepPct;
  }

  await prisma.recoverySnapshot.create({
    data: {
      userId,
      score: recoveryScore,
      cognitivePct: Math.max(0, 100 - result.cognitiveScore),
      cardiovascularPct: Math.max(0, 100 - result.cardiovascularScore),
      liverPct: Math.max(0, 100 - result.gastrointestinalScore),
      sleepPct,
      estimatedRecoveryAt: new Date(
        Date.now() + result.durationMaxHours * 60 * 60 * 1000
      ),
    },
  });

  return analysis;
}
