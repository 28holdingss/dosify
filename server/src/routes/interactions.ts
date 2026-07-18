import { Hono } from 'hono';
import { resolveUserId } from '../lib/auth.js';
import { checkSubstanceInteractions } from '../lib/analysis-engine/index.js';
import { interactionRiskScore } from '../lib/analysis-engine/interactions.js';
import { prisma } from '../lib/prisma.js';

export const interactionRoutes = new Hono();

interactionRoutes.get('/', async (c) => {
  const userId = resolveUserId(c);

  const interactions = await prisma.interaction.findMany({
    where: { userId },
    include: { substanceA: true, substanceB: true },
    orderBy: { detectedAt: 'desc' },
  });

  return c.json(interactions);
});

interactionRoutes.post('/check', async (c) => {
  const { substanceIds } = await c.req.json<{ substanceIds: string[] }>();

  const interactions = await checkSubstanceInteractions(substanceIds);

  return c.json({
    interactions: interactions.map((i) => ({
      title: i.title,
      riskLevel: i.riskLevel,
      description: i.description,
      advice: i.advice,
      source: i.source,
    })),
    count: interactions.length,
    riskScore: interactionRiskScore(interactions),
  });
});

interactionRoutes.patch('/:id/snooze', async (c) => {
  const userId = resolveUserId(c);
  const hours = Number(c.req.query('hours') ?? 24);

  const interaction = await prisma.interaction.updateMany({
    where: { id: c.req.param('id'), userId },
    data: { snoozedUntil: new Date(Date.now() + hours * 60 * 60 * 1000) },
  });

  if (interaction.count === 0) return c.json({ error: 'Interaction not found' }, 404);
  return c.json({ ok: true });
});
