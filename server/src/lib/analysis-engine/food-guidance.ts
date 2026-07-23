import type { SubstanceContext } from './types.js';

/** Stable prefix so the analysis UI can split Food & timing from general tips. */
export const FOOD_TIP_PREFIX = 'Food · ';

function cls(primary: SubstanceContext): string {
  return (primary.drugClass ?? '').toUpperCase();
}

function matchesClass(primary: SubstanceContext, ...classes: string[]): boolean {
  const drugClass = cls(primary);
  return classes.some((c) => drugClass.includes(c));
}

function tip(text: string): string {
  return text.startsWith(FOOD_TIP_PREFIX) ? text : `${FOOD_TIP_PREFIX}${text}`;
}

/**
 * Food, drink, and timing guidance for the logged medication/substance.
 * Deterministic — always merged into analysis even when AI writes the summary.
 */
export function buildFoodTimingTips(primary: SubstanceContext): string[] {
  const name = primary.name;
  const tips: string[] = [];
  const n = name.toLowerCase();

  // —— Antibiotics (dairy / minerals / food) ——
  if (
    matchesClass(primary, 'ANTIBIOTIC') ||
    ['Amoxicillin', 'Doxycycline', 'Azithromycin', 'Ciprofloxacin', 'Levofloxacin', 'Penicillin'].includes(name)
  ) {
    if (
      matchesClass(primary, 'TETRACYCLINE') ||
      ['Doxycycline', 'Minocycline', 'Tetracycline'].includes(name) ||
      n.includes('doxycycline') ||
      n.includes('ciprofloxacin') ||
      n.includes('levofloxacin')
    ) {
      tips.push(
        tip(
          `Avoid milk, cheese, yogurt, and calcium-fortified drinks within 2 hours of ${name} — dairy can block absorption.`
        )
      );
      tips.push(
        tip(
          `Space iron, zinc, magnesium, and antacids at least 2 hours from ${name}.`
        )
      );
    } else if (name === 'Amoxicillin' || n.includes('amoxicillin')) {
      tips.push(
        tip(
          `${name} can be taken with or without food; a light snack may ease stomach upset.`
        )
      );
      tips.push(
        tip(
          `If you take calcium, iron, or magnesium supplements, separate them by about 2 hours from ${name}.`
        )
      );
    } else {
      tips.push(
        tip(
          `Check whether ${name} should be with food; many antibiotics absorb better away from dairy and mineral supplements.`
        )
      );
      tips.push(
        tip(
          `Avoid taking ${name} with milk or antacids unless your label says otherwise.`
        )
      );
    }
    return dedupe(tips);
  }

  // —— Thyroid ——
  if (matchesClass(primary, 'HORMONE') && (n.includes('levothyroxine') || n.includes('thyroid'))) {
    tips.push(
      tip(
        `Take ${name} on an empty stomach with water, 30–60 minutes before breakfast.`
      )
    );
    tips.push(
      tip(
        `Avoid coffee, milk, soy, and calcium/iron supplements within 4 hours of ${name} — they reduce absorption.`
      )
    );
    return dedupe(tips);
  }

  // —— Iron ——
  if (matchesClass(primary, 'MINERAL') && (name === 'Iron' || n.includes('iron'))) {
    tips.push(
      tip(
        `Take ${name} away from milk, tea, coffee, and calcium — they reduce iron absorption.`
      )
    );
    tips.push(
      tip(
        `Vitamin C food or juice with ${name} can help absorption; avoid taking it with dairy meals.`
      )
    );
    return dedupe(tips);
  }

  // —— Magnesium / zinc / calcium ——
  if (matchesClass(primary, 'MINERAL') || ['Magnesium', 'Zinc', 'Calcium'].includes(name)) {
    tips.push(
      tip(
        `${name} is often easier on the stomach with food; keep it 2+ hours from antibiotics or thyroid meds.`
      )
    );
    return dedupe(tips);
  }

  // —— Metformin / diabetes ——
  if (matchesClass(primary, 'ANTIDIABETIC') || name === 'Metformin') {
    tips.push(
      tip(
        `Take ${name} with meals to reduce stomach upset and help steady blood sugar.`
      )
    );
    tips.push(
      tip(
        `Limit heavy alcohol with ${name} — risk of low blood sugar and other side effects rises.`
      )
    );
    return dedupe(tips);
  }

  // —— Statins ——
  if (matchesClass(primary, 'STATIN') || n.includes('statin') || name === 'Atorvastatin') {
    tips.push(
      tip(
        `Avoid grapefruit and grapefruit juice with ${name} — it can raise drug levels and side-effect risk.`
      )
    );
    tips.push(
      tip(
        `${name} can be taken with or without food; keep alcohol modest while on a statin.`
      )
    );
    return dedupe(tips);
  }

  // —— NSAIDs ——
  if (matchesClass(primary, 'NSAID') || ['Ibuprofen', 'Aspirin', 'Naproxen'].includes(name)) {
    tips.push(
      tip(
        `Take ${name} with food or milk if your stomach is sensitive — empty stomach raises irritation risk.`
      )
    );
    tips.push(
      tip(
        `Avoid alcohol while ${name} is active — NSAIDs plus alcohol increase stomach bleeding risk.`
      )
    );
    return dedupe(tips);
  }

  // —— Paracetamol ——
  if (name === 'Paracetamol' || n.includes('acetaminophen') || matchesClass(primary, 'ANALGESIC')) {
    tips.push(
      tip(
        `${name} can be taken with or without food; take with water.`
      )
    );
    tips.push(
      tip(
        `Do not drink alcohol with ${name} — combined liver stress is a real risk.`
      )
    );
    return dedupe(tips);
  }

  // —— Prednisone / steroids ——
  if (matchesClass(primary, 'CORTICOSTEROID') || name === 'Prednisone') {
    tips.push(
      tip(
        `Take ${name} with food or milk to protect your stomach.`
      )
    );
    tips.push(
      tip(
        `Limit high-salt snacks and alcohol while on ${name} if your clinician advised dietary caution.`
      )
    );
    return dedupe(tips);
  }

  // —— PPIs ——
  if (matchesClass(primary, 'PPI') || name === 'Omeprazole') {
    tips.push(
      tip(
        `Take ${name} before a meal (often 30–60 minutes before breakfast) for best effect.`
      )
    );
    return dedupe(tips);
  }

  // —— Bisphosphonates-ish / empty stomach hormones already covered ——

  // —— Stimulants ——
  if (
    matchesClass(primary, 'STIMULANT', 'NDRI') ||
    primary.categorySlug === 'stimulants' ||
    ['Methylphenidate', 'Lisdexamfetamine', 'Modafinil'].includes(name)
  ) {
    tips.push(
      tip(
        `Eat a balanced meal with ${name} when possible — stimulants can suppress appetite.`
      )
    );
    tips.push(
      tip(
        `Limit extra caffeine (coffee, energy drinks) with ${name} — both raise heart rate and jitteriness.`
      )
    );
    return dedupe(tips);
  }

  // —— SSRIs ——
  if (matchesClass(primary, 'SSRI', 'SNRI', 'ANTIDEPRESSANT')) {
    tips.push(
      tip(
        `${name} can usually be taken with food if it upsets your stomach; stay consistent day to day.`
      )
    );
    tips.push(
      tip(
        `Avoid heavy alcohol with ${name} — it can worsen sedation and mood side effects.`
      )
    );
    return dedupe(tips);
  }

  // —— Opioids ——
  if (matchesClass(primary, 'OPIOID')) {
    tips.push(
      tip(
        `Take ${name} with a light snack if nauseated; avoid alcohol entirely.`
      )
    );
    return dedupe(tips);
  }

  // —— Alcohol ——
  if (name === 'Alcohol' || primary.categorySlug === 'alcohol') {
    tips.push(
      tip(
        `Eat before or while drinking — food slows absorption and reduces peak intoxication.`
      )
    );
    tips.push(
      tip(
        `Alternate water with alcoholic drinks; avoid mixing with painkillers or sedatives.`
      )
    );
    return dedupe(tips);
  }

  // —— Cannabis edibles ——
  if (name.includes('Edible') || (matchesClass(primary, 'CANNABINOID') && n.includes('edible'))) {
    tips.push(
      tip(
        `Edibles hit harder on an empty stomach — start low and wait at least 2 hours before more.`
      )
    );
    return dedupe(tips);
  }

  // —— Sildenafil ——
  if (matchesClass(primary, 'PDE5') || name === 'Sildenafil') {
    tips.push(
      tip(
        `Avoid heavy high-fat meals right before ${name} — they can delay onset.`
      )
    );
    tips.push(
      tip(
        `Do not take ${name} with grapefruit juice; never combine with nitrate medicines.`
      )
    );
    return dedupe(tips);
  }

  // —— Lithium ——
  if (name === 'Lithium' || matchesClass(primary, 'MOOD_STABILIZER')) {
    tips.push(
      tip(
        `Keep salt and fluid intake steady with ${name}; sudden diet changes can affect levels.`
      )
    );
    tips.push(
      tip(
        `Avoid crash diets and heavy alcohol with ${name} unless your clinician says otherwise.`
      )
    );
    return dedupe(tips);
  }

  // —— ACE inhibitors ——
  if (matchesClass(primary, 'ACE_INHIBITOR') || name === 'Lisinopril') {
    tips.push(
      tip(
        `${name} can be taken with or without food; limit high-potassium salt substitutes unless advised.`
      )
    );
    return dedupe(tips);
  }

  // —— Birth control ——
  if (n.includes('birth control') || n.includes('contracept')) {
    tips.push(
      tip(
        `Take ${name} at the same time daily; vomiting or severe diarrhea shortly after a dose may reduce protection — follow pack guidance.`
      )
    );
    return dedupe(tips);
  }

  // —— Vitamin C / fat-soluble vitamins ——
  if (name === 'Vitamin D3' || n.includes('vitamin d') || n.includes('vitamin a') || n.includes('vitamin e') || n.includes('vitamin k')) {
    tips.push(
      tip(
        `Take ${name} with a meal that includes some fat for better absorption.`
      )
    );
    return dedupe(tips);
  }

  if (name === 'Vitamin C') {
    tips.push(
      tip(
        `${name} can be taken with or without food; high doses on an empty stomach may cause stomach upset.`
      )
    );
    return dedupe(tips);
  }

  return tips;
}

export function isFoodTimingTip(text: string): boolean {
  return text.startsWith(FOOD_TIP_PREFIX);
}

export function displayFoodTip(text: string): string {
  return text.startsWith(FOOD_TIP_PREFIX) ? text.slice(FOOD_TIP_PREFIX.length) : text;
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}
