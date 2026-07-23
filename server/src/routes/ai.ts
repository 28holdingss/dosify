import { Hono } from 'hono';
import { z } from 'zod';
import { chatCompletion, hasAiProvider } from '../lib/ai/chat.js';
import { researchExternalSources } from '../lib/ai/web-research.js';
import { resolveUserId } from '../lib/auth.js';
import { getEntitlement } from '../lib/entitlements.js';
import { prisma } from '../lib/prisma.js';

export const aiRoutes = new Hono();

const FREE_DAILY_LIMIT = 2;
const HISTORY_LIMIT = 12;
const MAX_MESSAGE_LENGTH = 2000;

const DISCLAIMER =
  'Informational only — not medical advice. Dosify AI uses your logged context, catalog knowledge, and cited public sources; it can be incomplete or wrong. Do not change medications based on this chat alone. Seek a licensed clinician for personal medical decisions.';

export type AiSource = {
  id: string;
  kind:
    | 'interaction_rule'
    | 'catalog_profile'
    | 'user_intake'
    | 'user_cabinet'
    | 'health_profile'
    | 'web';
  title: string;
  detail: string | null;
  citation: string | null;
  url: string | null;
};

const chatSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
      })
    )
    .max(HISTORY_LIMIT)
    .optional(),
});

function startOfUtcDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function countUserQuestionsToday(userId: string): Promise<number> {
  return prisma.aiChatMessage.count({
    where: {
      userId,
      role: 'user',
      createdAt: { gte: startOfUtcDay() },
    },
  });
}

async function buildUsage(userId: string) {
  const entitlement = await getEntitlement(userId);
  const usedToday = await countUserQuestionsToday(userId);
  const isPremium = entitlement.isPremium;
  const limit = isPremium ? null : FREE_DAILY_LIMIT;
  const remaining = isPremium ? null : Math.max(0, FREE_DAILY_LIMIT - usedToday);

  return {
    usedToday,
    limit,
    remaining,
    isPremium,
    aiAvailable: hasAiProvider(),
    freeDailyLimit: FREE_DAILY_LIMIT,
  };
}

