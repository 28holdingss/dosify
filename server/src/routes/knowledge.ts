import { Hono } from 'hono';
import { chatCompletion, hasAiProvider } from '../lib/ai/chat.js';
import { prisma } from '../lib/prisma.js';

export const knowledgeRoutes = new Hono();

const DISCLAIMER =
  'Informational only — not medical advice. Data is drawn from catalog profiles and known interaction rules; it may be incomplete or outdated. Absence of a consideration does not mean absence of risk. Consult a healthcare professional for personal guidance.';

/** GET /api/knowledge/substances/:id — medicine explainer */
knowledgeRoutes.get('/substances/:id', async (c) => {
  const id = c.req.param('id');

  const substance = await prisma.substance.findUnique({
    where: { id },
    include: {
      category: true,
      profile: true,
    },
  });

  if (!substance) {
    return c.json({ error: 'Substance not found' }, 404);
  }

  const name = substance.name;
  const drugClass = substance.profile?.drugClass ?? null;

  const rules = await prisma.interactionRule.findMany({
    where: {
      OR: [
        { substanceA: { equals: name, mode: 'insensitive' } },
        { substanceB: { equals: name, mode: 'insensitive' } },
        ...(drugClass
          ? [
              { substanceAClass: { equals: drugClass, mode: 'insensitive' as const } },
              { substanceBClass: { equals: drugClass, mode: 'insensitive' as const } },
            ]
          : []),
      ],
    },
    orderBy: [{ riskLevel: 'desc' }, { title: 'asc' }],
    take: 25,
  });

  const considerations = rules.map((rule) => ({
    riskLevel: rule.riskLevel,
    title: rule.title,
    description: rule.description,
    advice: rule.advice,
    source: rule.source,
  }));

  const profile = substance.profile
    ? {
        drugClass: substance.profile.drugClass,
        halfLifeHours: substance.profile.halfLifeHours,
        typicalDurationMinHours: substance.profile.typicalDurationMinHours,
        typicalDurationMaxHours: substance.profile.typicalDurationMaxHours,
        maxDailyDose: substance.profile.maxDailyDose,
        // Relative impact scores from catalog (0–1); not clinical certainty.
        cognitiveImpact: substance.profile.cognitiveImpact,
        cardiovascularImpact: substance.profile.cardiovascularImpact,
        gastrointestinalImpact: substance.profile.gastrointestinalImpact,
        liverImpact: substance.profile.liverImpact,
        kidneyImpact: substance.profile.kidneyImpact,
        respiratoryImpact: substance.profile.respiratoryImpact,
      }
    : null;

  let plainLanguageSummary: string | null = null;
  let aiGenerated = false;

  if (hasAiProvider()) {
    const summary = await chatCompletion({
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You write short plain-language medicine overviews for a health app. Use only the facts provided. Do not invent doses, interactions, or clinical certainty. Do not say something is safe. Keep under 80 words. No markdown.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            name: substance.name,
            description: substance.description,
            category: substance.category.name,
            defaultUnit: substance.defaultUnit,
            doseRange:
              substance.minDose != null && substance.maxDose != null
                ? `${substance.minDose}–${substance.maxDose} ${substance.defaultUnit}`
                : null,
            profile,
            considerationTitles: considerations.slice(0, 8).map((c) => c.title),
          }),
        },
      ],
    });

    if (summary?.content?.trim()) {
      plainLanguageSummary = summary.content.trim();
      aiGenerated = true;
    }
  }

  if (!plainLanguageSummary) {
    const bits = [
      substance.description?.trim(),
      substance.category.name ? `Category: ${substance.category.name}.` : null,
      profile?.drugClass ? `Often described as ${profile.drugClass}.` : null,
      substance.minDose != null && substance.maxDose != null
        ? `Catalog dose range (not a prescription): ${substance.minDose}–${substance.maxDose} ${substance.defaultUnit}.`
        : null,
      considerations.length > 0
        ? `${considerations.length} related interaction consideration${considerations.length === 1 ? '' : 's'} from known rules.`
        : 'No interaction rules matched this substance in the catalog.',
    ].filter(Boolean);
    plainLanguageSummary = bits.join(' ') || null;
  }

  return c.json({
    substance: {
      id: substance.id,
      name: substance.name,
      description: substance.description,
      defaultUnit: substance.defaultUnit,
      minDose: substance.minDose,
      maxDose: substance.maxDose,
      isPopular: substance.isPopular,
      category: {
        id: substance.category.id,
        name: substance.category.name,
        slug: substance.category.slug,
        icon: substance.category.icon,
      },
    },
    profile,
    considerations,
    plainLanguageSummary,
    aiGenerated,
    disclaimer: DISCLAIMER,
  });
});
