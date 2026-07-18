import { estimatePeakWindow } from './reports.js';

export type TimelineSystem = 'cognitive' | 'cardiovascular' | 'gastrointestinal' | 'liver';

export type TimelinePhase = 'onset' | 'peak' | 'comedown' | 'clearing';

type CurveParams = {
  onsetRatio: number;
  peakRatio: number;
  plateauRatio: number;
  decay: 'linear' | 'exponential' | 'slow';
};

type SubstanceTimelineContext = {
  name: string;
  categorySlug: string | null;
  drugClass: string | null;
  halfLifeHours: number | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  prescription: 'Prescription',
  otc: 'OTC / Medicine',
  vitamins: 'Vitamin / Supplement',
  alcohol: 'Alcohol',
  cannabis: 'Cannabis',
  nicotine: 'Nicotine',
  caffeine: 'Caffeine',
  stimulants: 'Stimulant',
  psychedelics: 'Psychedelic',
  sedatives: 'Sedative',
  herbals: 'Herbal',
  other: 'Other',
};

function drugClass(primary: SubstanceTimelineContext): string {
  return (primary.drugClass ?? '').toUpperCase();
}

function matchesClass(primary: SubstanceTimelineContext, ...classes: string[]): boolean {
  const cls = drugClass(primary);
  return classes.some((c) => cls.includes(c));
}

function isCategory(primary: SubstanceTimelineContext, ...slugs: string[]): boolean {
  return slugs.includes(primary.categorySlug ?? '');
}

function resolveBaseProfile(primary: SubstanceTimelineContext): CurveParams {
  if (isCategory(primary, 'psychedelics') || matchesClass(primary, 'PSYCHEDELIC', 'DISSOCIATIVE')) {
    return { onsetRatio: 0.22, peakRatio: 0.38, plateauRatio: 0.32, decay: 'slow' };
  }
  if (isCategory(primary, 'alcohol')) {
    return { onsetRatio: 0.12, peakRatio: 0.42, plateauRatio: 0.18, decay: 'linear' };
  }
  if (matchesClass(primary, 'OPIOID') || isCategory(primary, 'sedatives') || matchesClass(primary, 'BENZODIAZEPINE', 'HYPNOTIC', 'GABAERGIC')) {
    return { onsetRatio: 0.14, peakRatio: 0.3, plateauRatio: 0.22, decay: 'slow' };
  }
  if (isCategory(primary, 'stimulants') || matchesClass(primary, 'STIMULANT', 'EMPATHOGEN', 'CATHINONE', 'NDRI')) {
    return { onsetRatio: 0.06, peakRatio: 0.22, plateauRatio: 0.12, decay: 'exponential' };
  }
  if (isCategory(primary, 'caffeine')) {
    return { onsetRatio: 0.08, peakRatio: 0.25, plateauRatio: 0.2, decay: 'linear' };
  }
  if (isCategory(primary, 'nicotine')) {
    return { onsetRatio: 0.04, peakRatio: 0.14, plateauRatio: 0.08, decay: 'exponential' };
  }
  if (isCategory(primary, 'cannabis') || matchesClass(primary, 'CANNABINOID')) {
    return { onsetRatio: 0.18, peakRatio: 0.4, plateauRatio: 0.28, decay: 'slow' };
  }
  if (matchesClass(primary, 'NSAID', 'ANALGESIC', 'PPI') || isCategory(primary, 'otc')) {
    return { onsetRatio: 0.1, peakRatio: 0.28, plateauRatio: 0.1, decay: 'exponential' };
  }
  if (isCategory(primary, 'vitamins', 'herbals') || matchesClass(primary, 'VITAMIN', 'MINERAL', 'SUPPLEMENT', 'HERBAL')) {
    return { onsetRatio: 0.15, peakRatio: 0.35, plateauRatio: 0.25, decay: 'slow' };
  }
  if (isCategory(primary, 'prescription')) {
    return { onsetRatio: 0.12, peakRatio: 0.32, plateauRatio: 0.15, decay: 'linear' };
  }
  return { onsetRatio: 0.1, peakRatio: 0.32, plateauRatio: 0.12, decay: 'linear' };
}

