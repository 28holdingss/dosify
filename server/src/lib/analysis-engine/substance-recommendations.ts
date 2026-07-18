import type { SubstanceContext } from './types.js';

type RecInput = {
  primary: SubstanceContext;
  scores: {
    cognitiveScore: number;
    cardiovascularScore: number;
    gastrointestinalScore: number;
    liverScore?: number;
  };
  duration: { min: number; max: number };
  peak: { startHours: number; endHours: number };
  doseLevel: 'low' | 'normal' | 'high';
};

function cls(primary: SubstanceContext): string {
  return (primary.drugClass ?? '').toUpperCase();
}

function matchesClass(primary: SubstanceContext, ...classes: string[]): boolean {
  const drugClass = cls(primary);
  return classes.some((c) => drugClass.includes(c));
}

/** Actionable tips tailored to the logged substance — not generic cross-log advice. */
export function buildSubstanceRecommendations(input: RecInput): string[] {
  const { primary, scores, duration, peak, doseLevel } = input;
  const name = primary.name;
  const tips: string[] = [];

  tips.push(
    `For your ${name} dose (${primary.dose} ${primary.unit}), expect the strongest effects around ${peak.startHours}–${peak.endHours}h after intake.`
  );

  if (doseLevel === 'high') {
    tips.push(`${name} is above the typical logged range — consider whether a lower dose would meet your needs.`);
  } else if (doseLevel === 'low') {
    tips.push(`Your ${name} dose is on the lower end of the typical range — effects may be milder and shorter.`);
  }

  // NSAIDs & analgesics
  if (matchesClass(primary, 'NSAID') || ['Ibuprofen', 'Aspirin', 'Naproxen'].includes(name)) {
    if (scores.gastrointestinalScore >= 30) {
      tips.push(`Take ${name} with food or water to reduce stomach irritation.`);
    }
    tips.push(`Avoid alcohol for at least 6 hours while ${name} is active — NSAIDs plus alcohol raise GI bleeding risk.`);
    if (name === 'Aspirin') {
      tips.push('Avoid combining aspirin with other NSAIDs unless directed by a clinician.');
    }
    return dedupe(tips);
  }

  if (name === 'Paracetamol' || matchesClass(primary, 'ANALGESIC')) {
    tips.push(`Do not combine ${name} with alcohol — liver stress risk increases.`);
    if (scores.gastrointestinalScore >= 30) {
      tips.push(`Take ${name} with water; avoid exceeding daily limits.`);
    }
    return dedupe(tips);
  }

  // Opioids
  if (matchesClass(primary, 'OPIOID') || ['Heroin', 'Kratom'].includes(name)) {
    tips.push(`Never mix ${name} with alcohol, benzodiazepines, or other depressants — respiratory depression risk.`);
    if (scores.cognitiveScore >= 40) {
      tips.push('Avoid driving or operating machinery — opioid sedation impairs reaction time.');
    }
    tips.push('Have someone check on you if you feel overly sedated or short of breath.');
    return dedupe(tips);
  }

  // Caffeine & nicotine (before broad stimulant class — coffee is drugClass STIMULANT)
  if (
    primary.categorySlug === 'caffeine' ||
    ['Coffee', 'Tea', 'Energy Drink', 'Caffeine Pill', 'Pre-Workout', 'Matcha', 'Yerba Mate'].includes(name)
  ) {
    tips.push(`Limit additional caffeine for 6+ hours after ${name} to protect sleep.`);
    if (scores.cardiovascularScore >= 35) {
      tips.push('If you feel jittery or notice palpitations, reduce dose next time.');
    }
    return dedupe(tips);
  }

  if (
    primary.categorySlug === 'nicotine' ||
    ['Nicotine', 'Nicotine Pouch', 'Nicotine Patch', 'Nicotine Gum'].includes(name)
  ) {
    tips.push(`Avoid stacking ${name} with high caffeine — both elevate heart rate.`);
    tips.push('If cutting down, space doses and stay hydrated.');
    return dedupe(tips);
  }

  // Stimulants & empathogens (illicit / prescription amphetamines)
  if (
    matchesClass(primary, 'EMPATHOGEN', 'CATHINONE', 'NDRI') ||
    ['MDMA', 'Cocaine', 'Crack Cocaine', 'Amphetamine', 'Methamphetamine', 'Modafinil', 'Mephedrone', '3-MMC', '4-FA', 'Methylphenidate', 'Lisdexamfetamine'].includes(name)
  ) {
    tips.push(`Stay hydrated with ${name} — sip water regularly, not all at once.`);
    tips.push('Avoid stacking other stimulants or mixing with alcohol.');
    if (scores.cardiovascularScore >= 40) {
      tips.push('Skip intense exercise and monitor heart rate — stimulants increase cardiac strain.');
    }
    if (name === 'MDMA' || matchesClass(primary, 'EMPATHOGEN')) {
      tips.push('Take breaks to cool down if dancing or in warm environments — overheating is a real risk.');
    }
    if (name === 'Cocaine' || name === 'Crack Cocaine') {
      tips.push('Avoid alcohol with cocaine — cocaethylene formation increases cardiac toxicity.');
    }
    return dedupe(tips);
  }

  if (matchesClass(primary, 'STIMULANT') && primary.categorySlug === 'stimulants') {
    tips.push(`Stay hydrated with ${name} — sip water regularly.`);
    tips.push('Avoid stacking other stimulants or mixing with alcohol.');
    if (scores.cardiovascularScore >= 40) {
      tips.push('Skip intense exercise and monitor heart rate.');
    }
    return dedupe(tips);
  }

  // Psychedelics
  if (matchesClass(primary, 'PSYCHEDELIC') || ['LSD', 'Psilocybin', 'DMT', '1P-LSD', '4-AcO-DMT'].includes(name)) {
    tips.push(`Plan a safe, calm setting for ${duration.min}–${duration.max} hours — psychedelic effects can be unpredictable.`);
    tips.push('Avoid driving entirely until effects have fully worn off.');
    if (scores.cognitiveScore >= 50) {
      tips.push('If anxiety rises, move to a quiet space with a trusted person rather than redosing.');
    }
    tips.push('Cannabis can intensify psychedelic effects — use caution if combining.');
    return dedupe(tips);
  }

  // Dissociatives & sedatives
  if (
    matchesClass(primary, 'DISSOCIATIVE', 'DEPRESSANT', 'BENZODIAZEPINE', 'HYPNOTIC', 'GABAERGIC') ||
    ['Ketamine', 'GHB', 'Alcohol', 'Lorazepam', 'Alprazolam', 'Zolpidem', 'Phenibut'].includes(name)
  ) {
    tips.push(`Do not combine ${name} with alcohol or other CNS depressants.`);
    if (scores.cognitiveScore >= 40) {
      tips.push('Avoid driving or tasks requiring coordination until fully sober.');
    }
    if (name === 'Alcohol' || matchesClass(primary, 'DEPRESSANT')) {
      tips.push('Alternate water between drinks and eat before or while drinking.');
    }
    if (name === 'Ketamine' || matchesClass(primary, 'DISSOCIATIVE')) {
      tips.push('Use a safe seated or lying position — dissociation increases fall and injury risk.');
    }
    return dedupe(tips);
  }

  // Cannabis
  if (matchesClass(primary, 'CANNABINOID') || ['Cannabis', 'THC Edible', 'Delta-8 THC', 'HHC'].includes(name)) {
    if (name === 'THC Edible' || primary.name.includes('Edible')) {
      tips.push('THC edibles have delayed onset — wait at least 2 hours before considering more.');
    }
    tips.push(`Avoid driving while ${name} is active — impairment can last ${duration.max}+ hours.`);
    tips.push('Avoid mixing cannabis with alcohol — nausea and impairment amplify.');
    return dedupe(tips);
  }

  // SSRIs / psych meds
  if (matchesClass(primary, 'SSRI', 'SNRI', 'ANTIDEPRESSANT', 'ANTIPSYCHOTIC')) {
    tips.push(`Take ${name} at the same time each day if prescribed — consistency matters for mood medications.`);
    tips.push('Do not stop abruptly without medical guidance.');
    tips.push('Avoid recreational serotonergic drugs (MDMA, DXM) while on this medication.');
    return dedupe(tips);
  }

  if (matchesClass(primary, 'ANTIBIOTIC')) {
    tips.push(`Complete the full ${name} course even if you feel better.`);
    tips.push('Take probiotics or spaced mineral supplements at least 2 hours apart from antibiotics.');
    return dedupe(tips);
  }

  if (matchesClass(primary, 'VITAMIN', 'MINERAL', 'SUPPLEMENT')) {
    tips.push(`${name} works best taken consistently — effects are gradual, not immediate.`);
    return dedupe(tips);
  }

  // Generic fallback — still names the substance
  if (scores.cognitiveScore >= 40) {
    tips.push(`If ${name} makes you drowsy or foggy, avoid driving until you feel clear.`);
  }
  if (scores.cardiovascularScore >= 40) {
    tips.push(`Take it easy on exercise while ${name} is active — elevated cardiovascular load detected.`);
  }
  if (scores.gastrointestinalScore >= 40) {
    tips.push(`Take ${name} with food or water if you notice stomach sensitivity.`);
  }
  if (duration.max >= 6) {
    tips.push(`Plan lighter activity for about ${Math.round(duration.max)} hours after taking ${name}.`);
  }
  tips.push(`Stay hydrated and note how ${name} affects you over the next few hours.`);

  return dedupe(tips);
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}

