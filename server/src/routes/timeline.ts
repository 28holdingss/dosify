import { Hono } from 'hono';
import { scoreSubstanceEffects } from '../lib/analysis-engine/scoring.js';
import { resolveUserId } from '../lib/auth.js';
import {
  buildImpactHighlights,
  buildPhaseDescription,
  buildSystemInsight,
  buildTimelineFooter,
  categoryLabel,
  generateSubstanceEffectCurve,
  resolvePhaseLabels,
  resolveTimelinePhase,
  estimatePeakWindow,
} from '../lib/effect-timeline.js';
import { formatHourLabel } from '../lib/analytics.js';
import { prisma } from '../lib/prisma.js';

export const timelineRoutes = new Hono();

type IntakeForTimeline = {
  id: string;
  dose: number;
  takenAt: Date;
  substance: {
    name: string;
    minDose: number | null;
    maxDose: number | null;
    defaultUnit: string;
    category: { slug: string; name: string } | null;
    profile: {
      drugClass: string | null;
      halfLifeHours: number | null;
      cognitiveImpact: number;
      cardiovascularImpact: number;
      gastrointestinalImpact: number;
      liverImpact: number;
      kidneyImpact?: number;
      respiratoryImpact?: number;
      typicalDurationMinHours: number | null;
      typicalDurationMaxHours: number | null;
    } | null;
  };
  analysis: {
    cognitiveScore: number;
    cardiovascularScore: number;
    gastrointestinalScore: number;
    liverScore?: number;
    kidneyScore?: number;
    respiratoryScore?: number;
    interactionRiskScore: number;
    durationMinHours: number | null;
    durationMaxHours: number | null;
    summary: string | null;
  };
};