function extractCandidateNames(message: string, knownNames: string[]): string[] {
  const lower = message.toLowerCase();
  const fromKnown = knownNames.filter((name) => lower.includes(name.toLowerCase()));
  const tokens = message
    .split(/[^a-zA-Z0-9+.-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);
  return [...new Set([...fromKnown, ...tokens])].slice(0, 12);
}

async function buildKnowledgeBundle(userId: string, message: string) {
  const sources: AiSource[] = [];

  const [user, intakes, cabinet] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        healthProfile: {
          select: {
            age: true,
            weightKg: true,
            medicalConditions: true,
            allergies: true,
          },
        },
        healthGoals: { select: { goal: true }, take: 8 },
      },
    }),
    prisma.intakeLog.findMany({
      where: { userId },
      orderBy: { takenAt: 'desc' },
      take: 8,
      include: {
        substance: {
          select: {
            id: true,
            name: true,
            defaultUnit: true,
            category: { select: { name: true } },
            profile: {
              select: {
                drugClass: true,
                halfLifeHours: true,
                typicalDurationMinHours: true,
                typicalDurationMaxHours: true,
              },
            },
          },
        },
      },
    }),
    prisma.cabinetItem.findMany({
      where: { userId, active: true },
      take: 20,
      include: {
        substance: {
          select: {
            id: true,
            name: true,
            category: { select: { name: true } },
            profile: { select: { drugClass: true, halfLifeHours: true } },
          },
        },
      },
    }),
  ]);

  const profile = user?.healthProfile;
  if (profile && (profile.allergies || profile.medicalConditions || profile.age != null)) {
    sources.push({
      id: 'health-profile',
      kind: 'health_profile',
      title: 'Your health profile',
      detail: [
        profile.age != null ? `Age ${profile.age}` : null,
        profile.allergies ? `Allergies: ${profile.allergies}` : null,
        profile.medicalConditions ? `Conditions: ${profile.medicalConditions}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      citation: 'Dosify account profile',
      url: null,
    });
  }

  for (const intake of intakes) {
    sources.push({
      id: `intake-${intake.id}`,
      kind: 'user_intake',
      title: `Logged intake · ${intake.substance.name}`,
      detail: `${intake.dose} ${intake.unit || intake.substance.defaultUnit} · ${intake.takenAt.toISOString()}`,
      citation: 'Your Dosify intake log',
      url: null,
    });
  }

  for (const item of cabinet) {
    const name = item.displayName ?? item.substance.name;
    sources.push({
      id: `cabinet-${item.id}`,
      kind: 'user_cabinet',
      title: `Health Cabinet · ${name}`,
      detail: item.substance.category?.name
        ? `${item.substance.category.name}${item.substance.profile?.drugClass ? ` · ${item.substance.profile.drugClass}` : ''}`
        : null,
      citation: 'Your Dosify Health Cabinet',
      url: null,
    });
  }

  const substanceNames = [
    ...intakes.map((i) => i.substance.name),
    ...cabinet.map((c) => c.displayName ?? c.substance.name),
  ];
  const candidates = extractCandidateNames(message, substanceNames);

  const catalogSubstances =
    candidates.length > 0
      ? await prisma.substance.findMany({
          where: {
            OR: candidates.flatMap((q) => [
              { name: { equals: q, mode: 'insensitive' as const } },
              { name: { contains: q, mode: 'insensitive' as const } },
            ]),
          },
          take: 8,
          include: {
            category: true,
            profile: true,
          },
        })
      : [];

  // Prefer substances already on the user, then catalog matches from the question.
  const profileSubstanceIds = new Set<string>();
  for (const intake of intakes) {
    const p = intake.substance.profile;
    if (!p || profileSubstanceIds.has(intake.substance.id)) continue;
    profileSubstanceIds.add(intake.substance.id);
    sources.push({
      id: `profile-${intake.substance.id}`,
      kind: 'catalog_profile',
      title: `Catalog profile · ${intake.substance.name}`,
      detail: [
        p.drugClass ? `Class: ${p.drugClass}` : null,
        p.halfLifeHours != null ? `Half-life ~${p.halfLifeHours}h` : null,
        p.typicalDurationMinHours != null && p.typicalDurationMaxHours != null
          ? `Typical window ${p.typicalDurationMinHours}–${p.typicalDurationMaxHours}h`
          : null,
        intake.substance.category?.name ? `Category: ${intake.substance.category.name}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      citation: 'Dosify substance catalog',
      url: null,
    });
  }

  for (const substance of catalogSubstances) {
    if (profileSubstanceIds.has(substance.id)) continue;
    profileSubstanceIds.add(substance.id);
    const p = substance.profile;
    sources.push({
      id: `profile-${substance.id}`,
      kind: 'catalog_profile',
      title: `Catalog profile · ${substance.name}`,
      detail: [
        p?.drugClass ? `Class: ${p.drugClass}` : null,
        p?.halfLifeHours != null ? `Half-life ~${p.halfLifeHours}h` : null,
        substance.category?.name ? `Category: ${substance.category.name}` : null,
        substance.description?.slice(0, 140) ?? null,
      ]
        .filter(Boolean)
        .join(' · '),
      citation: 'Dosify substance catalog',
      url: null,
    });
  }

  const namesForRules = [
    ...new Set([
      ...substanceNames,
      ...catalogSubstances.map((s) => s.name),
      ...catalogSubstances.map((s) => s.profile?.drugClass).filter(Boolean),
    ]),
  ].filter((n): n is string => Boolean(n));

  if (namesForRules.length > 0) {
    const rules = await prisma.interactionRule.findMany({
      where: {
        OR: namesForRules.flatMap((name) => [
          { substanceA: { equals: name, mode: 'insensitive' as const } },
          { substanceB: { equals: name, mode: 'insensitive' as const } },
          { substanceAClass: { equals: name, mode: 'insensitive' as const } },
          { substanceBClass: { equals: name, mode: 'insensitive' as const } },
          { substanceA: { contains: name, mode: 'insensitive' as const } },
          { substanceB: { contains: name, mode: 'insensitive' as const } },
        ]),
      },
      orderBy: [{ riskLevel: 'desc' }, { title: 'asc' }],
      take: 12,
    });

    for (const rule of rules) {
      sources.push({
        id: `rule-${rule.id}`,
        kind: 'interaction_rule',
        title: rule.title,
        detail: [rule.description, rule.advice].filter(Boolean).join(' '),
        citation: rule.source ?? 'Dosify interaction rule library',
        url: null,
      });
    }
  }

  const webHits = await researchExternalSources({
    message,
    substanceHints: substanceNames,
  });
  for (const hit of webHits) {
    sources.push({
      id: hit.id,
      kind: 'web',
      title: hit.title,
      detail: hit.detail,
      citation: hit.citation,
      url: hit.url,
    });
  }

  // Cap payload size while keeping variety — web sources first for analysis trust.
  const prioritized = [
    ...sources.filter((s) => s.kind === 'web'),
    ...sources.filter((s) => s.kind === 'interaction_rule'),
    ...sources.filter((s) => s.kind === 'catalog_profile'),
    ...sources.filter((s) => s.kind === 'user_intake'),
    ...sources.filter((s) => s.kind === 'user_cabinet'),
    ...sources.filter((s) => s.kind === 'health_profile'),
  ].slice(0, 20);

  const context = {
    name: user?.name ?? null,
    age: profile?.age ?? null,
    weightKg: profile?.weightKg ?? null,
    medicalConditions: profile?.medicalConditions ?? null,
    allergies: profile?.allergies ?? null,
    goals: user?.healthGoals.map((g) => g.goal) ?? [],
    recentIntakes: intakes.map((i) => ({
      substance: i.substance.name,
      dose: `${i.dose} ${i.unit || i.substance.defaultUnit}`,
      takenAt: i.takenAt.toISOString(),
    })),
    cabinet: cabinet.map((c) => c.displayName ?? c.substance.name),
    sources: prioritized.map((s) => ({
      id: s.id,
      kind: s.kind,
      title: s.title,
      detail: s.detail,
      citation: s.citation,
      url: s.url,
    })),
  };

  return { context, sources: prioritized };
}