export function filterInteractionsForPrimary<T extends { substanceAId: string; substanceBId: string }>(
  interactions: T[],
  primarySubstanceId: string
): T[] {
  return interactions.filter(
    (i) => i.substanceAId === primarySubstanceId || i.substanceBId === primarySubstanceId
  );
}

type RecoveryFocusInput = {
  substanceName: string | null;
  drugClass: string | null;
  categorySlug: string | null;
  weakestSystem: 'cognitive' | 'cardiovascular' | 'liver' | 'sleep';
};

/** Single recovery-screen tip tied to the most recent logged substance. */
export function buildRecoveryFocusTip(input: RecoveryFocusInput): {
  title: string;
  body: string;
  icon: 'bulb-outline' | 'heart-outline' | 'water-outline' | 'moon-outline' | 'medical-outline' | 'leaf-outline' | 'flash-outline';
} {
  const { substanceName, drugClass, categorySlug, weakestSystem } = input;
  const name = substanceName ?? 'your recent intake';
  const cls = (drugClass ?? '').toUpperCase();

  if (cls.includes('NSAID') || ['Ibuprofen', 'Aspirin', 'Naproxen'].includes(substanceName ?? '')) {
    return {
      title: `Recovering from ${name}`,
      body: 'Avoid alcohol today and take meals with plenty of water — NSAIDs can irritate the stomach while active.',
      icon: 'medical-outline',
    };
  }
  if (cls.includes('OPIOID') || substanceName === 'Heroin' || substanceName === 'Kratom') {
    return {
      title: `After ${name}`,
      body: 'Rest, avoid other depressants, and watch for lingering sedation or slowed breathing.',
      icon: 'medical-outline',
    };
  }
  if (cls.includes('STIMULANT') || cls.includes('EMPATHOGEN') || cls.includes('CATHINONE') || categorySlug === 'stimulants') {
    return {
      title: `Coming down from ${name}`,
      body: 'Rehydrate, eat something balanced, and avoid more stimulants or alcohol — your cardiovascular system needs time to settle.',
      icon: 'flash-outline',
    };
  }
  if (cls.includes('PSYCHEDELIC') || categorySlug === 'psychedelics') {
    return {
      title: `Integrating ${name}`,
      body: 'Keep the rest of your day low-stimulation — quiet space, hydration, and sleep help processing.',
      icon: 'leaf-outline',
    };
  }
  if (cls.includes('CANNABINOID') || categorySlug === 'cannabis') {
    return {
      title: `After ${name}`,
      body: 'Effects can linger — avoid driving and give yourself time before redosing, especially with edibles.',
      icon: 'leaf-outline',
    };
  }
  if (cls.includes('DEPRESSANT') || cls.includes('BENZODIAZEPINE') || categorySlug === 'alcohol' || categorySlug === 'sedatives') {
    return {
      title: `Recovering from ${name}`,
      body: 'Do not combine with alcohol or other sedatives. Rest and hydrate until you feel fully clear.',
      icon: 'moon-outline',
    };
  }

  const systemTips = {
    cognitive: {
      title: `Mind recovery after ${name}`,
      body: 'Avoid stacking stimulants or psychedelics. Prioritize sleep and hydration to clear cognitive load.',
      icon: 'bulb-outline' as const,
    },
    cardiovascular: {
      title: `Heart recovery after ${name}`,
      body: 'Skip intense exercise and stimulants today. Monitor heart rate if you have a synced watch.',
      icon: 'heart-outline' as const,
    },
    liver: {
      title: `Liver support after ${name}`,
      body: 'Avoid alcohol and acetaminophen while recovering. Drink water and eat light, whole foods.',
      icon: 'water-outline' as const,
    },
    sleep: {
      title: `Sleep after ${name}`,
      body: 'Cut caffeine after 2 PM, dim screens early, and keep a consistent wind-down routine tonight.',
      icon: 'moon-outline' as const,
    },
  };

  return systemTips[weakestSystem];
}
