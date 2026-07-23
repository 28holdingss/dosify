import type { SubstanceContext } from './types.js';
import { clampScore, doseFactor } from './types.js';

export type WearableVitals = {
  heartRateAvg: number | null;
  restingHeartRate: number | null;
  sleepHours: number | null;
  steps: number | null;
  activeEnergyKcal: number | null;
};

type HealthModifiers = {
  allergies: string | null;
  medicalConditions: string | null;
  age: number | null;
  weightKg: number | null;
  wearable?: WearableVitals | null;
};

export type WearableAnalysisHint = {
  code: string;
  message: string;
};

function looksStimulant(primary: SubstanceContext): boolean {
  const blob = `${primary.name} ${primary.drugClass ?? ''} ${primary.categorySlug ?? ''}`.toLowerCase();
  return (
    /stimulant|caffeine|amphetamine|modafinil|methylphenidate|nicotine|energy/.test(blob) ||
    primary.categorySlug === 'stimulants'
  );
}

function looksSedating(primary: SubstanceContext): boolean {
  const blob = `${primary.name} ${primary.drugClass ?? ''} ${primary.categorySlug ?? ''}`.toLowerCase();
  return (
    /sedat|benzo|opioid|alcohol|sleep|ambien|zolpidem|melatonin|antihistamine|gaba/.test(blob) ||
    primary.categorySlug === 'alcohol' ||
    primary.cognitiveImpact >= 0.55
  );
}

function looksCardioActive(primary: SubstanceContext): boolean {
  return (
    primary.cardiovascularImpact >= 0.35 ||
    looksStimulant(primary) ||
    /beta.?block|stimulant|caffeine|nicotine|pseudoephedrine|decongest/.test(
      `${primary.name} ${primary.drugClass ?? ''}`.toLowerCase()
    )
  );
}

/**
 * Adjust organ scores using recent HealthKit / Watch vitals so analysis reflects
 * how a substance may land on *this* body state (e.g. already elevated RHR).
 */
export function applyWearableModifiers(
  primary: SubstanceContext,
  scores: {
    cognitive: number;
    cardiovascular: number;
    gastrointestinal: number;
    liver: number;
  },
  wearable: WearableVitals | null | undefined
): { scores: typeof scores; hints: WearableAnalysisHint[] } {
  if (!wearable) return { scores, hints: [] };

  const next = { ...scores };
  const hints: WearableAnalysisHint[] = [];
  const rhr = wearable.restingHeartRate;
  const avgHr = wearable.heartRateAvg;
  const sleep = wearable.sleepHours;

  // Elevated resting HR + cardio-active or stimulant → higher cardio load
  if (rhr != null && rhr >= 78 && looksCardioActive(primary)) {
    const bump = rhr >= 90 ? 22 : rhr >= 85 ? 16 : 10;
    next.cardiovascular += bump;
    hints.push({
      code: 'elevated_rhr',
      message: `Your recent resting heart rate (~${Math.round(rhr)} bpm) is elevated; ${primary.name} may add cardiovascular strain.`,
    });
  } else if (avgHr != null && avgHr >= 95 && looksCardioActive(primary)) {
    next.cardiovascular += 12;
    hints.push({
      code: 'elevated_avg_hr',
      message: `Your recent average heart rate (~${Math.round(avgHr)} bpm) is high; watch how ${primary.name} feels on your heart rate.`,
    });
  }

  // Low RHR + strong stimulant → still note possible rebound/spike
  if (rhr != null && rhr <= 52 && looksStimulant(primary)) {
    next.cardiovascular += 8;
    hints.push({
      code: 'stimulant_on_low_rhr',
      message: `Resting HR is low (~${Math.round(rhr)} bpm). Stimulants like ${primary.name} can raise heart rate sharply — ease in if sensitive.`,
    });
  }

  // Short sleep + cognitive / sedating substances
  if (sleep != null && sleep < 6) {
    if (looksSedating(primary) || primary.cognitiveImpact >= 0.35) {
      const bump = sleep < 5 ? 18 : 12;
      next.cognitive += bump;
      hints.push({
        code: 'poor_sleep',
        message: `You slept about ${sleep.toFixed(1)}h recently. ${primary.name} may hit harder on alertness and reaction time.`,
      });
    }
    if (looksStimulant(primary)) {
      next.cognitive += 8;
      next.cardiovascular += 6;
      hints.push({
        code: 'stimulant_on_poor_sleep',
        message: `Short sleep (${sleep.toFixed(1)}h) plus ${primary.name} can increase jitteriness and crash risk.`,
      });
    }
  }

  // Very short sleep amplifies overall CNS load
  if (sleep != null && sleep < 4.5 && primary.cognitiveImpact >= 0.25) {
    next.cognitive += 10;
  }

  // Sedating on already low movement day — soft hydration/mobility tip via cognitive bump only if heavy sedative
  if (
    looksSedating(primary) &&
    wearable.steps != null &&
    wearable.steps < 2000 &&
    primary.cognitiveImpact >= 0.45
  ) {
    next.cognitive += 6;
    hints.push({
      code: 'low_activity_sedating',
      message: `Activity looks low today and ${primary.name} is sedating — be extra careful with driving or machinery.`,
    });
  }

  return { scores: next, hints };
}

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

  const wearableApplied = applyWearableModifiers(
    primary,
    { cognitive, cardiovascular, gastrointestinal, liver },
    health.wearable
  );
  cognitive = wearableApplied.scores.cognitive;
  cardiovascular = wearableApplied.scores.cardiovascular;
  gastrointestinal = wearableApplied.scores.gastrointestinal;
  liver = wearableApplied.scores.liver;

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
    wearableHints: wearableApplied.hints,
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
