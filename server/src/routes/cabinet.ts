import { Hono } from 'hono';
import { z } from 'zod';
import { resolveUserId } from '../lib/auth.js';
import { writeAudit } from '../lib/audit.js';
import { prisma } from '../lib/prisma.js';

export const cabinetRoutes = new Hono();

// Accepts "YYYY-MM-DD" (from the app's date inputs) or a full ISO datetime.
const dateInput = z
  .string()
  .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isNaN(Date.parse(v)), {
    message: 'Invalid date',
  })
  .transform((v) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00.000Z` : v));

const createCabinetItemSchema = z.object({
  substanceId: z.string().min(1),
  displayName: z.string().max(200).nullish(),
  doseValue: z.number().positive().nullish(),
  doseUnit: z.string().max(30).nullish(),
  strengthValue: z.number().positive().nullish(),
  strengthUnit: z.string().max(30).nullish(),
  quantity: z.number().min(0).nullish(),
  expirationDate: dateInput.nullish(),
  refillDate: dateInput.nullish(),
  prescriber: z.string().max(200).nullish(),
  instructions: z.string().max(2000).nullish(),
  active: z.boolean().optional(),
});

const updateCabinetItemSchema = createCabinetItemSchema.partial();

const includeShape = {
  substance: { include: { category: true } },
  schedules: { where: { active: true }, orderBy: { createdAt: 'asc' as const }, take: 20 },
};

cabinetRoutes.get('/', async (c) => {
  const userId = resolveUserId(c);
  const activeParam = c.req.query('active');

  const items = await prisma.cabinetItem.findMany({
    where: {
      userId,
      ...(activeParam !== undefined ? { active: activeParam === 'true' } : {}),
    },
    include: includeShape,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return c.json(items);
});

cabinetRoutes.get('/:id', async (c) => {
  const userId = resolveUserId(c);
  const item = await prisma.cabinetItem.findFirst({
    where: { id: c.req.param('id'), userId },
    include: includeShape,
  });
  if (!item) return c.json({ error: 'Cabinet item not found' }, 404);
  return c.json(item);
});

cabinetRoutes.post('/', async (c) => {
  const userId = resolveUserId(c);
  const body = createCabinetItemSchema.parse(await c.req.json());

  const substance = await prisma.substance.findUnique({
    where: { id: body.substanceId },
    select: { id: true },
  });
  if (!substance) return c.json({ error: 'Substance not found' }, 404);

  const item = await prisma.cabinetItem.create({
    data: { userId, ...body },
    include: includeShape,
  });

  await writeAudit(userId, 'cabinet_item.created', 'CabinetItem', item.id, {
    substanceId: item.substanceId,
  });

  return c.json(item, 201);
});

cabinetRoutes.patch('/:id', async (c) => {
  const userId = resolveUserId(c);
  const id = c.req.param('id');
  const body = updateCabinetItemSchema.parse(await c.req.json());

  const existing = await prisma.cabinetItem.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) return c.json({ error: 'Cabinet item not found' }, 404);

  if (body.substanceId) {
    const substance = await prisma.substance.findUnique({
      where: { id: body.substanceId },
      select: { id: true },
    });
    if (!substance) return c.json({ error: 'Substance not found' }, 404);
  }

  const item = await prisma.cabinetItem.update({
    where: { id },
    data: body,
    include: includeShape,
  });

  // Deactivating an item makes its future doses moot.
  if (body.active === false) {
    await prisma.doseEvent.deleteMany({
      where: { cabinetItemId: id, status: 'DUE', scheduledFor: { gt: new Date() } },
    });
    await prisma.medicationSchedule.updateMany({
      where: { cabinetItemId: id, active: true },
      data: { active: false },
    });
  }

  await writeAudit(userId, 'cabinet_item.updated', 'CabinetItem', id, {
    fields: Object.keys(body),
  });

  return c.json(item);
});

cabinetRoutes.delete('/:id', async (c) => {
  const userId = resolveUserId(c);
  const id = c.req.param('id');

  const existing = await prisma.cabinetItem.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) return c.json({ error: 'Cabinet item not found' }, 404);

  // Cascades to schedules and dose events via the schema relations.
  await prisma.cabinetItem.delete({ where: { id } });

  await writeAudit(userId, 'cabinet_item.deleted', 'CabinetItem', id);

  return c.json({ ok: true });
});
