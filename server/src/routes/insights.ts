import { Hono } from 'hono';
import { resolveUserId } from '../lib/auth.js';
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
