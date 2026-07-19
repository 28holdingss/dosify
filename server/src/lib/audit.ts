import { prisma } from './prisma.js';

/**
 * Records an audit event for a mutation. Failures are logged but never block
 * the request that triggered them.
 */
export async function writeAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata: metadata as object | undefined,
      },
    });
  } catch (e) {
    console.error('Failed to write audit event:', action, e);
  }
}
