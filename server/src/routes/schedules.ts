import { Hono } from 'hono';
import { z } from 'zod';
import { resolveUserId } from '../lib/auth.js';
import { writeAudit } from '../lib/audit.js';
import { isValidTimezone, materializeScheduleDoseEvents, zonedTimeToUtc } from '../lib/dosing.js';
import { prisma } from '../lib/prisma.js';

export const scheduleRoutes = new Hono();

const MAX_LIMIT = 100;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

const dateInput = z.string().refine((v) => DATE_ONLY_RE.test(v) || !Number.isNaN(Date.parse(v)), {
  message: 'Invalid date',
});

const createScheduleSchema = z.object({
  cabinetItemId: z.string().min(1),
  timezone: z.string().refine(isValidTimezone, { message: 'Invalid IANA timezone' }).optional(),
  recurrence: z.enum(['DAILY', 'WEEKDAYS', 'WEEKLY', 'INTERVAL']),
  times: z.array(z.string().regex(TIME_RE, 'Times must be HH:mm')).max(12).default([]),
  intervalHours: z.number().int().min(1).max(168).nullish(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).nullish(),
  startDate: dateInput,
  endDate: dateInput.nullish(),
  instructions: z.string().max(2000).nullish(),
  active: z.boolean().optional(),
});

const updateScheduleSchema = createScheduleSchema.omit({ cabinetItemId: true }).partial();

function validateRecurrenceFields(data: {
  recurrence: string;
  times: string[];
  intervalHours?: number | null;
  daysOfWeek?: number[] | null;
}): string | null {
  if (data.recurrence === 'INTERVAL') {
    if (data.intervalHours == null) return 'intervalHours is required for INTERVAL schedules';
  } else if (data.times.length === 0) {
    return 'At least one HH:mm time is required';
  }
  if (data.recurrence === 'WEEKLY' && (!data.daysOfWeek || data.daysOfWeek.length === 0)) {
    return 'daysOfWeek is required for WEEKLY schedules';
  }
  return null;
}

function toScheduleDate(value: string, timezone: string, endOfDay = false): Date {
  if (DATE_ONLY_RE.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return endOfDay
      ? zonedTimeToUtc(y, m, d, 23, 59, timezone)
      : zonedTimeToUtc(y, m, d, 0, 0, timezone);
  }
  return new Date(value);
}

const includeShape = {
  cabinetItem: { include: { substance: true } },
};

scheduleRoutes.get('/', async (c) => {
  const userId = resolveUserId(c);
  const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 50) || 50, 1), MAX_LIMIT);
  const activeParam = c.req.query('active');
  const cabinetItemId = c.req.query('cabinetItemId');

  const schedules = await prisma.medicationSchedule.findMany({
    where: {
      userId,
      ...(activeParam !== undefined ? { active: activeParam === 'true' } : {}),
      ...(cabinetItemId ? { cabinetItemId } : {}),
    },
    include: includeShape,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return c.json(schedules);
});

scheduleRoutes.get('/:id', async (c) => {
  const userId = resolveUserId(c);
  const schedule = await prisma.medicationSchedule.findFirst({
    where: { id: c.req.param('id'), userId },
    include: includeShape,
  });
  if (!schedule) return c.json({ error: 'Schedule not found' }, 404);
  return c.json(schedule);
});

