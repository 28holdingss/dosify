import type { RiskLevel, Substance, SubstanceProfile } from '@prisma/client';
import { chatCompletion } from './ai/chat.js';
import {
  detectInteractions,
  highestRiskLevel,
  interactionRiskScore,
} from './analysis-engine/interactions.js';
import { ENGINE_VERSION } from './analysis-engine/types.js';
import type { DetectedInteraction } from './analysis-engine/types.js';
import { prisma } from './prisma.js';

export const INTERACTION_CHECK_DISCLAIMER =
  'Informational only — not medical advice. Missing findings do not mean a combination is without risk. Talk with a clinician or pharmacist before starting, stopping, or combining substances.';

const MAX_CONTEXT_SUBSTANCES = 40;

export type ProposedRef = {
  substanceId: string | null;
  substanceName: string;
};

export type ContextHealth = {
  allergies: string[];
  conditions: string[];
};

export type PredictorFinding = {
  substanceAId: string | null;
  substanceBId: string | null;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  advice: string | null;
  source: string | null;
};

export type PredictorResult = {
  proposed: ProposedRef[];
  contextItems: Array<ProposedRef & { role: 'CABINET' | 'RECENT_INTAKE' }>;
  context: {
    cabinetCount: number;
    recentIntakeCount: number;
    allergies: string[];
    conditions: string[];
  };
  findings: PredictorFinding[];
  riskScore: number;
  highestRisk: RiskLevel | null;
  disclaimer: string;
  aiRephrased: boolean;
  engineVersion: string;
};

type SubstanceWithProfile = Substance & {
  profile: SubstanceProfile | null;
  category: { slug: string } | null;
};

function defaultActive(s: SubstanceWithProfile) {
  const p = s.profile;
  return {
    substanceId: s.id,
    id: s.id,
    name: s.name,
    dose: 0,
    unit: s.defaultUnit,
    minDose: s.minDose,
    maxDose: s.maxDose,
    drugClass: p?.drugClass ?? null,
    categorySlug: s.category?.slug ?? null,
    halfLifeHours: p?.halfLifeHours ?? 4,
    cognitiveImpact: p?.cognitiveImpact ?? 0.3,
    cardiovascularImpact: p?.cardiovascularImpact ?? 0.2,
    gastrointestinalImpact: p?.gastrointestinalImpact ?? 0.2,
    liverImpact: p?.liverImpact ?? 0.1,
    kidneyImpact: p?.kidneyImpact ?? 0.1,
    respiratoryImpact: p?.respiratoryImpact ?? 0.1,
    typicalDurationMinHours: p?.typicalDurationMinHours ?? null,
    typicalDurationMaxHours: p?.typicalDurationMaxHours ?? null,
  };
}

function uniqStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const trimmed = v.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function splitCsv(value: string | null | undefined): string[] {
  if (!value) return [];
  return uniqStrings(value.split(/[,;/|]+|\band\b/i));
}

function namesOverlap(a: string, b: string): boolean {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

/** Resolve free-text to catalog substances (bounded). */
export async function resolveFreeTextSubstances(freeText: string): Promise<SubstanceWithProfile[]> {
  const q = freeText.trim();
  if (!q) return [];

  const exact = await prisma.substance.findMany({
    where: { name: { equals: q, mode: 'insensitive' } },
    include: { profile: true, category: true },
    take: 5,
  });
  if (exact.length > 0) return exact;

  return prisma.substance.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    },
    include: { profile: true, category: true },
    take: 5,
  });
}

