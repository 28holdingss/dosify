export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export type User = {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
  onboardingCompleted?: boolean;
  stripeSubscriptionStatus?: string | null;
  premiumExpiresAt?: string | null;
  healthProfile?: HealthProfile | null;
  healthGoals?: HealthGoal[];
};

export type BillingPeriod = 'monthly' | 'yearly';

export type BillingConfig = {
  configured: boolean;
  publishableKey: string | null;
  prices: { monthly: string | null; yearly: string | null };
};

export type BillingStatus = {
  isPremium: boolean;
  status: string | null;
  priceId: string | null;
  period: BillingPeriod | null;
  expiresAt: string | null;
  hasCustomer: boolean;
  configured: boolean;
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

/** Phase 1 — Health Cabinet, schedules, dose adherence */

export type DoseStatus = 'DUE' | 'TAKEN' | 'SKIPPED' | 'SNOOZED' | 'MISSED';

/** Mirrors Prisma `ScheduleRecurrence`. */
export type ScheduleRecurrence = 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'INTERVAL';

export type CabinetItem = {
  id: string;
  substanceId: string;
  displayName: string | null;
  doseValue: number | null;
  doseUnit: string | null;
  quantity: number | null;
  expirationDate: string | null;
  refillDate: string | null;
  prescriber: string | null;
  instructions: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  substance?: Substance;
  schedules?: MedicationSchedule[];
};

export type CreateCabinetItemInput = {
  substanceId: string;
  displayName?: string | null;
  doseValue?: number | null;
  doseUnit?: string | null;
  quantity?: number | null;
  expirationDate?: string | null;
  refillDate?: string | null;
  prescriber?: string | null;
  instructions?: string | null;
  active?: boolean;
};

export type UpdateCabinetItemInput = {
  substanceId?: string;
  displayName?: string | null;
  doseValue?: number | null;
  doseUnit?: string | null;
  quantity?: number | null;
  expirationDate?: string | null;
  refillDate?: string | null;
  prescriber?: string | null;
  instructions?: string | null;
  active?: boolean;
};

export type MedicationSchedule = {
  id: string;
  cabinetItemId: string;
  timezone: string;
  recurrence: ScheduleRecurrence;
  /** Local times as `HH:mm` (24h). */
  times: string[];
  intervalHours: number | null;
  /** 0 = Sunday … 6 = Saturday when recurrence is WEEKLY. */
  daysOfWeek: number[] | null;
  startDate: string;
  endDate: string | null;
  instructions: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  cabinetItem?: CabinetItem;
};

export type CreateScheduleInput = {
  cabinetItemId: string;
  timezone?: string;
  recurrence: ScheduleRecurrence;
  times: string[];
  intervalHours?: number | null;
  daysOfWeek?: number[] | null;
  startDate: string;
  endDate?: string | null;
  instructions?: string | null;
  active?: boolean;
};

export type UpdateScheduleInput = {
  timezone?: string;
  recurrence?: ScheduleRecurrence;
  times?: string[];
  intervalHours?: number | null;
  daysOfWeek?: number[] | null;
  startDate?: string;
  endDate?: string | null;
  instructions?: string | null;
  active?: boolean;
};

export type DoseEvent = {
  id: string;
  scheduleId: string | null;
  cabinetItemId: string;
  scheduledFor: string;
  status: DoseStatus;
  actedAt: string | null;
  snoozedUntil: string | null;
  note: string | null;
  schedule?: MedicationSchedule | null;
  cabinetItem?: CabinetItem;
};

export type DoseActionInput = {
  note?: string | null;
  /** Minutes to snooze (snoozed action only). Defaults on server if omitted. */
  snoozeMinutes?: number;
};

export type DailySnapshot = {
  date: string;
  timezone: string;
  generatedAt: string;
  doses: {
    counts: {
      due: number;
      taken: number;
      skipped: number;
      snoozed: number;
      missed: number;
      total: number;
    };
    upcoming: DoseEvent[];
  };
  refillsDueSoon: Array<{
    id: string;
    displayName: string;
    refillDate: string | null;
    quantity: number | null;
    overdue: boolean;
  }>;
  latestWearableSnapshot: WearableSnapshot | null;
  activeInteractionCount: number;
  disclaimer: string;
};

/** Phase 2 — Check Before Taking */

export type InteractionCheckFinding = {
  riskLevel: RiskLevel;
  title: string;
  description: string;
  advice?: string | null;
  source?: string | null;
};

export type InteractionCheckContext = {
  cabinetCount: number;
  recentIntakeCount: number;
  allergies?: string | null;
  conditions?: string | null;
};

export type InteractionCheckProposed = {
  id: string;
  name: string;
};

export type InteractionCheck = {
  id: string;
  createdAt: string;
  proposed: InteractionCheckProposed[];
  context: InteractionCheckContext;
  findings: InteractionCheckFinding[];
  riskScore?: number | null;
  highestRisk?: RiskLevel | null;
  disclaimer: string;
};

export type CreateInteractionCheckInput = {
  substanceId?: string;
  substanceIds?: string[];
  includeCabinet?: boolean;
  includeRecentIntakes?: boolean;
};

/** Phase 3 — Product barcode lookup + medicine knowledge */

export type ProductBarcode = {
  id: string;
  code: string;
  symbology: string;
};

export type ProductIngredient = {
  id: string;
  substanceId: string;
  strengthValue: number | null;
  strengthUnit: string | null;
  substance?: Substance;
};

export type Product = {
  id: string;
  name: string;
  brand: string | null;
  dosageForm: string | null;
  manufacturer: string | null;
  description: string | null;
  substanceId: string | null;
  externalId: string | null;
  createdAt: string;
  substance?: Substance | null;
  barcodes?: ProductBarcode[];
  ingredients?: ProductIngredient[];
};

export type ProductSearchResult = {
  products: Product[];
  substances: Substance[];
};

export type ProductBarcodeNotFound = {
  error: string;
  needsManualEntry: true;
};

export type SubstanceKnowledgeProfile = {
  drugClass: string | null;
  halfLifeHours: number | null;
  typicalDurationMinHours: number | null;
  typicalDurationMaxHours: number | null;
  maxDailyDose: number | null;
  cognitiveImpact: number;
  cardiovascularImpact: number;
  gastrointestinalImpact: number;
  liverImpact: number;
};

export type SubstanceKnowledgeConsideration = {
  riskLevel: RiskLevel;
  title: string;
  description: string;
  advice: string | null;
  source: string | null;
};

export type SubstanceKnowledge = {
  substance: Substance & {
    category: SubstanceCategory;
  };
  profile: SubstanceKnowledgeProfile | null;
  considerations: SubstanceKnowledgeConsideration[];
  plainLanguageSummary: string | null;
  aiGenerated: boolean;
  disclaimer: string;
};

/** Phase 5 — Observational wearable / adherence insights */

export type ObservationalFinding = {
  id: string;
  title: string;
  correlation: number | null;
  sampleDays: number;
  interpretation: string;
};

export type ObservationalDay = {
  date: string;
  adherencePct: number | null;
  sleepHours: number | null;
  heartRateAvg: number | null;
  symptomLoad: number;
};

export type ObservationalInsights = {
  windowDays: number;
  from: string;
  to: string;
  series: ObservationalDay[];
  findings: ObservationalFinding[];
  symptomDays: number;
  disclaimer: string;
};

/** Phase 4 — Family, emergency, symptoms, reports */

export type CareGrantScope = 'EMERGENCY_VIEW' | 'REPORTS_VIEW' | 'FULL_READ';
export type HouseholdRole = 'OWNER' | 'CAREGIVER' | 'DEPENDENT';
export type HouseholdInviteStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED';
export type HealthReportKind =
  | 'CABINET_CSV'
  | 'DOSES_CSV'
  | 'SYMPTOMS_CSV'
  | 'CLINICIAN_SUMMARY';

export type EmergencyContact = {
  id: string;
  name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateEmergencyContactInput = {
  name: string;
  relationship?: string | null;
  phone?: string | null;
  email?: string | null;
  isPrimary?: boolean;
  notes?: string | null;
};

export type UpdateEmergencyContactInput = Partial<CreateEmergencyContactInput>;

export type SymptomLog = {
  id: string;
  symptom: string;
  severity: number | null;
  notes: string | null;
  occurredAt: string;
  relatedMeds: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSymptomLogInput = {
  symptom: string;
  severity?: number | null;
  notes?: string | null;
  occurredAt?: string;
  relatedMeds?: string | null;
};

export type UpdateSymptomLogInput = Partial<CreateSymptomLogInput>;

export type HealthReportSummary = {
  id: string;
  kind: HealthReportKind;
  title: string;
  dateFrom: string | null;
  dateTo: string | null;
  provenance: Record<string, unknown> | null;
  createdAt: string;
};

export type HealthReport = HealthReportSummary & {
  content: string;
};

export type GenerateReportInput = {
  kind: HealthReportKind;
  dateFrom?: string;
  dateTo?: string;
  forUserId?: string;
  title?: string;
};

export type HouseholdMember = {
  id: string;
  householdId: string;
  userId: string | null;
  inviteEmail: string | null;
  role: HouseholdRole;
  status: HouseholdInviteStatus;
  invitedAt: string;
  acceptedAt: string | null;
  user?: { id: string; name: string; email: string } | null;
};

export type CareGrant = {
  id: string;
  householdId: string | null;
  ownerUserId: string;
  caregiverUserId: string;
  scope: CareGrantScope;
  active: boolean;
  grantedAt: string;
  owner?: { id: string; name: string; email: string };
  caregiver?: { id: string; name: string; email: string };
};

export type Household = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  members?: HouseholdMember[];
  grants?: CareGrant[];
};

export type HouseholdOverview = {
  owned: Household[];
  memberOf: Household[];
  pendingInvites: Array<
    HouseholdMember & { household: { id: string; name: string; ownerId: string } }
  >;
  grantsReceived: CareGrant[];
};

export type AllergyRecord = {
  id: string;
  allergen: string;
  reaction: string | null;
  severity: string;
  notes: string | null;
};

export type ConditionRecord = {
  id: string;
  name: string;
  status: string;
  notes: string | null;
};

export type EmergencyCard = {
  subject: {
    id: string;
    name: string;
    healthProfile: HealthProfile | null;
  };
  allergies: AllergyRecord[];
  conditions: ConditionRecord[];
  cabinet: CabinetItem[];
  contacts: EmergencyContact[];
  disclaimer: string;
};