function resolveSystemCurve(
  primary: SubstanceTimelineContext,
  system: TimelineSystem
): CurveParams {
  const base = resolveBaseProfile(primary);

  if (system === 'liver') {
    if (isCategory(primary, 'alcohol') || matchesClass(primary, 'ANALGESIC')) {
      return { ...base, onsetRatio: 0.2, peakRatio: 0.55, plateauRatio: 0.2, decay: 'slow' };
    }
    if (matchesClass(primary, 'NSAID', 'STATIN')) {
      return { ...base, onsetRatio: 0.15, peakRatio: 0.45, plateauRatio: 0.15, decay: 'slow' };
    }
    return { ...base, peakRatio: Math.min(0.5, base.peakRatio + 0.12), decay: 'slow' };
  }

  if (system === 'gastrointestinal') {
    if (matchesClass(primary, 'NSAID', 'OPIOID', 'SSRI', 'SNRI')) {
      return { ...base, onsetRatio: base.onsetRatio + 0.05, peakRatio: Math.min(0.5, base.peakRatio + 0.08), decay: 'slow' };
    }
    if (isCategory(primary, 'alcohol')) {
      return { ...base, peakRatio: 0.48, plateauRatio: 0.15, decay: 'linear' };
    }
    return base;
  }

  if (system === 'cardiovascular') {
    if (isCategory(primary, 'stimulants', 'caffeine', 'nicotine') || matchesClass(primary, 'STIMULANT', 'EMPATHOGEN', 'DECONGESTANT', 'VASODILATOR')) {
      return { ...base, peakRatio: Math.max(0.12, base.peakRatio - 0.04), decay: 'slow' };
    }
    if (isCategory(primary, 'alcohol')) {
      return { ...base, peakRatio: 0.38, plateauRatio: 0.22, decay: 'slow' };
    }
    if (matchesClass(primary, 'OPIOID', 'BENZODIAZEPINE')) {
      return { ...base, peakRatio: base.peakRatio + 0.05, decay: 'slow' };
    }
    return base;
  }

  if (system === 'cognitive') {
    if (matchesClass(primary, 'ANTIHISTAMINE', 'ANTIPSYCHOTIC') || isCategory(primary, 'sedatives')) {
      return { ...base, peakRatio: base.peakRatio + 0.06, plateauRatio: base.plateauRatio + 0.1, decay: 'slow' };
    }
    if (isCategory(primary, 'psychedelics')) {
      return { ...base, plateauRatio: 0.38, decay: 'slow' };
    }
  }

  return base;
}

export function generateSubstanceEffectCurve(
  peakScore: number,
  pointCount: number,
  primary: SubstanceTimelineContext,
  system: TimelineSystem
): number[] {
  const params = resolveSystemCurve(primary, system);
  const peakIdx = Math.round(params.peakRatio * (pointCount - 1));
  const onsetIdx = Math.round(params.onsetRatio * (pointCount - 1));
  const plateauEnd = Math.min(
    pointCount - 1,
    peakIdx + Math.round(params.plateauRatio * Math.max(1, pointCount - 1 - peakIdx))
  );

  return Array.from({ length: pointCount }, (_, i) => {
    if (peakScore <= 0) return 0;

    if (i <= onsetIdx) {
      if (onsetIdx === 0 && i === 0) return 0;
      if (i < onsetIdx) return 0;
    }

    if (i <= peakIdx) {
      const rampSpan = Math.max(1, peakIdx - onsetIdx);
      const ramp = (i - onsetIdx) / rampSpan;
      return Math.round(peakScore * Math.min(1, ramp));
    }

    if (i <= plateauEnd) return peakScore;

    const tailLen = Math.max(1, pointCount - 1 - plateauEnd);
    const decayProgress = (pointCount - 1 - i) / tailLen;

    if (params.decay === 'exponential') {
      return Math.round(peakScore * decayProgress * decayProgress);
    }
    if (params.decay === 'slow') {
      return Math.round(peakScore * Math.pow(decayProgress, 0.55));
    }
    return Math.round(peakScore * decayProgress);
  });
}

