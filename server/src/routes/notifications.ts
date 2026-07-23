import { Hono } from 'hono';
import { resolveUserId } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

export const notificationRoutes = new Hono();

notificationRoutes.get('/', async (c) => {
  const userId = resolveUserId(c);

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return c.json(notifications);
});

notificationRoutes.patch('/:id/read', async (c) => {
  const userId = resolveUserId(c);

  const result = await prisma.notification.updateMany({
    where: { id: c.req.param('id'), userId },
    data: { read: true },
  });

  if (result.count === 0) return c.json({ error: 'Notification not found' }, 404);
  return c.json({ ok: true });
});

notificationRoutes.patch('/read-all', async (c) => {
  const userId = resolveUserId(c);

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return c.json({ ok: true });
});

/** Delete every inbox notification for the current user. */
notificationRoutes.delete('/', async (c) => {
  const userId = resolveUserId(c);
  await prisma.notification.deleteMany({ where: { userId } });
  return c.json({ ok: true });
});

notificationRoutes.delete('/:id', async (c) => {
  const userId = resolveUserId(c);
  const result = await prisma.notification.deleteMany({
    where: { id: c.req.param('id'), userId },
  });
  if (result.count === 0) return c.json({ error: 'Notification not found' }, 404);
  return c.json({ ok: true });
});
