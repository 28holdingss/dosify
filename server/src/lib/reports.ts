import type { RiskLevel } from '@prisma/client';

type IntakeWithAnalysis = {
  takenAt: Date;
  dose: number;
  substance: { name: string; id: string };
  analysis: {
    overallScore: number;
    cognitiveScore: number;
    cardiovascularScore: number;
    gastrointestinalScore: number;
    interactionRiskScore: number;
    durationMinHours: number | null;
    durationMaxHours: number | null;
    summary: string | null;
    recommendations: unknown;
    warnings: unknown;
    aiGenerated: boolean;
    engineVersion: string;
  } | null;
};

export function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MODERATE';
  return 'LOW';
}

export function riskLevelLabel(level: RiskLevel): string {
  if (level === 'HIGH') return 'High';
  if (level === 'MODERATE') return 'Moderate';
  return 'Low';
}

export function assessDose(
  dose: number,
  min: number | null,
  max: number | null
): 'low' | 'normal' | 'high' {
  if (max && max > 0) {
    const ratio = dose / max;
    if (ratio <= 0.35) return 'low';
    if (ratio <= 0.85) return 'normal';
    return 'high';
  }
  if (min && min > 0) {
    const ratio = dose / (min * 4);
    if (ratio <= 0.35) return 'low';
    if (ratio <= 0.85) return 'normal';
    return 'high';
  }
  return 'normal';
}

export function doseAssessmentLabel(level: 'low' | 'normal' | 'high'): string {
  if (level === 'low') return 'Below typical range';
  if (level === 'high') return 'Above typical range';
  return 'Within typical range';
}

export function estimatePeakWindow(
  durationMin: number | null,
  durationMax: number | null
): { startHours: number; endHours: number } {
  const min = durationMin ?? 1;
  const max = durationMax ?? min * 2;
  const peakStart = Math.max(0.5, Math.round(min * 0.25 * 10) / 10);
  const peakEnd = Math.round(max * 0.55 * 10) / 10;
  return { startHours: peakStart, endHours: Math.max(peakStart + 0.5, peakEnd) };
}

export function avgAnalysisScores(intakes: IntakeWithAnalysis[]) {
  const analyzed = intakes.filter((i) => i.analysis);
  if (analyzed.length === 0) {
    return {
      cognitive: 0,
      cardiovascular: 0,
      gastrointestinal: 0,
      interaction: 0,
      overall: 0,
      count: 0,
    };
  }

  const sum = analyzed.reduce(
    (acc, i) => {
      const a = i.analysis!;
      acc.cognitive += a.cognitiveScore;
      acc.cardiovascular += a.cardiovascularScore;
      acc.gastrointestinal += a.gastrointestinalScore;
      acc.interaction += a.interactionRiskScore;
      acc.overall += a.overallScore;
      return acc;
    },
    { cognitive: 0, cardiovascular: 0, gastrointestinal: 0, interaction: 0, overall: 0 }
  );

  const count = analyzed.length;
  return {
    cognitive: Math.round(sum.cognitive / count),
    cardiovascular: Math.round(sum.cardiovascular / count),
    gastrointestinal: Math.round(sum.gastrointestinal / count),
    interaction: Math.round(sum.interaction / count),
    overall: Math.round(sum.overall / count),
    count,
  };
}

export function buildWeeklyNarrative(params: {
  totalIntakes: number;
  avgRisk: number;
  avgRiskChange: number;
  highRiskCount: number;
  interactionAlerts: number;
  topSubstance: string | null;
}): string {
  if (params.totalIntakes === 0) {
    return 'No intakes logged this week. Log substances to unlock personalized analysis and weekly reports.';
  }

  const riskPhrase =
    params.avgRisk >= 70
      ? 'elevated overall risk'
      : params.avgRisk >= 40
        ? 'moderate overall risk'
        : 'a relatively low-risk profile';

  const trendPhrase =
    params.avgRiskChange > 10
      ? 'Risk has increased compared to last week.'
      : params.avgRiskChange < -10
        ? 'Risk has improved compared to last week.'
        : 'Risk is stable compared to last week.';

  const parts = [
    `You logged ${params.totalIntakes} intake${params.totalIntakes === 1 ? '' : 's'} this week with ${riskPhrase} (avg ${params.avgRisk}/100).`,
    trendPhrase,
  ];

  if (params.topSubstance) {
    parts.push(`${params.topSubstance} was your most logged substance.`);
  }
  if (params.highRiskCount > 0) {
    parts.push(`${params.highRiskCount} log${params.highRiskCount === 1 ? '' : 's'} flagged high risk — review those analyses.`);
  }
  if (params.interactionAlerts > 0) {
    parts.push(`${params.interactionAlerts} active interaction alert${params.interactionAlerts === 1 ? '' : 's'} need attention.`);
  }

  return parts.join(' ');
}

export function trendDirection(values: number[]): 'up' | 'down' | 'flat' {
  const nonZero = values.filter((v) => v > 0);
  if (nonZero.length < 2) return 'flat';
  const firstHalf = nonZero.slice(0, Math.ceil(nonZero.length / 2));
  const secondHalf = nonZero.slice(Math.ceil(nonZero.length / 2));
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const delta = avgSecond - avgFirst;
  if (Math.abs(delta) < 3) return 'flat';
  return delta > 0 ? 'up' : 'down';
}

export function parseJsonStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return [];
}