export function resolveTimelinePhase(
  markerIndex: number,
  peakIndex: number,
  pointCount: number
): TimelinePhase {
  if (markerIndex >= pointCount - 1) return 'clearing';
  if (markerIndex > peakIndex + 1) return 'comedown';
  if (markerIndex >= Math.max(0, peakIndex - 1)) return 'peak';
  return 'onset';
}

export function resolvePhaseLabels(primary: SubstanceTimelineContext): Record<TimelinePhase, string> {
  if (isCategory(primary, 'psychedelics') || matchesClass(primary, 'PSYCHEDELIC', 'DISSOCIATIVE')) {
    return { onset: 'Come-up', peak: 'Peak', comedown: 'Comedown', clearing: 'Afterglow' };
  }
  if (isCategory(primary, 'stimulants', 'caffeine') || matchesClass(primary, 'STIMULANT', 'EMPATHOGEN', 'NDRI')) {
    return { onset: 'Activation', peak: 'Peak', comedown: 'Wear-off', clearing: 'Baseline' };
  }
  if (isCategory(primary, 'alcohol')) {
    return { onset: 'Absorption', peak: 'Peak BAC', comedown: 'Metabolizing', clearing: 'Clear' };
  }
  if (matchesClass(primary, 'OPIOID') || isCategory(primary, 'sedatives')) {
    return { onset: 'Onset', peak: 'Peak sedation', comedown: 'Residual', clearing: 'Clear' };
  }
  if (isCategory(primary, 'cannabis')) {
    return { onset: 'Onset', peak: 'Peak high', comedown: 'Coming down', clearing: 'Clear' };
  }
  if (isCategory(primary, 'nicotine')) {
    return { onset: 'Hit', peak: 'Peak', comedown: 'Fading', clearing: 'Clear' };
  }
  if (matchesClass(primary, 'NSAID', 'ANALGESIC') || isCategory(primary, 'otc')) {
    return { onset: 'Onset', peak: 'Relief peak', comedown: 'Tapering', clearing: 'Worn off' };
  }
  return { onset: 'Onset', peak: 'Peak', comedown: 'Wear-off', clearing: 'Clear' };
}

