import { Hono } from 'hono';
import { z } from 'zod';
import { resolveUserId } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

export const substanceRoutes = new Hono();

substanceRoutes.get('/categories', async (c) => {
  const categories = await prisma.substanceCategory.findMany({
    include: { _count: { select: { substances: true } } },
    orderBy: { name: 'asc' },
  });
  return c.json(categories);
});

substanceRoutes.get('/', async (c) => {
  const category = c.req.query('category');
  const popular = c.req.query('popular');
  const search = c.req.query('search');

  const substances = await prisma.substance.findMany({
    where: {
      ...(category ? { category: { slug: category } } : {}),
      ...(popular === 'true' ? { isPopular: true } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: { category: true },
    orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
    take: 50,
  });

  return c.json(substances);
});

substanceRoutes.get('/:id', async (c) => {
  const substance = await prisma.substance.findUnique({
    where: { id: c.req.param('id') },
    include: { category: true },
  });
  if (!substance) return c.json({ error: 'Substance not found' }, 404);
  return c.json(substance);
});
