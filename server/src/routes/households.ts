import { Hono } from 'hono';
import { z } from 'zod';
import { resolveSubjectUserId } from '../lib/acl.js';
import { writeAudit } from '../lib/audit.js';
import { resolveUserId } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

export const householdRoutes = new Hono();

const createHouseholdSchema = z.object({
  name: z.string().min(1).max(120),
});

const inviteSchema = z.object({
  email: z.string().email().max(200),
  role: z.enum(['CAREGIVER', 'DEPENDENT']).default('CAREGIVER'),
  scopes: z
    .array(z.enum(['EMERGENCY_VIEW', 'REPORTS_VIEW', 'FULL_READ']))
    .min(1)
    .default(['EMERGENCY_VIEW']),
});

const householdInclude = {
  members: {
    where: { status: { in: ['PENDING', 'ACCEPTED'] as ('PENDING' | 'ACCEPTED')[] } },
    orderBy: { invitedAt: 'asc' as const },
    take: 50,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
  grants: {
    where: { active: true },
    take: 50,
    include: {
      caregiver: { select: { id: true, name: true, email: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  },
};

householdRoutes.get('/', async (c) => {
  const userId = resolveUserId(c);

  const owned = await prisma.household.findMany({
    where: { ownerId: userId },
    include: householdInclude,
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const memberOf = await prisma.household.findMany({
    where: {
      members: { some: { userId, status: 'ACCEPTED' } },
      NOT: { ownerId: userId },
    },
    include: householdInclude,
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const pendingInvites = await prisma.householdMember.findMany({
    where: {
      status: 'PENDING',
      OR: [
        { userId },
        {
          inviteEmail: (
            await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
          )?.email,
        },
      ],
    },
    include: {
      household: { select: { id: true, name: true, ownerId: true } },
    },
    take: 20,
  });

  const grantsReceived = await prisma.careGrant.findMany({
    where: { caregiverUserId: userId, active: true },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
    take: 50,
  });

  return c.json({ owned, memberOf, pendingInvites, grantsReceived });
});

householdRoutes.post('/', async (c) => {
  const userId = resolveUserId(c);
  const body = createHouseholdSchema.parse(await c.req.json());

  const household = await prisma.household.create({
    data: {
      name: body.name,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: 'OWNER',
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          inviteEmail: (
            await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
          )?.email,
        },
      },
    },
    include: householdInclude,
  });

  await writeAudit(userId, 'household.create', 'Household', household.id);
  return c.json(household, 201);
});

householdRoutes.post('/:id/invite', async (c) => {
  const userId = resolveUserId(c);
  const householdId = c.req.param('id');
  const body = inviteSchema.parse(await c.req.json());

  const household = await prisma.household.findFirst({
    where: { id: householdId, ownerId: userId },
  });
  if (!household) return c.json({ error: 'Household not found' }, 404);

  const email = body.email.trim().toLowerCase();
  const invitee = await prisma.user.findUnique({ where: { email } });

  const member = await prisma.householdMember.upsert({
    where: {
      householdId_inviteEmail: { householdId, inviteEmail: email },
    },
    create: {
      householdId,
      inviteEmail: email,
      userId: invitee?.id ?? null,
      role: body.role,
      status: 'PENDING',
    },
    update: {
      userId: invitee?.id ?? null,
      role: body.role,
      status: 'PENDING',
      revokedAt: null,
      acceptedAt: null,
      invitedAt: new Date(),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  await writeAudit(userId, 'household.invite', 'HouseholdMember', member.id, {
    email,
    role: body.role,
    scopes: body.scopes,
  });

  if (invitee?.id) {
    try {
      const { notifyOnce } = await import('../lib/notifications.js');
      await notifyOnce({
        userId: invitee.id,
        type: 'FAMILY',
        title: `Family invite: ${household.name}`,
        body: `You've been invited as ${body.role.toLowerCase().replace('_', ' ')}. Open Family to accept or decline.`,
        dedupeWindowHours: 6,
      });
    } catch {
      // best-effort
    }
  }

  return c.json({ member, pendingScopes: body.scopes }, 201);
});

householdRoutes.post('/invites/:memberId/accept', async (c) => {
  const userId = resolveUserId(c);
  const memberId = c.req.param('memberId');
  const scopesBody = z
    .object({
      scopes: z
        .array(z.enum(['EMERGENCY_VIEW', 'REPORTS_VIEW', 'FULL_READ']))
        .min(1)
        .default(['EMERGENCY_VIEW']),
    })
    .parse((await c.req.json().catch(() => ({}))) ?? {});

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!me) return c.json({ error: 'User not found' }, 404);

  const member = await prisma.householdMember.findFirst({
    where: {
      id: memberId,
      status: 'PENDING',
      OR: [{ userId }, { inviteEmail: me.email }],
    },
    include: { household: true },
  });
  if (!member) return c.json({ error: 'Invite not found' }, 404);

  // CAREGIVER views the household owner's health.
  // DEPENDENT grants the household owner access to the dependent's health.
  const ownerUserId =
    member.role === 'DEPENDENT' ? userId : member.household.ownerId;
  const caregiverUserId =
    member.role === 'DEPENDENT' ? member.household.ownerId : userId;

  const updated = await prisma.$transaction(async (tx) => {
    const m = await tx.householdMember.update({
      where: { id: member.id },
      data: {
        userId,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    for (const scope of scopesBody.scopes) {
      await tx.careGrant.upsert({
        where: {
          ownerUserId_caregiverUserId_scope: {
            ownerUserId,
            caregiverUserId,
            scope,
          },
        },
        create: {
          householdId: member.householdId,
          ownerUserId,
          caregiverUserId,
          scope,
          active: true,
        },
        update: {
          householdId: member.householdId,
          active: true,
          revokedAt: null,
          grantedAt: new Date(),
        },
      });
    }

    return m;
  });

  await writeAudit(userId, 'household.invite.accept', 'HouseholdMember', updated.id, {
    householdId: member.householdId,
    scopes: scopesBody.scopes,
  });

  try {
    const { notifyOnce } = await import('../lib/notifications.js');
    const accepter = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    await notifyOnce({
      userId: member.household.ownerId,
      type: 'FAMILY',
      title: 'Family invite accepted',
      body: `${accepter?.name ?? 'Someone'} joined ${member.household.name}.`,
      dedupeWindowHours: 6,
    });
  } catch {
    // best-effort
  }

  return c.json({ ok: true, member: updated });
});

householdRoutes.post('/invites/:memberId/decline', async (c) => {
  const userId = resolveUserId(c);
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  const member = await prisma.householdMember.findFirst({
    where: {
      id: c.req.param('memberId'),
      status: 'PENDING',
      OR: [{ userId }, { inviteEmail: me?.email }],
    },
  });
  if (!member) return c.json({ error: 'Invite not found' }, 404);

  await prisma.householdMember.update({
    where: { id: member.id },
    data: { status: 'REVOKED', revokedAt: new Date() },
  });

  await writeAudit(userId, 'household.invite.decline', 'HouseholdMember', member.id);
  return c.json({ ok: true });
});

householdRoutes.post('/grants/:id/revoke', async (c) => {
  const userId = resolveUserId(c);
  const grant = await prisma.careGrant.findFirst({
    where: { id: c.req.param('id'), ownerUserId: userId, active: true },
  });
  if (!grant) return c.json({ error: 'Grant not found' }, 404);

  await prisma.careGrant.update({
    where: { id: grant.id },
    data: { active: false, revokedAt: new Date() },
  });

  await writeAudit(userId, 'care_grant.revoke', 'CareGrant', grant.id);
  return c.json({ ok: true });
});

/** Emergency card payload for self or a granted subject. */
householdRoutes.get('/emergency-card', async (c) => {
  const actorId = resolveUserId(c);
  const subjectUserId = await resolveSubjectUserId(
    actorId,
    c.req.query('forUserId'),
    'EMERGENCY_VIEW'
  );

  const [user, cabinet, allergies, conditions, contacts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: subjectUserId },
      include: { healthProfile: true },
    }),
    prisma.cabinetItem.findMany({
      where: { userId: subjectUserId, active: true },
      include: { substance: { include: { category: true } } },
      take: 50,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.allergy.findMany({ where: { userId: subjectUserId }, take: 50 }),
    prisma.condition.findMany({
      where: { userId: subjectUserId, status: 'ACTIVE' },
      take: 50,
    }),
    prisma.emergencyContact.findMany({
      where: { userId: subjectUserId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      take: 20,
    }),
  ]);

  if (!user) return c.json({ error: 'User not found' }, 404);

  return c.json({
    subject: {
      id: user.id,
      name: user.name,
      healthProfile: user.healthProfile,
    },
    allergies,
    conditions,
    cabinet,
    contacts,
    disclaimer:
      'In a medical emergency, call your local emergency number immediately. This card is informational only.',
  });
});