function parseAiJson(content: string): { reply: string; citedSourceIds: string[] } | null {
  try {
    const parsed = JSON.parse(content) as {
      reply?: unknown;
      citedSourceIds?: unknown;
      sources?: unknown;
    };
    if (typeof parsed.reply !== 'string' || !parsed.reply.trim()) return null;
    const ids = Array.isArray(parsed.citedSourceIds)
      ? parsed.citedSourceIds.filter((id): id is string => typeof id === 'string')
      : Array.isArray(parsed.sources)
        ? parsed.sources.filter((id): id is string => typeof id === 'string')
        : [];
    return { reply: parsed.reply.trim(), citedSourceIds: ids };
  } catch {
    return null;
  }
}

aiRoutes.get('/usage', async (c) => {
  const userId = resolveUserId(c);
  return c.json(await buildUsage(userId));
});

aiRoutes.post('/chat', async (c) => {
  const userId = resolveUserId(c);

  if (!hasAiProvider()) {
    return c.json(
      {
        error: 'Dosify AI is temporarily unavailable. Add an AI provider key on the server.',
        code: 'AI_UNAVAILABLE',
      },
      503
    );
  }

  const body = chatSchema.parse(await c.req.json());
  const usageBefore = await buildUsage(userId);

  if (!usageBefore.isPremium && (usageBefore.remaining ?? 0) <= 0) {
    return c.json(
      {
        error: `Free plan includes ${FREE_DAILY_LIMIT} AI questions per day. Upgrade to Dosify Pro for unlimited conversations.`,
        code: 'DAILY_LIMIT',
        usage: usageBefore,
      },
      402
    );
  }

  const { context, sources } = await buildKnowledgeBundle(userId, body.message);
  const history = (body.history ?? []).slice(-HISTORY_LIMIT);
  const sourceIds = new Set(sources.map((s) => s.id));

  const result = await chatCompletion({
    temperature: 0.3,
    jsonMode: true,
    messages: [
      {
        role: 'system',
        content: [
          'You are Dosify AI, a careful health-companion assistant inside the Dosify medication tracking app.',
          'Be concise, clear, and practical. Prefer short paragraphs or tight bullet lists.',
          'You are NOT a doctor. Never diagnose, prescribe, or tell the user to start/stop/change a medication dose.',
          'Only use facts from the provided user context and sources. Do not invent interaction rules, studies, URLs, or certainty.',
          'When you rely on a source, include its id in citedSourceIds. Prefer web / PubMed / FDA sources for analytical claims.',
          'If a source has a url, you may mention the publisher name in the reply, but do not invent links.',
          'Respond ONLY with JSON of the form: {"reply":"markdown-free plain text","citedSourceIds":["id1","id2"]}.',
          'citedSourceIds must only contain ids from the provided sources list. If none apply, return [].',
          `Always keep this framing in mind: ${DISCLAIMER}`,
        ].join(' '),
      },
      {
        role: 'system',
        content: `Knowledge bundle JSON: ${JSON.stringify(context)}`,
      },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: body.message },
    ],
  });

  if (!result?.content?.trim()) {
    return c.json(
      { error: 'Dosify AI could not generate a reply. Try again in a moment.', code: 'AI_EMPTY' },
      502
    );
  }

  const parsed = parseAiJson(result.content.trim());
  const reply = parsed?.reply ?? result.content.trim();
  const citedIds = (parsed?.citedSourceIds ?? []).filter((id) => sourceIds.has(id));

  // Prefer model citations; always keep at least some web/catalog evidence when available.
  let citedSources =
    citedIds.length > 0
      ? sources.filter((s) => citedIds.includes(s.id))
      : sources
          .filter(
            (s) =>
              s.kind === 'web' ||
              s.kind === 'interaction_rule' ||
              s.kind === 'catalog_profile' ||
              s.kind === 'user_intake'
          )
          .slice(0, 6);

  // Ensure analysis answers surface at least one external web source when we found any.
  const webSources = sources.filter((s) => s.kind === 'web');
  if (webSources.length > 0 && !citedSources.some((s) => s.kind === 'web')) {
    citedSources = [...webSources.slice(0, 2), ...citedSources].slice(0, 8);
  }

  await prisma.aiChatMessage.createMany({
    data: [
      { userId, role: 'user', content: body.message },
      { userId, role: 'assistant', content: reply },
    ],
  });

  const usage = await buildUsage(userId);

  return c.json({
    reply,
    provider: result.provider,
    usage,
    disclaimer: DISCLAIMER,
    sources: citedSources,
  });
});
