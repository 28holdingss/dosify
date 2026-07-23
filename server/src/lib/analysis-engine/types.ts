import type { RiskLevel } from '@prisma/client';

export const ENGINE_VERSION = '1.2.0';

export type DetectedInteraction = {
  substanceAId: string;
  substanceBId: string;
  substanceAName: string;
  substanceBName: string;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  advice?: string;
  source?: string;
};

export type AnalysisResult = {
  overallScore: number;
  cognitiveScore: number;
  cardiovascularScore: number;
  gastrointestinalScore: number;
  interactionRiskScore: number;
  durationMinHours: number;
  durationMaxHours: number;
  summary: string;
  recommendations: string[];
  warnings: string[];
  aiGenerated: boolean;
  detectedInteractions: DetectedInteraction[];
};

export type SubstanceContext = {
  id: string;
  name: string;
  dose: number;
  unit: string;
  minDose: number | null;
  maxDose: number | null;
  drugClass: string | null;
  categorySlug: string | null;
  halfLifeHours: number | null;
  cognitiveImpact: number;
  cardiovascularImpact: number;
  gastrointestinalImpact: number;
  liverImpact: number;
  typicalDurationMinHours: number | null;
  typicalDurationMaxHours: number | null;
};

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function riskLevelToScore(level: RiskLevel): number {
  switch (level) {
    case 'HIGH':
      return 85;
    case 'MODERATE':
      return 55;
    case 'LOW':
      return 25;
    default:
      return 20;
  }
}

export function doseFactor(dose: number, min: number | null, max: number | null): number {
  if (max && max > 0) {
    const normalized = dose / max;
    return Math.max(0.15, Math.min(1.5, normalized));
  }
  if (min && min > 0) {
    return Math.max(0.15, Math.min(1.5, dose / (min * 4)));
  }
  return 0.5;
}
