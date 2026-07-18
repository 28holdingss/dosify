import type { InteractionRule, RiskLevel } from '@prisma/client';
import type { DetectedInteraction, SubstanceContext } from './types.js';
import { riskLevelToScore } from './types.js';

type ActiveSubstance = SubstanceContext & { substanceId: string };

function ruleMatches(
  rule: InteractionRule,
  a: ActiveSubstance,
  b: ActiveSubstance
): boolean {
  const nameMatch =
    (rule.substanceA === a.name && rule.substanceB === b.name) ||
    (rule.substanceA === b.name && rule.substanceB === a.name);

  if (nameMatch) return true;

  const classMatch =
    (rule.substanceAClass &&
      rule.substanceB &&
      ((rule.substanceAClass === a.drugClass && rule.substanceB === b.name) ||
        (rule.substanceAClass === b.drugClass && rule.substanceB === a.name))) ||
    (rule.substanceBClass &&
      rule.substanceA &&
      ((rule.substanceBClass === b.drugClass && rule.substanceA === a.name) ||
        (rule.substanceBClass === a.drugClass && rule.substanceA === b.name)));

  const dualClassMatch =
    rule.substanceAClass &&
    rule.substanceBClass &&
    a.drugClass &&
    b.drugClass &&
    ((rule.substanceAClass === a.drugClass && rule.substanceBClass === b.drugClass) ||
      (rule.substanceAClass === b.drugClass && rule.substanceBClass === a.drugClass));

  return Boolean(classMatch || dualClassMatch);
}

export function detectInteractions(
  rules: InteractionRule[],
  active: ActiveSubstance[]
): DetectedInteraction[] {
  const found: DetectedInteraction[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];

      for (const rule of rules) {
        if (!ruleMatches(rule, a, b)) continue;

        const key = [a.substanceId, b.substanceId].sort().join(':');
        if (seen.has(key)) continue;
        seen.add(key);

        found.push({
          substanceAId: a.substanceId,
          substanceBId: b.substanceId,
          substanceAName: a.name,
          substanceBName: b.name,
          riskLevel: rule.riskLevel,
          title: rule.title,
          description: rule.description,
          advice: rule.advice ?? undefined,
          source: rule.source ?? undefined,
        });
      }
    }
  }

  return found.sort(
    (x, y) => riskLevelToScore(y.riskLevel) - riskLevelToScore(x.riskLevel)
  );
}

export function interactionRiskScore(interactions: DetectedInteraction[]): number {
  if (interactions.length === 0) return 10;
  const max = Math.max(...interactions.map((i) => riskLevelToScore(i.riskLevel)));
  const countBonus = Math.min(15, (interactions.length - 1) * 5);
  return Math.min(100, max + countBonus);
}

export function highestRiskLevel(
  interactions: DetectedInteraction[]
): RiskLevel | null {
  if (interactions.length === 0) return null;
  if (interactions.some((i) => i.riskLevel === 'HIGH')) return 'HIGH';
  if (interactions.some((i) => i.riskLevel === 'MODERATE')) return 'MODERATE';
  return 'LOW';
}