scheduleRoutes.post('/', async (c) => {
  const userId = resolveUserId(c);
  const parsed = createScheduleSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Invalid request body', details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;
  const timezone = body.timezone ?? 'UTC';

  const recurrenceError = validateRecurrenceFields({
    recurrence: body.recurrence,
    times: body.times,
    intervalHours: body.intervalHours,
    daysOfWeek: body.daysOfWeek,
  });
  if (recurrenceError) return c.json({ error: recurrenceError }, 400);

  const startDate = toScheduleDate(body.startDate, timezone);
  const endDate = body.endDate ? toScheduleDate(body.endDate, timezone, true) : null;
  if (endDate && endDate <= startDate) {
    return c.json({ error: 'endDate must be after startDate' }, 400);
  }

  const cabinetItem = await prisma.cabinetItem.findFirst({
    where: { id: body.cabinetItemId, userId },
    select: { id: true },
  });
  if (!cabinetItem) return c.json({ error: 'Cabinet item not found' }, 404);

  const schedule = await prisma.medicationSchedule.create({
    data: {
      userId,
      cabinetItemId: body.cabinetItemId,
      timezone,
      recurrence: body.recurrence,
      times: body.times,
      intervalHours: body.intervalHours ?? undefined,
      daysOfWeek: body.daysOfWeek ?? undefined,
      startDate,
      endDate: endDate ?? undefined,
      instructions: body.instructions ?? undefined,
      active: body.active ?? true,
    },
    include: includeShape,
  });

  await writeAudit(userId, 'medication_schedule.created', 'MedicationSchedule', schedule.id, {
    cabinetItemId: body.cabinetItemId,
    recurrence: body.recurrence,
  });

  await materializeScheduleDoseEvents(schedule);

  return c.json(schedule, 201);
});

scheduleRoutes.patch('/:id', async (c) => {
  const userId = resolveUserId(c);
  const id = c.req.param('id');

  const existing = await prisma.medicationSchedule.findFirst({ where: { id, userId } });
  if (!existing) return c.json({ error: 'Schedule not found' }, 404);

  const parsed = updateScheduleSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Invalid request body', details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;
  const timezone = body.timezone ?? existing.timezone;

  const merged = {
    recurrence: body.recurrence ?? existing.recurrence,
    times: body.times ?? (Array.isArray(existing.times) ? (existing.times as string[]) : []),
    intervalHours: body.intervalHours ?? existing.intervalHours,
    daysOfWeek:
      body.daysOfWeek ??
      (Array.isArray(existing.daysOfWeek) ? (existing.daysOfWeek as number[]) : null),
  };
  const recurrenceError = validateRecurrenceFields(merged);
  if (recurrenceError) return c.json({ error: recurrenceError }, 400);

  const startDate = body.startDate
    ? toScheduleDate(body.startDate, timezone)
    : existing.startDate;
  const endDate =
    body.endDate === undefined
      ? existing.endDate
      : body.endDate === null
        ? null
        : toScheduleDate(body.endDate, timezone, true);
  if (endDate && endDate <= startDate) {
    return c.json({ error: 'endDate must be after startDate' }, 400);
  }

  const schedule = await prisma.medicationSchedule.update({
    where: { id },
    data: {
      timezone: body.timezone,
      recurrence: body.recurrence,
      times: body.times,
      intervalHours: body.intervalHours === null ? null : body.intervalHours,
      daysOfWeek: body.daysOfWeek === null ? undefined : body.daysOfWeek,
      startDate: body.startDate ? startDate : undefined,
      endDate: body.endDate === undefined ? undefined : endDate,
      instructions: body.instructions === null ? null : body.instructions,
      active: body.active,
    },
    include: includeShape,
  });

  await writeAudit(userId, 'medication_schedule.updated', 'MedicationSchedule', id, {
    fields: Object.keys(body),
  });

  await materializeScheduleDoseEvents(schedule);

  return c.json(schedule);
});

scheduleRoutes.delete('/:id', async (c) => {
  const userId = resolveUserId(c);
  const id = c.req.param('id');

  const existing = await prisma.medicationSchedule.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return c.json({ error: 'Schedule not found' }, 404);

  // Remove untouched future doses; acted-on history is kept (scheduleId is
  // set to null by the relation's onDelete: SetNull).
  await prisma.doseEvent.deleteMany({ where: { scheduleId: id, status: 'DUE' } });
  await prisma.medicationSchedule.delete({ where: { id } });
  await writeAudit(userId, 'medication_schedule.deleted', 'MedicationSchedule', id);

  return c.json({ ok: true });
});
