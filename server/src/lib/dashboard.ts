import type { RiskLevel } from '@prisma/client';

type RecoveryLike = {
  score: number;
  cognitivePct: number;
  cardiovascularPct: number;
  sleepPct: number;
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
    total += Math.min(1, intake.dose / max) * 30;
  }

  return Math.min(100, Math.round(total));
}

export function buildDashboardIndicators(
  analysis: AnalysisLike,
  recovery: RecoveryLike,
  alcoholIntakes: AlcoholIntake[]
) {
  return {
    cognitiveLoad:
      analysis?.cognitiveScore ??
      (recovery ? Math.max(0, 100 - recovery.cognitivePct) : 0),
    cardioLoad:
      analysis?.cardiovascularScore ??
      (recovery ? Math.max(0, 100 - recovery.cardiovascularPct) : 0),
    sleepImpact:
      recovery != null
        ? Math.max(0, 100 - recovery.sleepPct)
        : analysis
          ? Math.round(analysis.overallScore * 0.75)
          : 0,
    alcoholExposure: computeAlcoholExposure(alcoholIntakes),
  };
}

export function resolveHealthScore(analysis: AnalysisLike, recovery: RecoveryLike): number {
  if (analysis) return analysis.overallScore;
  if (recovery) return Math.max(0, 100 - recovery.score);
  return 0;
}