function allergyFindings(
  proposed: SubstanceWithProfile[],
  allergies: string[]
): PredictorFinding[] {
  const findings: PredictorFinding[] = [];
  for (const substance of proposed) {
    for (const allergen of allergies) {
      if (!namesOverlap(substance.name, allergen)) continue;
      findings.push({
        substanceAId: substance.id,
        substanceBId: null,
        riskLevel: 'HIGH',
        title: `Possible allergy match: ${substance.name}`,
        description: `Your profile lists an allergy to "${allergen}", which may overlap with ${substance.name}. Combining or taking this substance could trigger a reaction.`,
        advice:
          'Do not take this substance until a clinician or pharmacist confirms it is appropriate for you.',
        source: 'Health profile allergy check',
      });
    }
  }
  return findings;
}

function conditionFindings(
  proposed: SubstanceWithProfile[],
  conditions: string[]
): PredictorFinding[] {
  const findings: PredictorFinding[] = [];
  const joined = conditions.join(' ').toLowerCase();
  if (!joined) return findings;

  const liverConcern = /liver|hepatic|cirrhosis|hepatitis/.test(joined);
  const heartConcern = /heart|cardiac|hypertension|blood pressure|arrhythmia/.test(joined);
  const kidneyConcern = /kidney|renal|ckd|nephro/.test(joined);

  for (const substance of proposed) {
    const name = substance.name;
    const liverImpact = substance.profile?.liverImpact ?? 0.1;
    const cardioImpact = substance.profile?.cardiovascularImpact ?? 0.2;

    if (liverConcern && liverImpact >= 0.2) {
      findings.push({
        substanceAId: substance.id,
        substanceBId: null,
        riskLevel: 'MODERATE',
        title: `Liver-condition caution with ${name}`,
        description: `Your profile notes a liver-related condition. ${name} may place additional stress on hepatic pathways.`,
        advice: 'Ask a clinician about dose adjustments or alternatives before taking.',
        source: 'Health profile condition check',
      });
    }

    if (heartConcern && cardioImpact >= 0.25) {
      findings.push({
        substanceAId: substance.id,
        substanceBId: null,
        riskLevel: 'MODERATE',
        title: `Cardiovascular caution with ${name}`,
        description: `Your profile notes a heart-related condition. ${name} may affect cardiovascular load.`,
        advice: 'Review this combination with a clinician, especially if you take heart medications.',
        source: 'Health profile condition check',
      });
    }

    if (kidneyConcern && /ibuprofen|naproxen|nsaid|aspirin/i.test(name)) {
      findings.push({
        substanceAId: substance.id,
        substanceBId: null,
        riskLevel: 'MODERATE',
        title: `Kidney-condition caution with ${name}`,
        description: `NSAID-class substances like ${name} can worsen kidney stress in people with renal conditions.`,
        advice: 'Prefer clinician-approved alternatives and avoid self-escalating doses.',
        source: 'Health profile condition check',
      });
    }
  }

  return findings;
}

/**
 * Optionally rephrase finding copy via AI. Risk levels are never changed.
 */
export async function rephraseFindings(
  findings: PredictorFinding[]
): Promise<{ findings: PredictorFinding[]; aiRephrased: boolean }> {
  if (findings.length === 0) return { findings, aiRephrased: false };

  const payload = findings.map((f, index) => ({
    index,
    riskLevel: f.riskLevel,
    title: f.title,
    description: f.description,
    advice: f.advice,
  }));

  const prompt = `You rephrase substance-interaction findings for a health tracking app.
Return JSON only:
{ "items": [{ "index": 0, "title": "...", "description": "...", "advice": "..." }] }

Rules:
- Keep the same meaning and severity. Do NOT change or imply a different risk level.
- Never say a combination is "safe", "harmless", or "fine to take".
- Stay concise and cautious. Not medical advice.
- Include every index from the input.

Findings:
${JSON.stringify(payload)}`;

  const result = await chatCompletion({
    temperature: 0.2,
    jsonMode: true,
    messages: [
      {
        role: 'system',
        content:
          'Respond with JSON only. Rephrase wording; never alter clinical severity or invent new risks.',
      },
      { role: 'user', content: prompt },
    ],
  });

  if (!result) return { findings, aiRephrased: false };

  try {
    const parsed = JSON.parse(result.content) as {
      items?: Array<{
        index?: number;
        title?: string;
        description?: string;
        advice?: string | null;
      }>;
    };
    if (!Array.isArray(parsed.items)) return { findings, aiRephrased: false };

    const next = findings.map((f) => ({ ...f }));
    for (const item of parsed.items) {
      if (typeof item.index !== 'number' || item.index < 0 || item.index >= next.length) continue;
      const target = next[item.index];
      if (item.title?.trim()) target.title = item.title.trim().slice(0, 200);
      if (item.description?.trim()) target.description = item.description.trim().slice(0, 2000);
      if (item.advice !== undefined) {
        target.advice = item.advice?.trim() ? item.advice.trim().slice(0, 1000) : null;
      }
      // riskLevel intentionally untouched
    }
    return { findings: next, aiRephrased: true };
  } catch {
    return { findings, aiRephrased: false };
  }
}

