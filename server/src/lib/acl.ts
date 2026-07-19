import { HTTPException } from 'hono/http-exception';
import type { CareGrantScope } from '@prisma/client';
import { prisma } from './prisma.js';

const SCOPE_RANK: Record<CareGrantScope, number> = {
  EMERGENCY_VIEW: 1,
  REPORTS_VIEW: 2,
  FULL_READ: 3,
};

/**
 * Returns true when the actor may access the subject's health data for the
 * requested scope. Owners always pass. Caregivers need an active grant whose
 * scope is at least as broad as `required`.
 */
export async function canAccessSubject(
  actorUserId: string,
  subjectUserId: string,
  required: CareGrantScope
): Promise<boolean> {
  if (actorUserId === subjectUserId) return true;

  const grants = await prisma.careGrant.findMany({
    where: {
      caregiverUserId: actorUserId,
      ownerUserId: subjectUserId,
      active: true,
    },
    select: { scope: true },
    take: 10,
  });

  const needed = SCOPE_RANK[required];
  return grants.some((g) => SCOPE_RANK[g.scope] >= needed);
}

export async function assertCanAccessSubject(
  actorUserId: string,
  subjectUserId: string,
  required: CareGrantScope
): Promise<void> {
  const ok = await canAccessSubject(actorUserId, subjectUserId, required);
  if (!ok) {
    throw new HTTPException(403, { message: 'Care grant required for this profile' });
  }
}

/** Resolve optional ?forUserId= to a subject the actor may access. */
export async function resolveSubjectUserId(
  actorUserId: string,
  forUserId: string | undefined,
  required: CareGrantScope
): Promise<string> {
  const subject = forUserId?.trim() || actorUserId;
  await assertCanAccessSubject(actorUserId, subject, required);
  return subject;
}
