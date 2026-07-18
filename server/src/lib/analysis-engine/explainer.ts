import { chatCompletion } from '../ai/chat.js';
import {
  assessDose,
  doseAssessmentLabel,
  estimatePeakWindow,
  scoreToRiskLevel,
} from '../reports.js';
import {
  buildSubstanceRecommendations,
} from './substance-recommendations.js';
import type { AnalysisResult, DetectedInteraction, SubstanceContext } from './types.js';
import { ENGINE_VERSION } from './types.js';

type ExplainInput = {
  primary: SubstanceContext;
  scores: {
    overallScore: number;
    cognitiveScore: number;
    cardiovascularScore: number;
    gastrointestinalScore: number;
    interactionRiskScore: number;
  };
  duration: { min: number; max: number };
  interactions: DetectedInteraction[];
  purpose?: string | null;
};

function riskLabel(score: number): string {
  if (score >= 70) return 'high';
  if (score >= 40) return 'moderate';
  return 'low';
}

function buildTemplateExplanation(input: ExplainInput): {
  summary: string;
  recommendations: string[];
  warnings: string[];
} {
  const { primary, scores, duration, interactions, purpose } = input;
  const level = riskLabel(scores.overallScore);
  const doseLevel = assessDose(primary.dose, primary.minDose, primary.maxDose);
  const peak = estimatePeakWindow(duration.min, duration.max);

  const dominant =
    [
      { key: 'cognitive', score: scores.cognitiveScore, label: 'cognitive' },
      { key: 'cardio', score: scores.cardiovascularScore, label: 'cardiovascular' },
      { key: 'gi', score: scores.gastrointestinalScore, label: 'gastrointestinal' },
    ].sort((a, b) => b.score - a.score)[0]?.label ?? 'general';

  const summary = `Your ${primary.name} log (${primary.dose} ${primary.unit}, ${doseAssessmentLabel(doseLevel).toLowerCase()}) shows ${level} overall risk. The strongest expected impact is ${dominant}, with effects lasting about ${duration.min}–${duration.max} hours. Peak intensity is likely between ${peak.startHours}–${peak.endHours} hours after intake.${
    interactions.length > 0
      ? ` ${interactions.length} interaction${interactions.length > 1 ? 's' : ''} involving ${primary.name} ${interactions.length > 1 ? 'were' : 'was'} detected with other active substances.`
      : ` No major interactions were detected between ${primary.name} and your other recent logs.`
  }`;

  const recommendations = buildSubstanceRecommendations({
    primary,
    scores: {
      cognitiveScore: scores.cognitiveScore,
      cardiovascularScore: scores.cardiovascularScore,
      gastrointestinalScore: scores.gastrointestinalScore,
    },
    duration,
    peak,
    doseLevel,
  });

  const warnings: string[] = [];

  if (doseLevel === 'high') {
    warnings.push(`${primary.name} dose is above the typical upper range for this substance.`);
  }

  for (const interaction of interactions) {
    warnings.push(`${interaction.title}: ${interaction.description}`);
    if (interaction.advice) {
      recommendations.push(interaction.advice);
    }
  }

  if (purpose?.trim()) {
    recommendations.push(`Your logged purpose for ${primary.name}: ${purpose.trim()}.`);
  }

  if (scores.interactionRiskScore >= 70) {
    warnings.push(
      `High interaction risk for ${primary.name} — review combinations before taking more substances.`
    );
  }

  return {
    summary,
    recommendations: [...new Set(recommendations)],
    warnings,
  };
}

async function buildAiExplanation(input: ExplainInput): Promise<{
  summary: string;
  recommendations: string[];
  warnings: string[];
} | null> {
  const doseLevel = assessDose(input.primary.dose, input.primary.minDose, input.primary.maxDose);
  const peak = estimatePeakWindow(input.duration.min, input.duration.max);

  const prompt = `You are a cautious health assistant for a substance tracking app. NOT medical advice.

Analyze this intake and respond ONLY with valid JSON:
{
  "summary": "2-3 sentence plain-language summary",
  "recommendations": ["actionable tip 1", "tip 2"],
  "warnings": ["warning if any"]
}

IMPORTANT:
- All advice must be specific to the LOGGED substance below.
- Do NOT mention ibuprofen, aspirin, or other substances unless they appear in Interactions.
- Name the substance in each recommendation.
- Be conservative. Never claim certainty.

Substance: ${input.primary.name} ${input.primary.dose} ${input.primary.unit}
Drug class: ${input.primary.drugClass ?? 'unknown'}
Dose assessment: ${doseAssessmentLabel(doseLevel)}
Scores (0-100): overall=${input.scores.overallScore}, cognitive=${input.scores.cognitiveScore}, cardio=${input.scores.cardiovascularScore}, GI=${input.scores.gastrointestinalScore}, interactions=${input.scores.interactionRiskScore}
Duration: ${input.duration.min}-${input.duration.max} hours
Peak window: ${peak.startHours}-${peak.endHours}h
Interactions involving ${input.primary.name}: ${input.interactions.map((i) => `${i.title} (${i.riskLevel})`).join(', ') || 'none'}
Purpose: ${input.purpose ?? 'not specified'}`;

  const result = await chatCompletion({
    temperature: 0.3,
    jsonMode: true,
    messages: [
      { role: 'system', content: 'Respond with JSON only. Be medically cautious.' },
      { role: 'user', content: prompt },
    ],
  });

  if (!result) return null;

  try {
    const parsed = JSON.parse(result.content) as {
      summary?: string;
      recommendations?: string[];
      warnings?: string[];
    };

    if (!parsed.summary) return null;

    return {
      summary: parsed.summary,
      recommendations: parsed.recommendations ?? [],
      warnings: parsed.warnings ?? [],
    };
  } catch {
    return null;
  }
}

export async function explainAnalysis(input: ExplainInput): Promise<{
  summary: string;
  recommendations: string[];
  warnings: string[];
  aiGenerated: boolean;
}> {
  const ai = await buildAiExplanation(input);
  if (ai) {
    return { ...ai, aiGenerated: true };
  }

  const template = buildTemplateExplanation(input);
  return { ...template, aiGenerated: false };
}

export function buildAnalysisResult(
  scores: ExplainInput['scores'] & { liverScore?: number },
  duration: { min: number; max: number },
  explanation: {
    summary: string;
    recommendations: string[];
    warnings: string[];
    aiGenerated: boolean;
  },
  interactions: DetectedInteraction[]
): AnalysisResult {
  return {
    overallScore: scores.overallScore,
    cognitiveScore: scores.cognitiveScore,
    cardiovascularScore: scores.cardiovascularScore,
    gastrointestinalScore: scores.gastrointestinalScore,
    interactionRiskScore: scores.interactionRiskScore,
    durationMinHours: duration.min,
    durationMaxHours: duration.max,
    summary: explanation.summary,
    recommendations: explanation.recommendations,
    warnings: explanation.warnings,
    aiGenerated: explanation.aiGenerated,
    detectedInteractions: interactions,
  };
}

export { ENGINE_VERSION };