function dedupeFindings(findings: PredictorFinding[]): PredictorFinding[] {
  const seen = new Set<string>();
  const out: PredictorFinding[] = [];
  for (const f of findings) {
    const pair = [f.substanceAId ?? '', f.substanceBId ?? ''].sort().join(':');
    const key = `${f.riskLevel}|${f.title.toLowerCase()}|${pair}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

export async function runInteractionPredictor(input: {
  userId: string;
  proposedSubstanceIds: string[];
  freeText?: string | null;
  includeCabinet: boolean;
  includeRecentIntakes: boolean;
  useAiRephrase?: boolean;
}): Promise<PredictorResult> {
  const {
    userId,
    proposedSubstanceIds,
    freeText,
    includeCabinet,
    includeRecentIntakes,
    useAiRephrase = true,
  } = input;

  const [healthProfile, allergyRows, conditionRows, cabinetItems, recentIntakes, freeTextMatches] =
    await Promise.all([
      prisma.healthProfile.findUnique({ where: { userId } }),
      prisma.allergy.findMany({ where: { userId }, take: 50, orderBy: { createdAt: 'desc' } }),
      prisma.condition.findMany({
        where: { userId, status: 'ACTIVE' },
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
      includeCabinet
        ? prisma.cabinetItem.findMany({
            where: { userId, active: true },
            include: { substance: { include: { profile: true, category: true } } },
            take: 100,
            orderBy: { updatedAt: 'desc' },
          })
        : Promise.resolve([]),
      includeRecentIntakes
        ? prisma.intakeLog.findMany({
            where: {
              userId,
              takenAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
            },
            include: { substance: { include: { profile: true, category: true } } },
            take: 100,
            orderBy: { takenAt: 'desc' },
          })
        : Promise.resolve([]),
      freeText?.trim() ? resolveFreeTextSubstances(freeText) : Promise.resolve([]),
    ]);

  const allergies = uniqStrings([
    ...allergyRows.map((a) => a.allergen),
    ...splitCsv(healthProfile?.allergies),
  ]);
  const conditions = uniqStrings([
    ...conditionRows.map((c) => c.name),
    ...splitCsv(healthProfile?.medicalConditions),
  ]);

  const proposedIds = [...new Set(proposedSubstanceIds)];
  const proposedFromIds = await prisma.substance.findMany({
    where: { id: { in: proposedIds } },
    include: { profile: true, category: true },
  });

  const proposedById = new Map<string, SubstanceWithProfile>();
  for (const s of proposedFromIds) proposedById.set(s.id, s);
  for (const s of freeTextMatches) proposedById.set(s.id, s);

  const proposed = [...proposedById.values()];
  const proposedRefs: ProposedRef[] = proposed.map((s) => ({
    substanceId: s.id,
    substanceName: s.name,
  }));

  // Keep unmatched free text visible in the check even if not in the catalog.
  if (freeText?.trim() && freeTextMatches.length === 0) {
    proposedRefs.push({ substanceId: null, substanceName: freeText.trim() });
  }

  const contextItems: Array<ProposedRef & { role: 'CABINET' | 'RECENT_INTAKE' }> = [];
  const activeMap = new Map<string, ReturnType<typeof defaultActive>>();

  for (const s of proposed) {
    activeMap.set(s.id, defaultActive(s));
  }

  for (const item of cabinetItems) {
    contextItems.push({
      substanceId: item.substanceId,
      substanceName: item.displayName?.trim() || item.substance.name,
      role: 'CABINET',
    });
    if (!activeMap.has(item.substanceId)) {
      activeMap.set(item.substanceId, defaultActive(item.substance as SubstanceWithProfile));
    }
  }

  for (const intake of recentIntakes) {
    contextItems.push({
      substanceId: intake.substanceId,
      substanceName: intake.substance.name,
      role: 'RECENT_INTAKE',
    });
    if (!activeMap.has(intake.substanceId)) {
      activeMap.set(intake.substanceId, defaultActive(intake.substance as SubstanceWithProfile));
    }
  }

  // Cap pair-wise explosion while keeping proposed substances preferentially.
  let active = [...activeMap.values()];
  if (active.length > MAX_CONTEXT_SUBSTANCES) {
    const proposedSet = new Set(proposed.map((s) => s.id));
    const preferred = active.filter((a) => proposedSet.has(a.substanceId));
    const rest = active.filter((a) => !proposedSet.has(a.substanceId));
    active = [...preferred, ...rest].slice(0, MAX_CONTEXT_SUBSTANCES);
  }

  const rules = await prisma.interactionRule.findMany();
  const detected = detectInteractions(rules, active);

  // Prefer findings that involve at least one proposed substance when proposals exist.
  const proposedSet = new Set(proposed.map((s) => s.id));
  const relevantDetected: DetectedInteraction[] =
    proposedSet.size === 0
      ? detected
      : detected.filter(
          (d) => proposedSet.has(d.substanceAId) || proposedSet.has(d.substanceBId)
        );

  let findings: PredictorFinding[] = [
    ...relevantDetected.map((d) => ({
      substanceAId: d.substanceAId,
      substanceBId: d.substanceBId,
      riskLevel: d.riskLevel,
      title: d.title,
      description: d.description,
      advice: d.advice ?? null,
      source: d.source ?? null,
    })),
    ...allergyFindings(proposed, allergies),
    ...conditionFindings(proposed, conditions),
  ];

  findings = dedupeFindings(findings).slice(0, 50);

  let aiRephrased = false;
  if (useAiRephrase && findings.length > 0) {
    const rephrased = await rephraseFindings(findings);
    findings = rephrased.findings;
    aiRephrased = rephrased.aiRephrased;
  }

  const riskScore = interactionRiskScore(
    findings.map((f) => ({
      substanceAId: f.substanceAId ?? '',
      substanceBId: f.substanceBId ?? '',
      substanceAName: '',
      substanceBName: '',
      riskLevel: f.riskLevel,
      title: f.title,
      description: f.description,
      advice: f.advice ?? undefined,
      source: f.source ?? undefined,
    }))
  );
  const highestRisk = highestRiskLevel(
    findings.map((f) => ({
      substanceAId: f.substanceAId ?? '',
      substanceBId: f.substanceBId ?? '',
      substanceAName: '',
      substanceBName: '',
      riskLevel: f.riskLevel,
      title: f.title,
      description: f.description,
    }))
  );

  return {
    proposed: proposedRefs,
    contextItems,
    context: {
      cabinetCount: cabinetItems.length,
      recentIntakeCount: recentIntakes.length,
      allergies,
      conditions,
    },
    findings,
    riskScore,
    highestRisk,
    disclaimer: INTERACTION_CHECK_DISCLAIMER,
    aiRephrased,
    engineVersion: ENGINE_VERSION,
  };
}