export function buildPhaseDescription(
  primary: SubstanceTimelineContext,
  phase: TimelinePhase
): string {
  const name = primary.name;

  if (isCategory(primary, 'psychedelics')) {
    if (phase === 'onset') return `${name} effects are building — set and setting matter most now.`;
    if (phase === 'peak') return `Peak ${name} window — perception and cognition are most altered.`;
    if (phase === 'comedown') return `${name} is tapering — rest and hydration support integration.`;
    return `${name} acute effects have largely cleared.`;
  }

  if (isCategory(primary, 'stimulants') || matchesClass(primary, 'STIMULANT', 'EMPATHOGEN')) {
    if (phase === 'onset') return `${name} is activating — alertness and heart rate may rise.`;
    if (phase === 'peak') return `Peak ${name} stimulation — monitor hydration and body temperature.`;
    if (phase === 'comedown') return `${name} is wearing off — fatigue or irritability can follow.`;
    return `${name} stimulant effects are mostly cleared.`;
  }

  if (isCategory(primary, 'alcohol')) {
    if (phase === 'onset') return `${name} is absorbing — impairment builds as BAC rises.`;
    if (phase === 'peak') return `Peak ${name} exposure — coordination and judgment are most affected.`;
    if (phase === 'comedown') return `${name} is metabolizing — dehydration and liver load remain elevated.`;
    return `${name} acute effects have cleared — hangover risk may linger.`;
  }

  if (matchesClass(primary, 'OPIOID')) {
    if (phase === 'onset') return `${name} sedation is beginning — avoid other depressants.`;
    if (phase === 'peak') return `Peak ${name} effects — highest sedation and respiratory depression risk.`;
    if (phase === 'comedown') return `${name} is tapering — drowsiness may persist.`;
    return `${name} acute opioid effects have mostly cleared.`;
  }

  if (isCategory(primary, 'cannabis')) {
    if (phase === 'onset') return `${name} effects are coming on — cognitive slowing may increase.`;
    if (phase === 'peak') return `Peak ${name} window — memory and reaction time are most affected.`;
    if (phase === 'comedown') return `${name} is wearing off — appetite and drowsiness are common.`;
    return `${name} acute effects have cleared.`;
  }

  if (matchesClass(primary, 'NSAID', 'ANALGESIC')) {
    if (phase === 'onset') return `${name} is starting to work — relief builds gradually.`;
    if (phase === 'peak') return `Peak ${name} relief window — GI and liver load may also peak.`;
    if (phase === 'comedown') return `${name} is tapering — take food if stomach is sensitive.`;
    return `${name} therapeutic window has ended.`;
  }

  if (phase === 'onset') return `${name} effects are beginning to build.`;
  if (phase === 'peak') return `Strongest ${name} effects are expected around now.`;
  if (phase === 'comedown') return `${name} is wearing off — effects are declining.`;
  return `${name} acute effects have largely cleared.`;
}

function scoreInsight(value: number, high: string, moderate: string, low: string): string {
  if (value >= 60) return high;
  if (value >= 40) return moderate;
  return low;
}

