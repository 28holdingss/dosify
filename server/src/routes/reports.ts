import { Hono } from 'hono';
import { z } from 'zod';
import { resolveSubjectUserId } from '../lib/acl.js';
import { writeAudit } from '../lib/audit.js';
import { resolveUserId } from '../lib/auth.js';
import { toCsv } from '../lib/csv.js';
import { prisma } from '../lib/prisma.js';

export const reportRoutes = new Hono();

const generateSchema = z.object({
  kind: z.enum(['CABINET_CSV', 'DOSES_CSV', 'SYMPTOMS_CSV', 'CLINICIAN_SUMMARY']),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  forUserId: z.string().optional(),
  title: z.string().max(200).optional(),
});

function parseDate(v: string | undefined, fallback: Date): Date {
  if (!v || Number.isNaN(Date.parse(v))) return fallback;
  return new Date(v);
}

reportRoutes.get('/', async (c) => {
  const actorId = resolveUserId(c);
  const subjectUserId = await resolveSubjectUserId(
    actorId,
    c.req.query('forUserId'),
    'REPORTS_VIEW'
  );

  const reports = await prisma.healthReport.findMany({
    where: { userId: subjectUserId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      kind: true,
      title: true,
      dateFrom: true,
      dateTo: true,
      provenance: true,
      createdAt: true,
    },
  });

  return c.json(reports);
});

reportRoutes.get('/:id', async (c) => {
  const actorId = resolveUserId(c);
  const report = await prisma.healthReport.findUnique({ where: { id: c.req.param('id') } });
  if (!report) return c.json({ error: 'Report not found' }, 404);

  await resolveSubjectUserId(actorId, report.userId, 'REPORTS_VIEW');
  return c.json(report);
});

