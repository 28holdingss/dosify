import type { RiskLevel } from '@/types/api';

/** Ephemeral cache so check-interactions can pass results to interaction-check. */
export type LastInteractionCheckResult = {
  interactions: Array<{
    title: string;
    riskLevel: string;
    description: string;
    advice?: string;
    source?: string;
  }>;
  count: number;
  riskScore?: number;
  checkedAt: string;
};

let lastResult: LastInteractionCheckResult | null = null;

export function setLastInteractionCheck(result: Omit<LastInteractionCheckResult, 'checkedAt'>) {
  lastResult = { ...result, checkedAt: new Date().toISOString() };
}

export function getLastInteractionCheck(): LastInteractionCheckResult | null {
  return lastResult;
}

export function clearLastInteractionCheck() {
  lastResult = null;
}

export function highestRiskFromFindings(
  findings: Array<{ riskLevel: string }>
): RiskLevel | null {
  if (findings.length === 0) return null;
  if (findings.some((f) => f.riskLevel === 'HIGH')) return 'HIGH';
  if (findings.some((f) => f.riskLevel === 'MODERATE')) return 'MODERATE';
  return 'LOW';
}