export function buildSystemInsight(
  primary: SubstanceTimelineContext,
  system: TimelineSystem,
  value: number,
  phase: TimelinePhase
): string {
  const name = primary.name;

  if (system === 'cognitive') {
    if (isCategory(primary, 'psychedelics')) {
      return scoreInsight(
        value,
        `Strong perceptual and cognitive shift from ${name} — avoid driving or complex decisions.`,
        `${name} is noticeably altering perception and focus.`,
        `${name} cognitive effects are mild at this point.`
      );
    }
    if (isCategory(primary, 'stimulants', 'caffeine') || matchesClass(primary, 'STIMULANT', 'EMPATHOGEN')) {
      return scoreInsight(
        value,
        `High alertness from ${name} — jitteriness and focus swings are likely.`,
        `${name} is boosting alertness — you may feel wired or restless.`,
        `${name} cognitive stimulation is low right now.`
      );
    }
    if (matchesClass(primary, 'OPIOID', 'BENZODIAZEPINE', 'HYPNOTIC') || isCategory(primary, 'sedatives')) {
      return scoreInsight(
        value,
        `${name} sedation is strong — do not drive or mix with alcohol.`,
        `${name} is causing noticeable drowsiness and slowed thinking.`,
        `${name} cognitive sedation is minimal now.`
      );
    }
    if (isCategory(primary, 'alcohol')) {
      return scoreInsight(
        value,
        `${name} impairment is high — judgment and reaction time are reduced.`,
        `${name} is affecting coordination and decision-making.`,
        `${name} cognitive impairment is low at this stage.`
      );
    }
    if (isCategory(primary, 'cannabis')) {
      return scoreInsight(
        value,
        `${name} is strongly affecting memory and reaction time.`,
        `${name} may slow thinking and short-term memory.`,
        `${name} cognitive effects are mild right now.`
      );
    }
    return scoreInsight(
      value,
      `High cognitive load from ${name} — avoid driving or complex tasks.`,
      `${name} may cause noticeable mental effects.`,
      `${name} cognitive impact is manageable.`
    );
  }

  if (system === 'cardiovascular') {
    if (isCategory(primary, 'stimulants', 'caffeine', 'nicotine') || matchesClass(primary, 'STIMULANT', 'EMPATHOGEN', 'DECONGESTANT')) {
      return scoreInsight(
        value,
        `${name} is elevating heart rate and blood pressure — avoid intense exercise.`,
        `${name} may cause palpitations or elevated heart rate.`,
        `${name} cardiovascular strain is low.`
      );
    }
    if (isCategory(primary, 'alcohol')) {
      return scoreInsight(
        value,
        `${name} is stressing the cardiovascular system — rest and hydrate.`,
        `${name} may cause flushing or elevated heart rate.`,
        `${name} cardiovascular load is within a normal range.`
      );
    }
    if (matchesClass(primary, 'VASODILATOR')) {
      return scoreInsight(
        value,
        `${name} causes rapid blood pressure drops — avoid standing quickly.`,
        `${name} may cause warmth and lightheadedness.`,
        `${name} cardiovascular effects are minimal.`
      );
    }
    return scoreInsight(
      value,
      `Elevated cardiovascular strain from ${name} — rest and hydrate.`,
      `${name} may add some cardiac load — take it easy on exercise.`,
      `${name} cardiovascular load is within normal range.`
    );
  }

  if (system === 'gastrointestinal') {
    if (matchesClass(primary, 'NSAID')) {
      return scoreInsight(
        value,
        `${name} GI irritation risk is elevated — take with food and avoid alcohol.`,
        `${name} may irritate the stomach — eat something if needed.`,
        `${name} gastrointestinal effects are minimal.`
      );
    }
    if (matchesClass(primary, 'OPIOID')) {
      return scoreInsight(
        value,
        `${name} commonly slows digestion — constipation risk increases.`,
        `${name} may cause nausea or stomach discomfort.`,
        `${name} GI effects are mild.`
      );
    }
    if (isCategory(primary, 'alcohol')) {
      return scoreInsight(
        value,
        `${name} is irritating the GI tract — nausea and acid reflux are common.`,
        `${name} may cause stomach upset at this stage.`,
        `${name} GI effects are minimal now.`
      );
    }
    return scoreInsight(
      value,
      `${name} GI effects may be noticeable — eat lightly if needed.`,
      `${name} may cause mild stomach sensitivity.`,
      `${name} gastrointestinal effects are minimal.`
    );
  }

  // liver
  if (isCategory(primary, 'alcohol') || matchesClass(primary, 'ANALGESIC')) {
    return scoreInsight(
      value,
      `${name} liver load is elevated — avoid alcohol and other hepatotoxic drugs.`,
      `${name} is adding moderate liver processing load.`,
      `${name} liver strain is low at this point.`
    );
  }
  if (matchesClass(primary, 'NSAID', 'STATIN')) {
    return scoreInsight(
      value,
      `${name} may stress the liver — avoid alcohol and watch daily limits.`,
      `${name} adds moderate liver processing demand.`,
      `${name} liver impact is minimal.`
    );
  }
  return scoreInsight(
    value,
    `${name} liver processing load is elevated.`,
    `${name} adds moderate liver workload.`,
    `${name} liver impact is minimal.`
  );
}

