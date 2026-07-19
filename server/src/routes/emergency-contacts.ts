import { Hono } from 'hono';
import { z } from 'zod';
import { resolveSubjectUserId } from '../lib/acl.js';
import { writeAudit } from '../lib/audit.js';
import { resolveUserId } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

export const emergencyContactRoutes = new Hono();

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  relationship: z.string().max(100).nullish(),
  phone: z.string().max(40).nullish(),
  email: z
    .union([z.string().email().max(200), z.literal('')])
    .nullish()
    .transform((v) => (v ? v : null)),
  isPrimary: z.boolean().optional(),
  notes: z.string().max(1000).nullish(),
});

const updateSchema = contactSchema.partial();

emergencyContactRoutes.get('/', async (c) => {
  const actorId = resolveUserId(c);
  const subjectUserId = await resolveSubjectUserId(
    actorId,
    c.req.query('forUserId'),
    'EMERGENCY_VIEW'
  );

  const contacts = await prisma.emergencyContact.findMany({
    where: { userId: subjectUserId },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    take: 50,
  });

  return c.json(contacts);
});

emergencyContactRoutes.post('/', async (c) => {
  const userId = resolveUserId(c);
  const body = contactSchema.parse(await c.req.json());

  if (body.isPrimary) {
    await prisma.emergencyContact.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.emergencyContact.create({
    data: {
      userId,
      name: body.name,
      relationship: body.relationship ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      isPrimary: body.isPrimary ?? false,
      notes: body.notes ?? null,
    },
  });

  await writeAudit(userId, 'emergency_contact.create', 'EmergencyContact', contact.id);
  return c.json(contact, 201);
});

emergencyContactRoutes.patch('/:id', async (c) => {
  const userId = resolveUserId(c);
  const id = c.req.param('id');
  const body = updateSchema.parse(await c.req.json());

  const existing = await prisma.emergencyContact.findFirst({ where: { id, userId } });
  if (!existing) return c.json({ error: 'Contact not found' }, 404);

  if (body.isPrimary) {
    await prisma.emergencyContact.updateMany({
      where: { userId, isPrimary: true, NOT: { id } },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.emergencyContact.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.relationship !== undefined && { relationship: body.relationship }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.isPrimary !== undefined && { isPrimary: body.isPrimary }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  await writeAudit(userId, 'emergency_contact.update', 'EmergencyContact', contact.id);
  return c.json(contact);
});

emergencyContactRoutes.delete('/:id', async (c) => {
  const userId = resolveUserId(c);
  const id = c.req.param('id');
  const existing = await prisma.emergencyContact.findFirst({ where: { id, userId } });
  if (!existing) return c.json({ error: 'Contact not found' }, 404);

  await prisma.emergencyContact.delete({ where: { id } });
  await writeAudit(userId, 'emergency_contact.delete', 'EmergencyContact', id);
  return c.json({ ok: true });
});
