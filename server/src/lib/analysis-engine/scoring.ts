import type { SubstanceContext } from './types.js';
import { clampScore, doseFactor } from './types.js';

type HealthModifiers = {
  allergies: string | null;
  medicalConditions: string | null;
  age: number | null;
  weightKg: number | null;
};

export function scoreSubstanceEffects(
  primary: SubstanceContext,
  interactionRisk: number,
  health: HealthModifiers
) {
  const factor = doseFactor(primary.dose, primary.minDose, primary.maxDose);

  let cognitive = primary.cognitiveImpact * factor * 100;
  let cardiovascular = primary.cardiovascularImpact * factor * 100;
  let gastrointestinal = primary.gastrointestinalImpact * factor * 100;
  let liver = primary.liverImpact * factor * 100;

  const name = primary.name.toLowerCase();
  const allergies = (health.allergies ?? '').toLowerCase();
  const conditions = (health.medicalConditions ?? '').toLowerCase();

  if (allergies.includes('penicillin') && name.includes('amoxicillin')) {
    cognitive += 40;
    gastrointestinal += 50;
  }

  if (conditions.includes('liver') || conditions.includes('hepatic')) {
    liver += 20;
    if (primary.liverImpact > 0.2) liver += 15;
  }

  if (conditions.includes('heart') || conditions.includes('cardiac')) {
    cardiovascular += 15;
  }

  if (health.age && health.age > 65) {
    cognitive *= 1.15;
    liver *= 1.1;
  }

  if (health.weightKg && health.weightKg < 55) {
    cognitive *= 1.1;
    gastrointestinal *= 1.1;
  }

  const organMax = Math.max(cognitive, cardiovascular, gastrointestinal, liver);
  const overall = clampScore(
    organMax * 0.45 + interactionRisk * 0.4 + liver * 0.15
  );

  return {
    overallScore: overall,
    cognitiveScore: clampScore(cognitive),
    cardiovascularScore: clampScore(cardiovascular),
    gastrointestinalScore: clampScore(gastrointestinal),
    liverScore: clampScore(liver),
  };
}

export function estimateDuration(primary: SubstanceContext): {
  min: number;
  max: number;
} {
  if (primary.typicalDurationMinHours && primary.typicalDurationMaxHours) {
    return {
      min: primary.typicalDurationMinHours,
      max: primary.typicalDurationMaxHours,
    };
  }

  const halfLife = primary.halfLifeHours ?? 4;
  return {
    min: Math.round(halfLife * 1.5 * 10) / 10,
    max: Math.round(halfLife * 3 * 10) / 10,
  };
}
