import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { auth } from './lib/better-auth.js';
import { prisma } from './lib/prisma.js';
import { intakeRoutes } from './routes/intakes.js';
import { interactionRoutes } from './routes/interactions.js';
import { notificationRoutes } from './routes/notifications.js';
import { recoveryRoutes } from './routes/recovery.js';
import { substanceRoutes } from './routes/substances.js';
import { userRoutes } from './routes/users.js';
import { insightsRoutes } from './routes/insights.js';
import { trendsRoutes } from './routes/trends.js';
import { timelineRoutes } from './routes/timeline.js';
import { wearableRoutes } from './routes/wearables.js';

const app = new Hono<{
  Variables: {
    userId: string | null;
  };
}>();

app.use('*', logger());
app.use(
  '*',
  cors({
    // Reflect the request origin so credentialed (cookie) requests work.
    origin: (origin) => origin || '*',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-user-id'],
  })
);

app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));

// Resolve the Better Auth session once and expose the user id to all routes.
app.use('*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set('userId', session?.user.id ?? null);
  await next();
});

app.get('/health', async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ status: 'ok', database: 'connected' });
  } catch {
    return c.json({ status: 'error', database: 'disconnected' }, 503);
  }
});

app.route('/api/users', userRoutes);
app.route('/api/substances', substanceRoutes);
app.route('/api/intakes', intakeRoutes);
app.route('/api/interactions', interactionRoutes);
app.route('/api/recovery', recoveryRoutes);
app.route('/api/notifications', notificationRoutes);
app.route('/api/insights', insightsRoutes);
app.route('/api/trends', trendsRoutes);
app.route('/api/timeline', timelineRoutes);
app.route('/api/wearables', wearableRoutes);

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Dosify API running at http://localhost:${port}`);
});
