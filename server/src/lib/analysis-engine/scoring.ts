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

type OrganScores = {
  cognitive: number;
  cardiovascular: number;
  gastrointestinal: number;
  liver: number;
  kidney: number;
  respiratory: number;
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

function looksRenalLoad(primary: SubstanceContext): boolean {
  const blob = `${primary.name} ${primary.drugClass ?? ''}`.toLowerCase();
  return (
    primary.kidneyImpact >= 0.3 ||
    /nsaid|ibuprofen|naproxen|lithium|metformin|ace inhibitor|arb\b|diuretic/.test(blob)
  );
}

function looksRespiratoryLoad(primary: SubstanceContext): boolean {
  const blob = `${primary.name} ${primary.drugClass ?? ''}`.toLowerCase();
  return (
    primary.respiratoryImpact >= 0.3 ||
    looksSedating(primary) ||
    /opioid|benzo|codeine|oxycodone|morphine|tramadol|fentanyl|depressant/.test(blob)
  );
}

/**
 * Adjust organ scores using recent HealthKit / Watch vitals so analysis reflects
 * how a substance may land on *this* body state (e.g. already elevated RHR).
 */
export function applyWearableModifiers(
  primary: SubstanceContext,
  scores: OrganScores,
  wearable: WearableVitals | null | undefined
): { scores: OrganScores; hints: WearableAnalysisHint[] } {
  if (!wearable) return { scores, hints: [] };

  const next = { ...scores };
  const hints: WearableAnalysisHint[] = [];
  const rhr = wearable.restingHeartRate;
  const avgHr = wearable.heartRateAvg;
  const sleep = wearable.sleepHours;

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

  if (rhr != null && rhr <= 52 && looksStimulant(primary)) {
    next.cardiovascular += 8;
    hints.push({
      code: 'stimulant_on_low_rhr',
      message: `Resting HR is low (~${Math.round(rhr)} bpm). Stimulants like ${primary.name} can raise heart rate sharply — ease in if sensitive.`,
    });
  }

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
    if (looksRespiratoryLoad(primary)) {
      next.respiratory += sleep < 5 ? 12 : 8;
      hints.push({
        code: 'poor_sleep_respiratory',
        message: `Short sleep can deepen sedating effects of ${primary.name} on breathing and alertness — use extra caution.`,
      });
    }
  }

  if (sleep != null && sleep < 4.5 && primary.cognitiveImpact >= 0.25) {
    next.cognitive += 10;
  }

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
  let kidney = primary.kidneyImpact * factor * 100;
  let respiratory = primary.respiratoryImpact * factor * 100;

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

  if (
    conditions.includes('kidney') ||
    conditions.includes('renal') ||
    conditions.includes('ckd')
  ) {
    kidney += 22;
    if (looksRenalLoad(primary)) kidney += 18;
  }

  if (
    conditions.includes('asthma') ||
    conditions.includes('copd') ||
    conditions.includes('respiratory') ||
    conditions.includes('sleep apnea')
  ) {
    respiratory += 18;
    if (looksRespiratoryLoad(primary)) respiratory += 16;
  }

  if (conditions.includes('heart') || conditions.includes('cardiac')) {
    cardiovascular += 15;
  }

  if (health.age && health.age > 65) {
    cognitive *= 1.15;
    liver *= 1.1;
    kidney *= 1.12;
    respiratory *= 1.08;
  }

  if (health.weightKg && health.weightKg < 55) {
    cognitive *= 1.1;
    gastrointestinal *= 1.1;
    kidney *= 1.08;
  }

  // Class heuristics when profile impacts are still near default
  if (looksRenalLoad(primary) && primary.kidneyImpact <= 0.15) {
    kidney += 18 * factor;
  }
  if (looksRespiratoryLoad(primary) && primary.respiratoryImpact <= 0.15) {
    respiratory += 22 * factor;
  }

  const wearableApplied = applyWearableModifiers(
    primary,
    { cognitive, cardiovascular, gastrointestinal, liver, kidney, respiratory },
    health.wearable
  );
  cognitive = wearableApplied.scores.cognitive;
  cardiovascular = wearableApplied.scores.cardiovascular;
  gastrointestinal = wearableApplied.scores.gastrointestinal;
  liver = wearableApplied.scores.liver;
  kidney = wearableApplied.scores.kidney;
  respiratory = wearableApplied.scores.respiratory;

  const organMax = Math.max(
    cognitive,
    cardiovascular,
    gastrointestinal,
    liver,
    kidney,
    respiratory
  );
  const overall = clampScore(
    organMax * 0.42 + interactionRisk * 0.38 + Math.max(liver, kidney) * 0.12 + respiratory * 0.08
  );

  return {
    overallScore: overall,
    cognitiveScore: clampScore(cognitive),
    cardiovascularScore: clampScore(cardiovascular),
    gastrointestinalScore: clampScore(gastrointestinal),
    liverScore: clampScore(liver),
    kidneyScore: clampScore(kidney),
    respiratoryScore: clampScore(respiratory),
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
