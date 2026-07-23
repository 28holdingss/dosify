import type { RiskLevel } from '@prisma/client';
import {
  deriveCardiovascularPct,
  deriveSleepPct,
} from './wearable-sync.js';

type RecoveryLike = {
  score: number;
  cognitivePct: number;
  cardiovascularPct: number;
  sleepPct: number;
  recordedAt?: Date | string;
} | null;

type AnalysisLike = {
  overallScore: number;
  cognitiveScore: number;
  cardiovascularScore: number;
} | null | undefined;

type AlcoholIntake = {
  dose: number;
  substance: { maxDose: number | null };
};

type WearableLike = {
  heartRateAvg?: number | null;
  restingHeartRate?: number | null;
  sleepHours?: number | null;
  steps?: number | null;
  activeEnergyKcal?: number | null;
  recordedAt?: Date | string;
} | null;

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function loadFromRecoveryPct(pct: number | null | undefined): number | null {
  if (pct == null) return null;
  return clampScore(100 - pct);
}

/**
 * Combine multiple load signals. Prefer the stronger load so neither a recent
 * intake analysis nor wearable strain is hidden by the other.
 */
function combineLoad(...parts: Array<number | null | undefined>): number {
  const nums = parts.filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  if (!nums.length) return 0;
  if (nums.length === 1) return clampScore(nums[0]);
  const max = Math.max(...nums);
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return clampScore(max * 0.65 + avg * 0.35);
}

/** Elevated day-average HR → cardio load contribution. */
export function deriveAvgHeartRateLoad(avg: number | null | undefined): number | null {
  if (avg == null) return null;
  if (avg <= 70) return 12;
  if (avg <= 80) return 26;
  if (avg <= 90) return 44;
  if (avg <= 100) return 60;
  return 78;
}

export function highestRiskLevel(levels: RiskLevel[]): RiskLevel {
  if (levels.some((l) => l === 'HIGH')) return 'HIGH';
  if (levels.some((l) => l === 'MODERATE')) return 'MODERATE';
  return 'LOW';
}

export function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MODERATE';
  return 'LOW';
}

export function computeAlcoholExposure(intakes: AlcoholIntake[]): number {
  if (intakes.length === 0) return 0;

  let total = 0;
  for (const intake of intakes) {
    const max = intake.substance.maxDose ?? 10;
    total += Math.min(1, intake.dose / Math.max(max, 0.1)) * 30;
  }

  return Math.min(100, Math.round(total));
}

export function buildDashboardIndicators(
  analysis: AnalysisLike,
  recovery: RecoveryLike,
  alcoholIntakes: AlcoholIntake[],
  wearable: WearableLike = null
) {
  const wearableSleepPct =
    wearable?.sleepHours != null ? deriveSleepPct(wearable.sleepHours) : null;
  const wearableSleepLoad = loadFromRecoveryPct(wearableSleepPct);

  const wearableCardioFromRhr = loadFromRecoveryPct(
    deriveCardiovascularPct(wearable?.restingHeartRate)
  );
  const wearableCardioFromAvg = deriveAvgHeartRateLoad(wearable?.heartRateAvg);

  const recoveryCognitive = recovery ? loadFromRecoveryPct(recovery.cognitivePct) : null;
  const recoveryCardio = recovery ? loadFromRecoveryPct(recovery.cardiovascularPct) : null;
  const recoverySleep = recovery ? loadFromRecoveryPct(recovery.sleepPct) : null;

  // Sleep: prefer live HealthKit/Watch hours; never invent from substance overall score.
  const sleepImpact = combineLoad(wearableSleepLoad, wearableSleepLoad == null ? recoverySleep : null);

  const cognitiveLoad = combineLoad(
    analysis?.cognitiveScore,
    recoveryCognitive,
    // Poor sleep raises cognitive load even without a fresh analysis.
    wearableSleepLoad != null ? Math.round(wearableSleepLoad * 0.55) : null
  );

  const cardioLoad = combineLoad(
    analysis?.cardiovascularScore,
    recoveryCardio,
    wearableCardioFromRhr,
    wearableCardioFromAvg
  );

  return {
    cognitiveLoad,
    cardioLoad,
    sleepImpact,
    alcoholExposure: computeAlcoholExposure(alcoholIntakes),
  };
}

export function resolveHealthScore(
  analysis: AnalysisLike,
  recovery: RecoveryLike,
  indicators?: { cognitiveLoad: number; cardioLoad: number; sleepImpact: number }
): number {
  if (indicators) {
    const fromIndicators = clampScore(
      indicators.cognitiveLoad * 0.35 +
        indicators.cardioLoad * 0.35 +
        indicators.sleepImpact * 0.3
    );
    if (analysis) {
      return clampScore(analysis.overallScore * 0.55 + fromIndicators * 0.45);
    }
    return fromIndicators;
  }
  if (analysis) return analysis.overallScore;
  if (recovery) return Math.max(0, 100 - recovery.score);
  return 0;
}
