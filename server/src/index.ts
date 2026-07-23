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
import { cabinetRoutes } from './routes/cabinet.js';
import { scheduleRoutes } from './routes/schedules.js';
import { doseRoutes } from './routes/doses.js';
import { dailySnapshotRoutes } from './routes/daily-snapshot.js';
import { interactionCheckRoutes } from './routes/interaction-checks.js';
import { productRoutes } from './routes/products.js';
import { knowledgeRoutes } from './routes/knowledge.js';
import { emergencyContactRoutes } from './routes/emergency-contacts.js';
import { symptomRoutes } from './routes/symptoms.js';
import { reportRoutes } from './routes/reports.js';
import { householdRoutes } from './routes/households.js';
import { billingRoutes } from './routes/billing.js';
import { aiRoutes } from './routes/ai.js';

const app = new Hono<{
  Variables: {
    userId: string | null;
  };
}>();

// Credentialed CORS is restricted to configured web origins plus localhost
// dev servers. Native apps (custom scheme / no Origin header) are unaffected.
const configuredWebOrigins = (process.env.WEB_APP_URL ?? '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);
const devOrigins = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:19006',
];
const allowedWebOrigins = new Set([...configuredWebOrigins, ...devOrigins]);

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return origin;
      if (allowedWebOrigins.has(origin)) return origin;
      // Native app / Expo dev-client origins.
      if (origin.startsWith('dosify://') || origin.startsWith('exp://')) return origin;
      return '';
    },
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
app.route('/api/cabinet', cabinetRoutes);
app.route('/api/schedules', scheduleRoutes);
app.route('/api/doses', doseRoutes);
app.route('/api/daily-snapshot', dailySnapshotRoutes);
app.route('/api/interaction-checks', interactionCheckRoutes);
app.route('/api/products', productRoutes);
app.route('/api/knowledge', knowledgeRoutes);
app.route('/api/emergency-contacts', emergencyContactRoutes);
app.route('/api/symptoms', symptomRoutes);
app.route('/api/reports', reportRoutes);
app.route('/api/households', householdRoutes);
app.route('/api/billing', billingRoutes);
app.route('/api/ai', aiRoutes);

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Dosify API running at http://localhost:${port}`);
});