reportRoutes.post('/generate', async (c) => {
  const actorId = resolveUserId(c);
  const body = generateSchema.parse(await c.req.json());
  const subjectUserId = await resolveSubjectUserId(
    actorId,
    body.forUserId,
    'REPORTS_VIEW'
  );

  const now = new Date();
  const dateTo = parseDate(body.dateTo, now);
  const dateFrom = parseDate(
    body.dateFrom,
    new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000)
  );

  let content = '';
  let title = body.title ?? '';
  const provenance: Record<string, unknown> = {
    generatedAt: now.toISOString(),
    generatedBy: actorId,
    subjectUserId,
    engineVersion: '1.0.0',
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
    disclaimer:
      'This export is for personal or clinician discussion only. It is not a diagnosis.',
  };

  if (body.kind === 'CABINET_CSV') {
    title = title || 'Health Cabinet export';
    const items = await prisma.cabinetItem.findMany({
      where: { userId: subjectUserId },
      include: { substance: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    content = toCsv(
      [
        'displayName',
        'substance',
        'doseValue',
        'doseUnit',
        'quantity',
        'expirationDate',
        'refillDate',
        'prescriber',
        'active',
        'instructions',
      ],
      items.map((i) => [
        i.displayName ?? i.substance.name,
        i.substance.name,
        i.doseValue,
        i.doseUnit,
        i.quantity,
        i.expirationDate?.toISOString() ?? '',
        i.refillDate?.toISOString() ?? '',
        i.prescriber,
        i.active,
        i.instructions,
      ])
    );
    provenance.rowCount = items.length;
  } else if (body.kind === 'DOSES_CSV') {
    title = title || 'Dose adherence export';
    const doses = await prisma.doseEvent.findMany({
      where: {
        userId: subjectUserId,
        scheduledFor: { gte: dateFrom, lte: dateTo },
      },
      include: { cabinetItem: { include: { substance: true } } },
      orderBy: { scheduledFor: 'asc' },
      take: 2000,
    });
    content = toCsv(
      ['scheduledFor', 'status', 'actedAt', 'medicine', 'note'],
      doses.map((d) => [
        d.scheduledFor.toISOString(),
        d.status,
        d.actedAt?.toISOString() ?? '',
        d.cabinetItem.displayName ?? d.cabinetItem.substance.name,
        d.note,
      ])
    );
    provenance.rowCount = doses.length;
  } else if (body.kind === 'SYMPTOMS_CSV') {
    title = title || 'Symptoms export';
    const logs = await prisma.symptomLog.findMany({
      where: {
        userId: subjectUserId,
        occurredAt: { gte: dateFrom, lte: dateTo },
      },
      orderBy: { occurredAt: 'asc' },
      take: 2000,
    });
    content = toCsv(
      ['occurredAt', 'symptom', 'severity', 'relatedMeds', 'notes'],
      logs.map((l) => [l.occurredAt.toISOString(), l.symptom, l.severity, l.relatedMeds, l.notes])
    );
    provenance.rowCount = logs.length;
  } else {
    title = title || 'Clinician summary';
    const [user, cabinet, allergies, conditions, contacts, recentSymptoms, doseCounts] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: subjectUserId },
          include: { healthProfile: true },
        }),
        prisma.cabinetItem.findMany({
          where: { userId: subjectUserId, active: true },
          include: { substance: true },
          take: 100,
        }),
        prisma.allergy.findMany({ where: { userId: subjectUserId }, take: 50 }),
        prisma.condition.findMany({
          where: { userId: subjectUserId, status: 'ACTIVE' },
          take: 50,
        }),
        prisma.emergencyContact.findMany({
          where: { userId: subjectUserId },
          orderBy: { isPrimary: 'desc' },
          take: 20,
        }),
        prisma.symptomLog.findMany({
          where: { userId: subjectUserId, occurredAt: { gte: dateFrom, lte: dateTo } },
          orderBy: { occurredAt: 'desc' },
          take: 50,
        }),
        prisma.doseEvent.groupBy({
          by: ['status'],
          where: {
            userId: subjectUserId,
            scheduledFor: { gte: dateFrom, lte: dateTo },
          },
          _count: { _all: true },
        }),
      ]);

    const profile = user?.healthProfile;
    const lines = [
      `Clinician summary for ${user?.name ?? 'Patient'}`,
      `Generated: ${now.toISOString()}`,
      `Range: ${dateFrom.toISOString()} → ${dateTo.toISOString()}`,
      '',
      '— Profile —',
      `Age: ${profile?.age ?? 'n/a'}`,
      `Gender: ${profile?.gender ?? 'n/a'}`,
      `Free-text allergies: ${profile?.allergies ?? 'n/a'}`,
      `Free-text conditions: ${profile?.medicalConditions ?? 'n/a'}`,
      `Emergency notes: ${profile?.emergencyInfo ?? 'n/a'}`,
      '',
      '— Structured allergies —',
      ...(allergies.length
        ? allergies.map((a) => `• ${a.allergen} (${a.severity})${a.reaction ? `: ${a.reaction}` : ''}`)
        : ['• None recorded']),
      '',
      '— Active conditions —',
      ...(conditions.length ? conditions.map((x) => `• ${x.name}`) : ['• None recorded']),
      '',
      '— Active cabinet —',
      ...(cabinet.length
        ? cabinet.map((i) => {
            const name = i.displayName ?? i.substance.name;
            const dose =
              i.doseValue != null ? ` ${i.doseValue}${i.doseUnit ? ` ${i.doseUnit}` : ''}` : '';
            return `• ${name}${dose}`;
          })
        : ['• None recorded']),
      '',
      '— Emergency contacts —',
      ...(contacts.length
        ? contacts.map(
            (ct) =>
              `• ${ct.name}${ct.relationship ? ` (${ct.relationship})` : ''}${ct.phone ? ` — ${ct.phone}` : ''}${ct.isPrimary ? ' [primary]' : ''}`
          )
        : ['• None recorded']),
      '',
      '— Dose adherence (range) —',
      ...doseCounts.map((d) => `• ${d.status}: ${d._count._all}`),
      '',
      '— Recent symptoms (range) —',
      ...(recentSymptoms.length
        ? recentSymptoms.map(
            (s) =>
              `• ${s.occurredAt.toISOString().slice(0, 10)} — ${s.symptom}${s.severity != null ? ` (severity ${s.severity}/10)` : ''}`
          )
        : ['• None recorded']),
      '',
      'Disclaimer: observational export only; not a diagnosis or treatment recommendation.',
    ];
    content = lines.join('\n');
    provenance.allergyCount = allergies.length;
    provenance.conditionCount = conditions.length;
    provenance.cabinetCount = cabinet.length;
  }

  const report = await prisma.healthReport.create({
    data: {
      userId: subjectUserId,
      kind: body.kind,
      title,
      dateFrom,
      dateTo,
      content,
      provenance: provenance as object,
    },
  });

  await writeAudit(actorId, 'report.generate', 'HealthReport', report.id, {
    kind: body.kind,
    subjectUserId,
  });

  return c.json(report, 201);
});
