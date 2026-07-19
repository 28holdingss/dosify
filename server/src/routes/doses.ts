import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { resolveUserId } from '../lib/auth.js';
import { writeAudit } from '../lib/audit.js';
import {
  MAX_GENERATION_WINDOW_DAYS,
  markMissedDoseEvents,
  materializeDoseEvents,
} from '../lib/dosing.js';
import { prisma } from '../lib/prisma.js';

export const doseRoutes = new Hono();

const MAX_LIMIT = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

const doseStatusSchema = z.enum(['DUE', 'TAKEN', 'SKIPPED', 'SNOOZED', 'MISSED']);

const createDoseSchema = z.object({
  cabinetItemId: z.string().min(1),
  scheduledFor: z.string().datetime(),
  note: z.string().max(1000).optional(),
});

const actOnDoseSchema = z.object({
  action: z.enum(['TAKEN', 'SKIPPED', 'SNOOZED']),
  snoozeMinutes: z.number().int().min(5).max(24 * 60).optional(),
  note: z.string().max(1000).optional(),
});

const generateSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

function parseWindow(fromRaw?: string, toRaw?: string): { from: Date; to: Date } | null {
  const now = new Date();
  const from = fromRaw ? new Date(fromRaw) : new Date(now.getTime() - DAY_MS);
  const to = toRaw ? new Date(toRaw) : new Date(now.getTime() + DAY_MS);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  if (to <= from) return null;
  if (to.getTime() - from.getTime() > MAX_GENERATION_WINDOW_DAYS * DAY_MS) return null;
  return { from, to };
}

doseRoutes.get('/', async (c) => {
  const userId = resolveUserId(c);
  const window = parseWindow(c.req.query('from'), c.req.query('to'));
  if (!window) {
    return c.json(
      { error: `Invalid window; max range is ${MAX_GENERATION_WINDOW_DAYS} days` },
      400
    );
  }
  const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 100) || 100, 1), MAX_LIMIT);

  const statusParam = c.req.query('status');
  const statusParsed = statusParam ? doseStatusSchema.safeParse(statusParam) : undefined;
  if (statusParsed && !statusParsed.success) {
    return c.json({ error: 'Invalid status filter' }, 400);
  }

  await materializeDoseEvents(userId, window.from, window.to);
  await markMissedDoseEvents(userId);

  const doses = await prisma.doseEvent.findMany({
    where: {
      userId,
      scheduledFor: { gte: window.from, lte: window.to },
      ...(statusParsed?.success ? { status: statusParsed.data } : {}),
    },
    include: {
      cabinetItem: { include: { substance: true } },
      schedule: true,
    },
    orderBy: { scheduledFor: 'asc' },
    take: limit,
  });

  return c.json(doses);
});

doseRoutes.post('/generate', async (c) => {
  const userId = resolveUserId(c);
  const parsed = generateSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: 'Invalid request body', details: parsed.error.flatten() }, 400);
  }
  const window = parseWindow(parsed.data.from, parsed.data.to);
  if (!window) {
    return c.json(
      { error: `Invalid window; max range is ${MAX_GENERATION_WINDOW_DAYS} days` },
      400
    );
  }

  const created = await materializeDoseEvents(userId, window.from, window.to);
  const missed = await markMissedDoseEvents(userId);

  return c.json({ created, markedMissed: missed });
});

doseRoutes.post('/', async (c) => {
  const userId = resolveUserId(c);
  const parsed = createDoseSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Invalid request body', details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;

  const cabinetItem = await prisma.cabinetItem.findFirst({
    where: { id: body.cabinetItemId, userId },
    select: { id: true },
  });
  if (!cabinetItem) return c.json({ error: 'Cabinet item not found' }, 404);

  const dose = await prisma.doseEvent.create({
    data: {
      userId,
      cabinetItemId: body.cabinetItemId,
      scheduledFor: new Date(body.scheduledFor),
      note: body.note,
    },
    include: { cabinetItem: { include: { substance: true } } },
  });

  await writeAudit(userId, 'dose_event.created', 'DoseEvent', dose.id, {
    cabinetItemId: body.cabinetItemId,
    adHoc: true,
  });

  return c.json(dose, 201);
});

async function actOnDose(
  c: Context,
  action: 'TAKEN' | 'SKIPPED' | 'SNOOZED',
  body: { note?: string; snoozeMinutes?: number }
) {
  const userId = resolveUserId(c);
  const id = c.req.param('id') as string;

  const existing = await prisma.doseEvent.findFirst({ where: { id, userId } });
  if (!existing) return c.json({ error: 'Dose event not found' }, 404);

  if (existing.status === 'TAKEN' || existing.status === 'SKIPPED') {
    return c.json({ error: `Dose already ${existing.status.toLowerCase()}` }, 409);
  }

  const now = new Date();
  const snoozedUntil =
    action === 'SNOOZED'
      ? new Date(now.getTime() + (body.snoozeMinutes ?? 15) * 60 * 1000)
      : null;

  const dose = await prisma.doseEvent.update({
    where: { id },
    data: {
      status: action,
      actedAt: now,
      snoozedUntil,
      note: body.note ?? undefined,
    },
    include: { cabinetItem: { include: { substance: true } }, schedule: true },
  });

  await writeAudit(userId, `dose_event.${action.toLowerCase()}`, 'DoseEvent', id, {
    scheduledFor: existing.scheduledFor.toISOString(),
    ...(action === 'SNOOZED' ? { snoozeMinutes: body.snoozeMinutes ?? 15 } : {}),
  });

  return c.json(dose);
}

// Frontend contract: POST /api/doses/:id/taken|skipped|snoozed with an
// optional { note?, minutes? } body.
const actionBodySchema = z.object({
  note: z.string().max(1000).nullish(),
  minutes: z.number().int().min(1).max(24 * 60).optional(),
});

async function parseActionBody(c: Context) {
  const raw = await c.req.text();
  const parsed = actionBodySchema.safeParse(raw ? JSON.parse(raw) : {});
  return parsed.success ? parsed.data : {};
}

doseRoutes.post('/:id/taken', async (c) => {
  const body = await parseActionBody(c);
  return actOnDose(c, 'TAKEN', { note: body.note ?? undefined });
});

doseRoutes.post('/:id/skipped', async (c) => {
  const body = await parseActionBody(c);
  return actOnDose(c, 'SKIPPED', { note: body.note ?? undefined });
});

doseRoutes.post('/:id/snoozed', async (c) => {
  const body = await parseActionBody(c);
  return actOnDose(c, 'SNOOZED', {
    note: body.note ?? undefined,
    snoozeMinutes: body.minutes,
  });
});

doseRoutes.patch('/:id', async (c) => {
  const parsed = actOnDoseSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Invalid request body', details: parsed.error.flatten() }, 400);
  }
  return actOnDose(c, parsed.data.action, {
    note: parsed.data.note,
    snoozeMinutes: parsed.data.snoozeMinutes,
  });
});
