export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export type User = {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
  onboardingCompleted?: boolean;
  healthProfile?: HealthProfile | null;
  healthGoals?: HealthGoal[];
};

export type HealthProfile = {
  age: number | null;
  weightKg: number | null;
  heightCm: number | null;
  gender: string | null;
  medicalConditions: string | null;
  allergies: string | null;
  emergencyInfo?: string | null;
};

export type UpdateHealthProfileInput = {
  age?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
  medicalConditions?: string | null;
  allergies?: string | null;
  emergencyInfo?: string | null;
};

export type HealthGoal = {
  id: string;
  goal: string;
};

export type SubstanceCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  _count?: {
    substances: number;
  };
};

export type Substance = {
  id: string;
  name: string;
  description: string | null;
  defaultUnit: string;
  minDose: number | null;
  maxDose: number | null;
  isPopular: boolean;
  category?: SubstanceCategory;
};

export type Analysis = {
  id: string;
  overallScore: number;
  cognitiveScore: number;
  cardiovascularScore: number;
  gastrointestinalScore: number;
  interactionRiskScore: number;
  durationMinHours: number | null;
  durationMaxHours: number | null;
  summary: string | null;
  recommendations?: string[] | null;
  warnings?: string[] | null;
  aiGenerated?: boolean;
  engineVersion?: string;
  riskLevel?: RiskLevel;
  riskLabel?: string;
  doseAssessment?: 'low' | 'normal' | 'high';
  doseAssessmentLabel?: string;
  peakWindow?: { startHours: number; endHours: number };
};

export type AnalysisReport = {
  intake: {
    id: string;
    dose: number;
    unit: string;
    takenAt: string;
    method: string;
    purpose: string | null;
    substance: Substance;
  };
  analysis: Analysis;
  interactions: Interaction[];
  activeSubstances: { id: string; name: string }[];
  disclaimer: string;
};

export type IntakeLog = {
  id: string;
  dose: number;
  unit: string;
  takenAt: string;
  method: string;
  purpose: string | null;
  status: string;
  substance: Substance;
  analysis?: Analysis | null;
};

export type Interaction = {
  id: string;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  advice: string | null;
  substanceA: Substance;
  substanceB: Substance;
};

export type RecoverySnapshot = {
  id?: string;
  score: number;
  cognitivePct: number;
  cardiovascularPct: number;
  liverPct: number;
  sleepPct: number;
  estimatedRecoveryAt: string | null;
  recordedAt?: string;
  latestSubstance?: {
    name: string;
    drugClass: string | null;
    categorySlug: string;
  } | null;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export type WearableSnapshot = {
  id: string;
  source: string;
  heartRateAvg: number | null;
  restingHeartRate: number | null;
  steps: number | null;
  sleepHours: number | null;
  activeEnergyKcal: number | null;
  recordedAt: string;
};

export type WearableSyncStatus = {
  lastSyncAt: string | null;
  latest: WearableSnapshot | null;
  syncedToday: boolean;
  todaySnapshot: WearableSnapshot | null;
};

export type WearableSyncResult = {
  snapshot: WearableSnapshot;
  recoveryUpdated: boolean;
  message: string;
};

export type Dashboard = {
  userName: string;
  healthScore: number;
  riskLevel: RiskLevel;
  indicators: {
    cognitiveLoad: number;
    cardioLoad: number;
    sleepImpact: number;
    alcoholExposure: number;
  };
  interactionAlertCount: number;
  interactionRiskLevel: RiskLevel;
  unreadNotificationCount: number;
  todayIntakeCount: number;
  recovery: RecoverySnapshot | null;
  recentIntakes: IntakeLog[];
  interactions: Interaction[];
};

export type InsightComparison = {
  label: string;
  thisWeek: number;
  lastWeek: number;
  changePercent: number;
  up: boolean;
  invertColors?: boolean;
};

export type InsightsData = {
  comparisons: InsightComparison[];
  riskTrend: { labels: string[]; values: number[] };
  impactTrend: {
    labels: string[];
    cognitive: number[];
    cardiovascular: number[];
    gastrointestinal: number[];
  };
  impactBreakdown: {
    cognitive: number;
    cardiovascular: number;
    gastrointestinal: number;
    interaction: number;
    overall: number;
    count: number;
  };
  weeklyNarrative: string;
  recentAnalyses: {
    intakeId: string;
    substanceName: string;
    takenAt: string;
    overallScore: number;
    riskLevel: RiskLevel;
    riskLabel: string;
  }[];
  topPositiveImpact: {
    substance: string;
    improvementPct: number;
    message: string;
  } | null;
  patterns: { title: string; value: string }[];
  stats: {
    totalIntakes: number;
    uniqueSubstances: number;
    analysesRun: number;
    interactionAlerts: number;
    highRiskLogs: number;
    avgRiskThisWeek: number;
  };
};

export type TrendsData = {
  range: string;
  category: string;
  chart: { labels: string[]; values: number[] };
  mostLogged: { name: string; count: number }[];
  highestRiskSubstances: {
    name: string;
    avgRisk: number;
    count: number;
    riskLevel: RiskLevel;
  }[];
  summary: {
    totalIntakes: number;
    analyzedIntakes: number;
    avgRisk: number;
    trendDirection: 'up' | 'down' | 'flat';
    trendLabel: string;
  };
};

export type TimelineData = {
  intakeId: string;
  substanceName: string;
  categorySlug: string | null;
  categoryLabel: string;
  drugClass: string | null;
  takenAt: string;
  durationMinHours: number | null;
  durationMaxHours: number | null;
  peakWindowStart: number;
  peakWindowEnd: number;
  labels: string[];
  series: {
    cognitive: number[];
    cardiovascular: number[];
    gastrointestinal: number[];
    liver: number[];
  };
  markerIndex: number;
  peakIndex: number;
  peakTime: string;
  markerTime: string;
  hoursFromStart: number;
  phase: 'onset' | 'peak' | 'comedown' | 'clearing';
  phaseLabels: {
    onset: string;
    peak: string;
    comedown: string;
    clearing: string;
  };
  phaseDescription: string;
  systemInsights: {
    cognitive: string;
    cardiovascular: string;
    gastrointestinal: string;
    liver: string;
  };
  impactHighlights: string[];
  insight: string;
  summary: string | null;
  footer: string;
};

export type TimelineEmpty = {
  empty: true;
  message: string;
};
