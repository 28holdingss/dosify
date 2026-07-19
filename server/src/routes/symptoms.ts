import { Hono } from 'hono';
import { z } from 'zod';
import { resolveSubjectUserId } from '../lib/acl.js';
import { writeAudit } from '../lib/audit.js';
import { resolveUserId } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

export const symptomRoutes = new Hono();

const dateInput = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' })
  .transform((v) => new Date(v));

const createSchema = z.object({
  symptom: z.string().min(1).max(200),
  severity: z.number().int().min(1).max(10).nullish(),
  notes: z.string().max(2000).nullish(),
  occurredAt: dateInput.optional(),
  relatedMeds: z.string().max(500).nullish(),
});

const updateSchema = createSchema.partial();

symptomRoutes.get('/', async (c) => {
  const actorId = resolveUserId(c);
  const subjectUserId = await resolveSubjectUserId(
    actorId,
    c.req.query('forUserId'),
    'FULL_READ'
  );

  const from = c.req.query('from');
  const to = c.req.query('to');
  const fromDate = from && !Number.isNaN(Date.parse(from)) ? new Date(from) : undefined;
  const toDate = to && !Number.isNaN(Date.parse(to)) ? new Date(to) : undefined;

  const logs = await prisma.symptomLog.findMany({
    where: {
      userId: subjectUserId,
      ...(fromDate || toDate
        ? {
            occurredAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    },
    orderBy: { occurredAt: 'desc' },
    take: 200,
  });

  return c.json(logs);
});

symptomRoutes.post('/', async (c) => {
  const userId = resolveUserId(c);
  const body = createSchema.parse(await c.req.json());

  const log = await prisma.symptomLog.create({
    data: {
      userId,
      symptom: body.symptom,
      severity: body.severity ?? null,
      notes: body.notes ?? null,
      occurredAt: body.occurredAt ?? new Date(),
      relatedMeds: body.relatedMeds ?? null,
    },
  });

  await writeAudit(userId, 'symptom.create', 'SymptomLog', log.id);
  return c.json(log, 201);
});

symptomRoutes.patch('/:id', async (c) => {
  const userId = resolveUserId(c);
  const id = c.req.param('id');
  const body = updateSchema.parse(await c.req.json());

  const existing = await prisma.symptomLog.findFirst({ where: { id, userId } });
  if (!existing) return c.json({ error: 'Symptom not found' }, 404);

  const log = await prisma.symptomLog.update({
    where: { id },
    data: {
      ...(body.symptom !== undefined && { symptom: body.symptom }),
      ...(body.severity !== undefined && { severity: body.severity }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.occurredAt !== undefined && { occurredAt: body.occurredAt }),
      ...(body.relatedMeds !== undefined && { relatedMeds: body.relatedMeds }),
    },
  });

  await writeAudit(userId, 'symptom.update', 'SymptomLog', log.id);
  return c.json(log);
});

symptomRoutes.delete('/:id', async (c) => {
  const userId = resolveUserId(c);
  const id = c.req.param('id');
  const existing = await prisma.symptomLog.findFirst({ where: { id, userId } });
  if (!existing) return c.json({ error: 'Symptom not found' }, 404);

  await prisma.symptomLog.delete({ where: { id } });
  await writeAudit(userId, 'symptom.delete', 'SymptomLog', id);
  return c.json({ ok: true });
});
