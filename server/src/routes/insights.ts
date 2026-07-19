import { Hono } from 'hono';
import { resolveUserId } from '../lib/auth.js';
import { assertPremium } from '../lib/entitlements.js';
import { prisma } from '../lib/prisma.js';
import {
  avgAnalysisScores,
  buildWeeklyNarrative,
  riskLevelLabel,
  scoreToRiskLevel,
} from '../lib/reports.js';
import {
  dayLabels,
  daysAgo,
  percentChange,
} from '../lib/analytics.js';

export const insightsRoutes = new Hono();

insightsRoutes.get('/', async (c) => {
  const userId = resolveUserId(c);
  const thisWeekStart = daysAgo(6);
  const lastWeekStart = daysAgo(13);
  const lastWeekEnd = daysAgo(7);

  const [thisWeekIntakes, lastWeekIntakes, recoveryThisWeek, recoveryLastWeek] =
    await Promise.all([
      prisma.intakeLog.findMany({
        where: { userId, takenAt: { gte: thisWeekStart } },
        include: { substance: true, analysis: true },
      }),
      prisma.intakeLog.findMany({
        where: { userId, takenAt: { gte: lastWeekStart, lt: lastWeekEnd } },
        include: { substance: true, analysis: true },
      }),
      prisma.recoverySnapshot.findMany({
        where: { userId, recordedAt: { gte: thisWeekStart } },
        orderBy: { recordedAt: 'asc' },
      }),
      prisma.recoverySnapshot.findMany({
        where: { userId, recordedAt: { gte: lastWeekStart, lt: lastWeekEnd } },
        orderBy: { recordedAt: 'asc' },
      }),
    ]);

  const alcoholUnits = (intakes: typeof thisWeekIntakes) =>
    intakes
      .filter((i) => i.substance.name === 'Alcohol')
      .reduce((sum, i) => sum + i.dose, 0);

  const avgRisk = (intakes: typeof thisWeekIntakes) => {
    const scores = intakes.map((i) => i.analysis?.overallScore).filter((s): s is number => s != null);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const avgRecovery = (snapshots: typeof recoveryThisWeek) => {
    if (snapshots.length === 0) return 0;
    return Math.round(snapshots.reduce((sum, s) => sum + s.score, 0) / snapshots.length);
  };

  const thisAlcohol = alcoholUnits(thisWeekIntakes);
  const lastAlcohol = alcoholUnits(lastWeekIntakes);
  const thisRisk = avgRisk(thisWeekIntakes);
  const lastRisk = avgRisk(lastWeekIntakes);
  const thisRecovery = avgRecovery(recoveryThisWeek);
  const lastRecovery = avgRecovery(recoveryLastWeek);

  const comparisons = [
    {
      label: 'Total Intakes',
      thisWeek: thisWeekIntakes.length,
      lastWeek: lastWeekIntakes.length,
      changePercent: percentChange(thisWeekIntakes.length, lastWeekIntakes.length),
    },
    {
      label: 'Alcohol Units',
      thisWeek: Math.round(thisAlcohol * 10) / 10,
      lastWeek: Math.round(lastAlcohol * 10) / 10,
      changePercent: percentChange(thisAlcohol, lastAlcohol),
    },
    {
      label: 'Avg Risk Score',
      thisWeek: thisRisk,
      lastWeek: lastRisk,
      changePercent: percentChange(thisRisk, lastRisk),
      invertColors: true,
    },
    {
      label: 'Recovery Score',
      thisWeek: thisRecovery,
      lastWeek: lastRecovery,
      changePercent: percentChange(thisRecovery, lastRecovery),
    },
  ].map((item) => ({
    ...item,
    up: item.invertColors
      ? item.changePercent > 0
      : item.changePercent > 0,
  }));

  const riskTrendLabels = dayLabels(7);
  const riskTrendValues: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = daysAgo(i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const dayIntakes = thisWeekIntakes.filter(
      (intake) => intake.takenAt >= dayStart && intake.takenAt < dayEnd
    );
    riskTrendValues.push(avgRisk(dayIntakes) || thisRisk || 0);
  }

  const substanceCounts = new Map<string, { count: number; avgRisk: number; scores: number[] }>();
  for (const intake of thisWeekIntakes) {
    const name = intake.substance.name;
    const entry = substanceCounts.get(name) ?? { count: 0, avgRisk: 0, scores: [] };
    entry.count += 1;
    if (intake.analysis?.overallScore != null) {
      entry.scores.push(intake.analysis.overallScore);
    }
    substanceCounts.set(name, entry);
  }

  let topPositiveImpact: {
    substance: string;
    improvementPct: number;
    message: string;
  } | null = null;

  for (const [name, data] of substanceCounts) {
    if (data.scores.length === 0) continue;
    const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    const improvement = Math.max(0, Math.round(100 - avg));
    if (!topPositiveImpact || improvement > topPositiveImpact.improvementPct) {
      topPositiveImpact = {
        substance: name,
        improvementPct: improvement,
        message: `${name} is associated with a lower risk profile this week (${Math.round(avg)}/100 avg).`,
      };
    }
  }

  const dayCount = new Map<string, number>();
  for (const intake of thisWeekIntakes) {
    const day = intake.takenAt.toLocaleDateString('en-US', { weekday: 'long' });
    dayCount.set(day, (dayCount.get(day) ?? 0) + 1);
  }
  const busiestDay = [...dayCount.entries()].sort((a, b) => b[1] - a[1])[0];

  const patterns = [
    {
      title: 'Busiest Day',
      value: busiestDay ? `${busiestDay[0]} (${busiestDay[1]} intakes)` : 'No data yet',
    },
    {
      title: 'Most Logged',
      value: [...substanceCounts.entries()].sort((a, b) => b[1].count - a[1].count)[0]?.[0] ?? '—',
    },
    {
      title: 'High-Risk Logs',
      value: String(thisWeekIntakes.filter((i) => (i.analysis?.overallScore ?? 0) >= 70).length),
    },
  ];

  const stats = {
    totalIntakes: thisWeekIntakes.length,
    uniqueSubstances: new Set(thisWeekIntakes.map((i) => i.substanceId)).size,
    analysesRun: thisWeekIntakes.filter((i) => i.analysis).length,
    interactionAlerts: await prisma.interaction.count({ where: { userId, snoozedUntil: null } }),
    highRiskLogs: thisWeekIntakes.filter((i) => (i.analysis?.overallScore ?? 0) >= 70).length,
    avgRiskThisWeek: thisRisk,
  };

  const impactBreakdown = avgAnalysisScores(thisWeekIntakes);
  const impactTrend = {
    labels: riskTrendLabels,
    cognitive: [] as number[],
    cardiovascular: [] as number[],
    gastrointestinal: [] as number[],
  };

  for (let i = 6; i >= 0; i--) {
    const dayStart = daysAgo(i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const dayIntakes = thisWeekIntakes.filter(
      (intake) => intake.takenAt >= dayStart && intake.takenAt < dayEnd
    );
    const dayScores = avgAnalysisScores(dayIntakes);
    impactTrend.cognitive.push(dayScores.cognitive);
    impactTrend.cardiovascular.push(dayScores.cardiovascular);
    impactTrend.gastrointestinal.push(dayScores.gastrointestinal);
  }

  const recentAnalyses = thisWeekIntakes
    .filter((i) => i.analysis)
    .sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime())
    .slice(0, 5)
    .map((i) => ({
      intakeId: i.id,
      substanceName: i.substance.name,
      takenAt: i.takenAt.toISOString(),
      overallScore: i.analysis!.overallScore,
      riskLevel: scoreToRiskLevel(i.analysis!.overallScore),
      riskLabel: riskLevelLabel(scoreToRiskLevel(i.analysis!.overallScore)),
    }));

  const weeklyNarrative = buildWeeklyNarrative({
    totalIntakes: thisWeekIntakes.length,
    avgRisk: thisRisk,
    avgRiskChange: percentChange(thisRisk, lastRisk),
    highRiskCount: stats.highRiskLogs,
    interactionAlerts: stats.interactionAlerts,
    topSubstance: [...substanceCounts.entries()].sort((a, b) => b[1].count - a[1].count)[0]?.[0] ?? null,
  });

  return c.json({
    comparisons,
    riskTrend: { labels: riskTrendLabels, values: riskTrendValues },
    impactTrend,
    impactBreakdown,
    weeklyNarrative,
    recentAnalyses,
    topPositiveImpact,
    patterns,
    stats,
  });
});

/**
 * Observational correlations across adherence, wearables, and symptoms.
 * Premium-gated. Always states correlation — never causation.
 */
insightsRoutes.get('/observational', async (c) => {
  const userId = resolveUserId(c);
  await assertPremium(userId, 'observational insights');

  const windowDays = Math.min(90, Math.max(7, Number(c.req.query('days') || 28)));
  const from = daysAgo(windowDays - 1);

  const [doses, wearables, symptoms] = await Promise.all([
    prisma.doseEvent.findMany({
      where: { userId, scheduledFor: { gte: from } },
      select: { scheduledFor: true, status: true },
      take: 5000,
    }),
    prisma.wearableSnapshot.findMany({
      where: { userId, recordedAt: { gte: from } },
      orderBy: { recordedAt: 'asc' },
      take: 500,
    }),
    prisma.symptomLog.findMany({
      where: { userId, occurredAt: { gte: from } },
      select: { occurredAt: true, severity: true },
      take: 500,
    }),
  ]);

  const byDay = new Map<
    string,
    { taken: number; dueish: number; sleep: number[]; hr: number[]; symptoms: number }
  >();

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);

  for (const dose of doses) {
    const key = dayKey(dose.scheduledFor);
    const row = byDay.get(key) ?? { taken: 0, dueish: 0, sleep: [], hr: [], symptoms: 0 };
    row.dueish += 1;
    if (dose.status === 'TAKEN') row.taken += 1;
    byDay.set(key, row);
  }

  for (const w of wearables) {
    const key = dayKey(w.recordedAt);
    const row = byDay.get(key) ?? { taken: 0, dueish: 0, sleep: [], hr: [], symptoms: 0 };
    if (w.sleepHours != null) row.sleep.push(w.sleepHours);
    if (w.heartRateAvg != null) row.hr.push(w.heartRateAvg);
    byDay.set(key, row);
  }

  for (const s of symptoms) {
    const key = dayKey(s.occurredAt);
    const row = byDay.get(key) ?? { taken: 0, dueish: 0, sleep: [], hr: [], symptoms: 0 };
    row.symptoms += s.severity ?? 1;
    byDay.set(key, row);
  }

  const series = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, row]) => ({
      date,
      adherencePct: row.dueish > 0 ? Math.round((row.taken / row.dueish) * 100) : null,
      sleepHours:
        row.sleep.length > 0
          ? Math.round((row.sleep.reduce((a, b) => a + b, 0) / row.sleep.length) * 10) / 10
          : null,
      heartRateAvg:
        row.hr.length > 0
          ? Math.round(row.hr.reduce((a, b) => a + b, 0) / row.hr.length)
          : null,
      symptomLoad: row.symptoms,
    }));

  const pairedSleep = series.filter((d) => d.adherencePct != null && d.sleepHours != null);
  const pairedHr = series.filter((d) => d.adherencePct != null && d.heartRateAvg != null);

  function pearson(
    xs: number[],
    ys: number[]
  ): { r: number | null; n: number } {
    const n = Math.min(xs.length, ys.length);
    if (n < 5) return { r: null, n };
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let dx = 0;
    let dy = 0;
    for (let i = 0; i < n; i++) {
      const x = xs[i]! - mx;
      const y = ys[i]! - my;
      num += x * y;
      dx += x * x;
      dy += y * y;
    }
    const den = Math.sqrt(dx * dy);
    if (den === 0) return { r: null, n };
    return { r: Math.round((num / den) * 100) / 100, n };
  }

  const sleepCorr = pearson(
    pairedSleep.map((d) => d.adherencePct as number),
    pairedSleep.map((d) => d.sleepHours as number)
  );
  const hrCorr = pearson(
    pairedHr.map((d) => d.adherencePct as number),
    pairedHr.map((d) => d.heartRateAvg as number)
  );

  const findings = [
    {
      id: 'adherence_sleep',
      title: 'Adherence vs sleep',
      correlation: sleepCorr.r,
      sampleDays: sleepCorr.n,
      interpretation:
        sleepCorr.r == null
          ? 'Not enough overlapping days with both dose adherence and sleep data (need ≥5).'
          : sleepCorr.r >= 0.3
            ? 'Higher adherence days tended to coincide with more sleep in this window. This is correlation only.'
            : sleepCorr.r <= -0.3
              ? 'Higher adherence days tended to coincide with less sleep in this window. This is correlation only.'
              : 'No strong linear relationship between adherence and sleep in this window.',
    },
    {
      id: 'adherence_heart_rate',
      title: 'Adherence vs average heart rate',
      correlation: hrCorr.r,
      sampleDays: hrCorr.n,
      interpretation:
        hrCorr.r == null
          ? 'Not enough overlapping days with both dose adherence and heart-rate data (need ≥5).'
          : hrCorr.r >= 0.3
            ? 'Higher adherence days tended to coincide with higher average heart rate. This is correlation only.'
            : hrCorr.r <= -0.3
              ? 'Higher adherence days tended to coincide with lower average heart rate. This is correlation only.'
              : 'No strong linear relationship between adherence and heart rate in this window.',
    },
  ];

  return c.json({
    windowDays,
    from: from.toISOString(),
    to: new Date().toISOString(),
    series,
    findings,
    symptomDays: series.filter((d) => d.symptomLoad > 0).length,
    disclaimer:
      'These findings describe statistical association in your data for the selected window. They do not establish causation, diagnosis, or treatment advice.',
  });
});
