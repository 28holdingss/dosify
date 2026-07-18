import { Hono } from 'hono';
import { resolveUserId } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { rangeToDays, startOfDay } from '../lib/analytics.js';
import { scoreToRiskLevel, trendDirection } from '../lib/reports.js';

export const trendsRoutes = new Hono();

trendsRoutes.get('/', async (c) => {
  const userId = resolveUserId(c);
  const range = c.req.query('range') ?? '90D';
  const category = c.req.query('category') ?? 'Substances';

  const days = rangeToDays(range);
  const since = startOfDay(new Date(Date.now() - (days - 1) * 86400000));

  const [intakes, recoverySnapshots] = await Promise.all([
    prisma.intakeLog.findMany({
      where: { userId, takenAt: { gte: since } },
      include: { substance: { include: { category: true } }, analysis: true },
      orderBy: { takenAt: 'asc' },
    }),
    prisma.recoverySnapshot.findMany({
      where: { userId, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'asc' },
    }),
  ]);

  const bucketCount = range === '7D' ? 7 : range === '30D' ? 6 : range === '1Y' ? 12 : 6;
  const bucketMs = (days * 86400000) / bucketCount;

  const labels: string[] = [];
  const values: number[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = new Date(since.getTime() + i * bucketMs);
    const bucketEnd = new Date(bucketStart.getTime() + bucketMs);

    if (range === '1Y') {
      labels.push(bucketStart.toLocaleDateString('en-US', { month: 'short' }));
    } else if (range === '7D') {
      labels.push(bucketStart.toLocaleDateString('en-US', { weekday: 'short' }));
    } else {
      labels.push(
        `${bucketStart.getMonth() + 1}/${bucketStart.getDate()}`
      );
    }

    if (category === 'Substances') {
      values.push(
        intakes.filter((i) => i.takenAt >= bucketStart && i.takenAt < bucketEnd).length
      );
    } else if (category === 'Risk') {
      const bucketIntakes = intakes.filter(
        (i) => i.takenAt >= bucketStart && i.takenAt < bucketEnd && i.analysis
      );
      values.push(
        bucketIntakes.length > 0
          ? Math.round(
              bucketIntakes.reduce((sum, i) => sum + i.analysis!.overallScore, 0) /
                bucketIntakes.length
            )
          : 0
      );
    } else if (category === 'Sleep') {
      const snaps = recoverySnapshots.filter(
        (s) => s.recordedAt >= bucketStart && s.recordedAt < bucketEnd
      );
      values.push(
        snaps.length > 0
          ? Math.round(snaps.reduce((sum, s) => sum + s.sleepPct, 0) / snaps.length)
          : 0
      );
    } else if (category === 'Heart') {
      const snaps = recoverySnapshots.filter(
        (s) => s.recordedAt >= bucketStart && s.recordedAt < bucketEnd
      );
      values.push(
        snaps.length > 0
          ? Math.round(snaps.reduce((sum, s) => sum + s.cardiovascularPct, 0) / snaps.length)
          : 0
      );
    } else {
      const snaps = recoverySnapshots.filter(
        (s) => s.recordedAt >= bucketStart && s.recordedAt < bucketEnd
      );
      values.push(
        snaps.length > 0
          ? Math.round(snaps.reduce((sum, s) => sum + s.score, 0) / snaps.length)
          : 0
      );
    }
  }

  const countMap = new Map<string, number>();
  for (const intake of intakes) {
    countMap.set(intake.substance.name, (countMap.get(intake.substance.name) ?? 0) + 1);
  }

  const mostLogged = [...countMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const analyzedIntakes = intakes.filter((i) => i.analysis);
  const avgRisk =
    analyzedIntakes.length > 0
      ? Math.round(
          analyzedIntakes.reduce((sum, i) => sum + i.analysis!.overallScore, 0) /
            analyzedIntakes.length
        )
      : 0;

  const riskBySubstance = new Map<string, { total: number; count: number }>();
  for (const intake of analyzedIntakes) {
    const entry = riskBySubstance.get(intake.substance.name) ?? { total: 0, count: 0 };
    entry.total += intake.analysis!.overallScore;
    entry.count += 1;
    riskBySubstance.set(intake.substance.name, entry);
  }

  const highestRiskSubstances = [...riskBySubstance.entries()]
    .map(([name, data]) => ({
      name,
      avgRisk: Math.round(data.total / data.count),
      count: data.count,
      riskLevel: scoreToRiskLevel(Math.round(data.total / data.count)),
    }))
    .sort((a, b) => b.avgRisk - a.avgRisk)
    .slice(0, 5);

  const direction = trendDirection(values);
  const invertTrend = category === 'Risk';
  const trendLabel =
    direction === 'flat'
      ? 'Stable over this period'
      : direction === 'up'
        ? invertTrend
          ? 'Risk trending up'
          : 'Trending up'
        : invertTrend
          ? 'Risk trending down'
          : 'Trending down';

  return c.json({
    range,
    category,
    chart: { labels, values },
    mostLogged,
    highestRiskSubstances,
    summary: {
      totalIntakes: intakes.length,
      analyzedIntakes: analyzedIntakes.length,
      avgRisk,
      trendDirection: direction,
      trendLabel,
    },
  });
});