function buildTimelineFromAnalysis(intake: IntakeForTimeline, pointCount = 12) {
  const profile = intake.substance.profile;
  const categorySlug = intake.substance.category?.slug ?? null;
  const substanceCtx = {
    name: intake.substance.name,
    categorySlug,
    drugClass: profile?.drugClass ?? null,
    halfLifeHours: profile?.halfLifeHours ?? null,
  };

  const durationHours = intake.analysis.durationMaxHours ?? 6;
  const start = intake.takenAt;
  const labels = Array.from({ length: pointCount }, (_, i) => {
    const t = new Date(start.getTime() + (i / (pointCount - 1)) * durationHours * 3600000);
    return formatHourLabel(t);
  });

  const primaryForScoring = {
    id: intake.id,
    name: intake.substance.name,
    dose: intake.dose,
    unit: intake.substance.defaultUnit,
    minDose: intake.substance.minDose,
    maxDose: intake.substance.maxDose,
    drugClass: profile?.drugClass ?? null,
    categorySlug,
    halfLifeHours: profile?.halfLifeHours ?? null,
    cognitiveImpact: profile?.cognitiveImpact ?? 0.3,
    cardiovascularImpact: profile?.cardiovascularImpact ?? 0.2,
    gastrointestinalImpact: profile?.gastrointestinalImpact ?? 0.2,
    liverImpact: profile?.liverImpact ?? 0.1,
    kidneyImpact: profile?.kidneyImpact ?? 0.1,
    respiratoryImpact: profile?.respiratoryImpact ?? 0.1,
    typicalDurationMinHours: profile?.typicalDurationMinHours ?? null,
    typicalDurationMaxHours: profile?.typicalDurationMaxHours ?? null,
  };

  const scored =
    profile != null
      ? scoreSubstanceEffects(primaryForScoring, intake.analysis.interactionRiskScore, {
          allergies: null,
          medicalConditions: null,
          age: null,
          weightKg: null,
        })
      : null;

  const liverScore =
    intake.analysis.liverScore ??
    scored?.liverScore ??
    Math.round(intake.analysis.cognitiveScore * 0.15);
  const kidneyScore =
    intake.analysis.kidneyScore ?? scored?.kidneyScore ?? Math.round(liverScore * 0.6);
  const respiratoryScore =
    intake.analysis.respiratoryScore ??
    scored?.respiratoryScore ??
    Math.round(intake.analysis.cognitiveScore * 0.35);

  const cognitive = generateSubstanceEffectCurve(
    intake.analysis.cognitiveScore,
    pointCount,
    substanceCtx,
    'cognitive'
  );
  const cardiovascular = generateSubstanceEffectCurve(
    intake.analysis.cardiovascularScore,
    pointCount,
    substanceCtx,
    'cardiovascular'
  );
  const gastrointestinal = generateSubstanceEffectCurve(
    intake.analysis.gastrointestinalScore,
    pointCount,
    substanceCtx,
    'gastrointestinal'
  );
  const liver = generateSubstanceEffectCurve(liverScore, pointCount, substanceCtx, 'liver');
  const kidney = generateSubstanceEffectCurve(kidneyScore, pointCount, substanceCtx, 'kidney');
  const respiratory = generateSubstanceEffectCurve(
    respiratoryScore,
    pointCount,
    substanceCtx,
    'respiratory'
  );

  const elapsedHours = (Date.now() - start.getTime()) / 3600000;
  const markerIndex = Math.min(
    pointCount - 1,
    Math.max(0, Math.round((elapsedHours / durationHours) * (pointCount - 1)))
  );

  const peakIndex = cognitive.indexOf(Math.max(...cognitive));
  const peakTime = new Date(
    start.getTime() + (peakIndex / (pointCount - 1)) * durationHours * 3600000
  );

  const markerTime = new Date(start.getTime() + elapsedHours * 3600000);
  const hoursFromStart = Math.max(0, Math.round(elapsedHours * 10) / 10);

  const phase = resolveTimelinePhase(markerIndex, peakIndex, pointCount);
  const phaseLabels = resolvePhaseLabels(substanceCtx);
  const phaseDescription = buildPhaseDescription(substanceCtx, phase);

  const scoresAtMarker = {
    cognitive: cognitive[markerIndex] ?? 0,
    cardiovascular: cardiovascular[markerIndex] ?? 0,
    gastrointestinal: gastrointestinal[markerIndex] ?? 0,
    liver: liver[markerIndex] ?? 0,
    kidney: kidney[markerIndex] ?? 0,
    respiratory: respiratory[markerIndex] ?? 0,
  };

  const systemInsights = {
    cognitive: buildSystemInsight(substanceCtx, 'cognitive', scoresAtMarker.cognitive, phase),
    cardiovascular: buildSystemInsight(
      substanceCtx,
      'cardiovascular',
      scoresAtMarker.cardiovascular,
      phase
    ),
    gastrointestinal: buildSystemInsight(
      substanceCtx,
      'gastrointestinal',
      scoresAtMarker.gastrointestinal,
      phase
    ),
    liver: buildSystemInsight(substanceCtx, 'liver', scoresAtMarker.liver, phase),
    kidney: buildSystemInsight(substanceCtx, 'kidney', scoresAtMarker.kidney, phase),
    respiratory: buildSystemInsight(
      substanceCtx,
      'respiratory',
      scoresAtMarker.respiratory,
      phase
    ),
  };

  const impactHighlights = buildImpactHighlights(substanceCtx, phase, scoresAtMarker);
  const peakWindow = estimatePeakWindow(
    intake.analysis.durationMinHours,
    intake.analysis.durationMaxHours
  );

  const insightParts = [
    systemInsights.cognitive,
    systemInsights.cardiovascular,
    scoresAtMarker.gastrointestinal >= 25 ? systemInsights.gastrointestinal : null,
    scoresAtMarker.liver >= 25 ? systemInsights.liver : null,
    scoresAtMarker.kidney >= 25 ? systemInsights.kidney : null,
    scoresAtMarker.respiratory >= 25 ? systemInsights.respiratory : null,
  ].filter(Boolean);

  return {
    intakeId: intake.id,
    substanceName: intake.substance.name,
    categorySlug,
    categoryLabel: categoryLabel(categorySlug),
    drugClass: profile?.drugClass ?? null,
    takenAt: intake.takenAt.toISOString(),
    durationMinHours: intake.analysis.durationMinHours,
    durationMaxHours: intake.analysis.durationMaxHours,
    peakWindowStart: peakWindow.startHours,
    peakWindowEnd: peakWindow.endHours,
    labels,
    series: { cognitive, cardiovascular, gastrointestinal, liver, kidney, respiratory },
    markerIndex,
    peakIndex,
    peakTime: peakTime.toISOString(),
    markerTime: markerTime.toISOString(),
    hoursFromStart,
    phase,
    phaseLabels,
    phaseDescription,
    systemInsights,
    impactHighlights,
    insight: insightParts.join(' '),
    summary: intake.analysis.summary,
    footer: buildTimelineFooter(substanceCtx, phase),
  };
}

const intakeInclude = {
  substance: { include: { profile: true, category: true } },
  analysis: true,
} as const;

timelineRoutes.get('/', async (c) => {
  const userId = resolveUserId(c);
  const intakeId = c.req.query('intakeId');

  if (intakeId) {
    const intake = await prisma.intakeLog.findFirst({
      where: { id: intakeId, userId },
      include: intakeInclude,
    });
    if (!intake?.analysis) {
      return c.json({ error: 'No analysis found for this intake' }, 404);
    }
    return c.json(buildTimelineFromAnalysis(intake as IntakeForTimeline));
  }

  const latest = await prisma.intakeLog.findFirst({
    where: { userId, status: 'ANALYZED', analysis: { isNot: null } },
    orderBy: { takenAt: 'desc' },
    include: intakeInclude,
  });

  if (!latest?.analysis) {
    return c.json({
      empty: true,
      message: 'Log and analyze a substance to see your effect timeline.',
    });
  }

  return c.json(buildTimelineFromAnalysis(latest as IntakeForTimeline));
});