export function buildImpactHighlights(
  primary: SubstanceTimelineContext,
  phase: TimelinePhase,
  scores: Record<TimelineSystem, number>
): string[] {
  const highlights: string[] = [];
  const name = primary.name;

  if (isCategory(primary, 'psychedelics')) {
    if (phase === 'peak') highlights.push(`Peak perceptual effects — stay in a safe, calm environment.`);
    if (scores.cognitive >= 50) highlights.push(`Altered thinking and perception from ${name} are active.`);
    highlights.push(`Effects typically last ${primary.halfLifeHours && primary.halfLifeHours > 6 ? 'several hours' : 'hours'} — plan accordingly.`);
  } else if (isCategory(primary, 'stimulants') || matchesClass(primary, 'STIMULANT', 'EMPATHOGEN')) {
    if (scores.cardiovascular >= 40) highlights.push(`Heart rate and blood pressure may be elevated from ${name}.`);
    if (phase === 'comedown') highlights.push(`Crash phase — fatigue and low mood are common as ${name} wears off.`);
    highlights.push(`Hydrate regularly; avoid stacking other stimulants or alcohol.`);
  } else if (isCategory(primary, 'alcohol')) {
    if (scores.liver >= 40) highlights.push(`Liver is actively processing ${name} — avoid further alcohol.`);
    if (scores.cognitive >= 40) highlights.push(`Coordination and judgment remain impaired while ${name} is active.`);
    if (phase === 'comedown') highlights.push(`Hangover risk increases as ${name} metabolizes.`);
  } else if (matchesClass(primary, 'OPIOID')) {
    highlights.push(`Never combine ${name} with alcohol, benzos, or other depressants.`);
    if (scores.cognitive >= 40) highlights.push(`Sedation from ${name} impairs reaction time and breathing drive.`);
  } else if (matchesClass(primary, 'NSAID', 'ANALGESIC')) {
    if (scores.gastrointestinal >= 30) highlights.push(`Take ${name} with food to reduce stomach irritation.`);
    if (scores.liver >= 35) highlights.push(`Avoid alcohol while ${name} is active — liver and GI risk increases.`);
  } else if (isCategory(primary, 'cannabis')) {
    if (scores.cognitive >= 45) highlights.push(`${name} slows reaction time — avoid driving while impaired.`);
    highlights.push(`Effects vary by dose and tolerance — onset can be gradual.`);
  } else if (isCategory(primary, 'caffeine', 'nicotine')) {
    if (scores.cardiovascular >= 35) highlights.push(`${name} may elevate heart rate — ease off if jittery.`);
    highlights.push(`Avoid stacking with other stimulants late in the day.`);
  } else {
    const dominant = (Object.entries(scores) as [TimelineSystem, number][])
      .sort((a, b) => b[1] - a[1])[0];
    if (dominant[1] >= 40) {
      highlights.push(`Highest load right now: ${dominant[0]} system (${dominant[1]}/100).`);
    }
  }

  if (highlights.length === 0) {
    highlights.push(`${name} effects are relatively mild at this stage.`);
    highlights.push(`Monitor how you feel as the timeline progresses.`);
  }

  return highlights.slice(0, 3);
}

export function buildTimelineFooter(primary: SubstanceTimelineContext, phase: TimelinePhase): string {
  const name = primary.name;

  if (isCategory(primary, 'psychedelics')) {
    return phase === 'comedown'
      ? `Rest and hydrate as ${name} comedown — integration beats rushing back to activity.`
      : `Stay in a safe setting while ${name} is active — avoid unexpected stressors.`;
  }
  if (isCategory(primary, 'stimulants') || matchesClass(primary, 'STIMULANT', 'EMPATHOGEN')) {
    return `Sip water with ${name} — avoid alcohol and other stimulants while active.`;
  }
  if (isCategory(primary, 'alcohol')) {
    return `Hydrate between drinks and avoid further alcohol while ${name} is metabolizing.`;
  }
  if (matchesClass(primary, 'NSAID')) {
    return `Take ${name} with food and avoid alcohol to protect your stomach and liver.`;
  }
  if (matchesClass(primary, 'OPIOID')) {
    return `Do not mix ${name} with alcohol or sedatives — have someone check on you if overly drowsy.`;
  }
  if (isCategory(primary, 'cannabis')) {
    return `Avoid driving while ${name} is active — effects on reaction time can linger.`;
  }
  return `Stay hydrated while ${name} is active and listen to your body.`;
}

export function categoryLabel(slug: string | null): string {
  if (!slug) return 'Substance';
  return CATEGORY_LABELS[slug] ?? slug;
}

export { estimatePeakWindow };
