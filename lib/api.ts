import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { authClient } from '@/lib/auth-client';
import type {
  Dashboard,
  IntakeLog,
  Interaction,
  Notification,
  RecoverySnapshot,
  Substance,
  SubstanceCategory,
  User,
  Analysis,
  AnalysisReport,
  HealthProfile,
  UpdateHealthProfileInput,
  InsightsData,
  TrendsData,
  TimelineData,
  TimelineEmpty,
  WearableSnapshot,
  WearableSyncResult,
  WearableSyncStatus,
  CabinetItem,
  CreateCabinetItemInput,
  UpdateCabinetItemInput,
  MedicationSchedule,
  CreateScheduleInput,
  UpdateScheduleInput,
  DoseEvent,
  DoseActionInput,
  DailySnapshot,
  InteractionCheck,
  CreateInteractionCheckInput,
  Product,
  ProductSearchResult,
  SubstanceKnowledge,
  ObservationalInsights,
  EmergencyContact,
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
  SymptomLog,
  CreateSymptomLogInput,
  UpdateSymptomLogInput,
  HealthReport,
  HealthReportSummary,
  GenerateReportInput,
  Household,
  HouseholdOverview,
  EmergencyCard,
  CareGrantScope,
  BillingConfig,
  BillingPeriod,
  BillingStatus,
} from '@/types/api';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  'http://localhost:3001';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body: unknown = null
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get needsManualEntry(): boolean {
    return Boolean(
      this.body &&
        typeof this.body === 'object' &&
        'needsManualEntry' in this.body &&
        (this.body as { needsManualEntry?: boolean }).needsManualEntry
    );
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // Web relies on the browser cookie jar; native attaches the Better Auth
  // session cookie from SecureStore manually.
  const authHeaders: Record<string, string> = {};
  let credentials: RequestCredentials = 'include';
  if (Platform.OS !== 'web') {
    const cookie = authClient.getCookie();
    if (cookie) authHeaders.Cookie = cookie;
    credentials = 'omit';
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    let parsed: unknown = null;
    try {
      parsed = body ? JSON.parse(body) : null;
    } catch {
      parsed = null;
    }
    const message =
      parsed && typeof parsed === 'object'
        ? 'error' in parsed && typeof (parsed as { error: unknown }).error === 'string'
          ? (parsed as { error: string }).error
          : 'message' in parsed && typeof (parsed as { message: unknown }).message === 'string'
            ? (parsed as { message: string }).message
            : body || res.statusText
        : body || res.statusText;
    throw new ApiError(res.status, message, parsed ?? body);
  }

  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; database: string }>('/health'),

  getMe: () => request<User>('/api/users/me'),

  updateMe: (data: { name?: string }) =>
    request<User>('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) }),

  completeOnboarding: () =>
    request<User>('/api/users/me/onboarding-complete', { method: 'POST' }),

  updateHealthProfile: (data: UpdateHealthProfileInput) =>
    request<{ healthProfile: HealthProfile; user: User }>('/api/users/me/health-profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateHealthGoals: (goals: string[]) =>
    request<User>('/api/users/me/health-goals', {
      method: 'PUT',
      body: JSON.stringify({ goals }),
    }),

  getDashboard: () => request<Dashboard>('/api/users/dashboard'),

  getSubstanceCategories: () =>
    request<SubstanceCategory[]>('/api/substances/categories'),

  getSubstances: (params?: { category?: string; popular?: boolean; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.popular) query.set('popular', 'true');
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request<Substance[]>(`/api/substances${qs ? `?${qs}` : ''}`);
  },

  getSubstance: (id: string) => request<Substance>(`/api/substances/${id}`),

  getIntakes: (limit = 20) =>
    request<IntakeLog[]>(`/api/intakes?limit=${limit}`),

  getIntake: (id: string) => request<IntakeLog>(`/api/intakes/${id}`),

  getIntakeReport: (id: string) => request<AnalysisReport>(`/api/intakes/${id}/report`),

  getIntakeCalendar: (month: string) =>
    request<IntakeLog[]>(`/api/intakes/calendar?month=${month}`),

  deleteIntake: (id: string) =>
    request<{ ok: boolean }>(`/api/intakes/${id}`, { method: 'DELETE' }),

  createIntake: (data: {
    substanceId: string;
    dose: number;
    unit: string;
    takenAt: string;
    method?: string;
    purpose?: string;
    status?: string;
  }) =>
    request<IntakeLog>('/api/intakes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  analyzeIntake: (id: string) =>
    request<Analysis>(`/api/intakes/${id}/analyze`, { method: 'POST' }),

  getInteractions: () => request<Interaction[]>('/api/interactions'),

  checkInteractions: (substanceIds: string[]) =>
    request<{
      interactions: Array<{
        title: string;
        riskLevel: string;
        description: string;
        advice?: string;
        source?: string;
      }>;
      count: number;
      riskScore?: number;
    }>('/api/interactions/check', {
      method: 'POST',
      body: JSON.stringify({ substanceIds }),
    }),

  // —— Interaction checks (Phase 2 — Check Before Taking) ——
  createInteractionCheck: (data: CreateInteractionCheckInput) =>
    request<InteractionCheck>('/api/interaction-checks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getInteractionChecks: () => request<InteractionCheck[]>('/api/interaction-checks'),

  getInteractionCheck: (id: string) =>
    request<InteractionCheck>(`/api/interaction-checks/${id}`),

  getRecovery: () => request<RecoverySnapshot>('/api/recovery/latest'),

  getRecoveryHistory: (days = 7) =>
    request<RecoverySnapshot[]>(`/api/recovery/history?days=${days}`),

  getNotifications: () => request<Notification[]>('/api/notifications'),

  markNotificationRead: (id: string) =>
    request<{ ok: boolean }>(`/api/notifications/${id}/read`, { method: 'PATCH' }),

  snoozeInteraction: (id: string, hours = 24) =>
    request<{ ok: boolean }>(`/api/interactions/${id}/snooze?hours=${hours}`, {
      method: 'PATCH',
    }),

  getInsights: () => request<InsightsData>('/api/insights'),

  getTrends: (params?: { range?: string; category?: string }) => {
    const query = new URLSearchParams();
    if (params?.range) query.set('range', params.range);
    if (params?.category) query.set('category', params.category);
    const qs = query.toString();
    return request<TrendsData>(`/api/trends${qs ? `?${qs}` : ''}`);
  },

  getTimeline: (intakeId?: string) => {
    const qs = intakeId ? `?intakeId=${intakeId}` : '';
    return request<TimelineData | TimelineEmpty>(`/api/timeline${qs}`);
  },

  getWearableStatus: () => request<WearableSyncStatus>('/api/wearables/status'),

  getWearableHistory: (days = 7) =>
    request<WearableSnapshot[]>(`/api/wearables/history?days=${days}`),

  syncWearables: (data: {
    heartRateAvg?: number | null;
    restingHeartRate?: number | null;
    steps?: number | null;
    sleepHours?: number | null;
    activeEnergyKcal?: number | null;
    source?: string;
    recordedAt?: string;
  }) =>
    request<WearableSyncResult>('/api/wearables/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // —— Health Cabinet ——
  getCabinet: (params?: { active?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.active !== undefined) query.set('active', String(params.active));
    const qs = query.toString();
    return request<CabinetItem[]>(`/api/cabinet${qs ? `?${qs}` : ''}`);
  },

  getCabinetItem: (id: string) => request<CabinetItem>(`/api/cabinet/${id}`),

  createCabinetItem: (data: CreateCabinetItemInput) =>
    request<CabinetItem>('/api/cabinet', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCabinetItem: (id: string, data: UpdateCabinetItemInput) =>
    request<CabinetItem>(`/api/cabinet/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCabinetItem: (id: string) =>
    request<{ ok: boolean }>(`/api/cabinet/${id}`, { method: 'DELETE' }),

  // —— Medication schedules ——
  getSchedules: (params?: { cabinetItemId?: string; active?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.cabinetItemId) query.set('cabinetItemId', params.cabinetItemId);
    if (params?.active !== undefined) query.set('active', String(params.active));
    const qs = query.toString();
    return request<MedicationSchedule[]>(`/api/schedules${qs ? `?${qs}` : ''}`);
  },

  createSchedule: (data: CreateScheduleInput) =>
    request<MedicationSchedule>('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSchedule: (id: string, data: UpdateScheduleInput) =>
    request<MedicationSchedule>(`/api/schedules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteSchedule: (id: string) =>
    request<{ ok: boolean }>(`/api/schedules/${id}`, { method: 'DELETE' }),

  // —— Dose events ——
  getDoses: (params: { from: string; to: string }) => {
    const query = new URLSearchParams({ from: params.from, to: params.to });
    return request<DoseEvent[]>(`/api/doses?${query}`);
  },

  markDoseTaken: (id: string, data?: DoseActionInput) =>
    request<DoseEvent>(`/api/doses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'TAKEN', ...data }),
    }),

  markDoseSkipped: (id: string, data?: DoseActionInput) =>
    request<DoseEvent>(`/api/doses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'SKIPPED', ...data }),
    }),

  markDoseSnoozed: (id: string, data?: DoseActionInput) =>
    request<DoseEvent>(`/api/doses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'SNOOZED',
        snoozeMinutes: data?.snoozeMinutes ?? 15,
        note: data?.note,
      }),
    }),

  getDailySnapshot: (params?: { timezone?: string; date?: string }) => {
    const query = new URLSearchParams();
    if (params?.timezone) query.set('timezone', params.timezone);
    if (params?.date) query.set('date', params.date);
    const qs = query.toString();
    return request<DailySnapshot>(`/api/daily-snapshot${qs ? `?${qs}` : ''}`);
  },

  // —— Products / barcode (Phase 3) ——
  getProductByBarcode: (code: string) =>
    request<Product>(`/api/products/by-barcode/${encodeURIComponent(code.trim())}`),

  searchProducts: (q: string, limit?: number) => {
    const query = new URLSearchParams({ q });
    if (limit != null) query.set('limit', String(limit));
    return request<ProductSearchResult>(`/api/products/search?${query}`);
  },

  getSubstanceKnowledge: (id: string) =>
    request<SubstanceKnowledge>(`/api/knowledge/substances/${id}`),

  getObservationalInsights: (days?: number) => {
    const query = new URLSearchParams();
    if (days != null) query.set('days', String(days));
    const qs = query.toString();
    return request<ObservationalInsights>(
      `/api/insights/observational${qs ? `?${qs}` : ''}`
    );
  },

  // —— Phase 4: emergency contacts ——
  getEmergencyContacts: (params?: { forUserId?: string }) => {
    const query = new URLSearchParams();
    if (params?.forUserId) query.set('forUserId', params.forUserId);
    const qs = query.toString();
    return request<EmergencyContact[]>(`/api/emergency-contacts${qs ? `?${qs}` : ''}`);
  },

  createEmergencyContact: (data: CreateEmergencyContactInput) =>
    request<EmergencyContact>('/api/emergency-contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEmergencyContact: (id: string, data: UpdateEmergencyContactInput) =>
    request<EmergencyContact>(`/api/emergency-contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteEmergencyContact: (id: string) =>
    request<{ ok: boolean }>(`/api/emergency-contacts/${id}`, { method: 'DELETE' }),

  // —— Symptoms ——
  getSymptoms: (params?: { from?: string; to?: string; forUserId?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.forUserId) query.set('forUserId', params.forUserId);
    const qs = query.toString();
    return request<SymptomLog[]>(`/api/symptoms${qs ? `?${qs}` : ''}`);
  },

  createSymptom: (data: CreateSymptomLogInput) =>
    request<SymptomLog>('/api/symptoms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSymptom: (id: string, data: UpdateSymptomLogInput) =>
    request<SymptomLog>(`/api/symptoms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteSymptom: (id: string) =>
    request<{ ok: boolean }>(`/api/symptoms/${id}`, { method: 'DELETE' }),

  // —— Reports ——
  getReports: (params?: { forUserId?: string }) => {
    const query = new URLSearchParams();
    if (params?.forUserId) query.set('forUserId', params.forUserId);
    const qs = query.toString();
    return request<HealthReportSummary[]>(`/api/reports${qs ? `?${qs}` : ''}`);
  },

  getReport: (id: string) => request<HealthReport>(`/api/reports/${id}`),

  generateReport: (data: GenerateReportInput) =>
    request<HealthReport>('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // —— Households / caregiving ——
  getHouseholds: () => request<HouseholdOverview>('/api/households'),

  createHousehold: (data: { name: string }) =>
    request<Household>('/api/households', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  inviteToHousehold: (
    householdId: string,
    data: {
      email: string;
      role?: 'CAREGIVER' | 'DEPENDENT';
      scopes?: CareGrantScope[];
    }
  ) =>
    request<{ member: unknown; pendingScopes: CareGrantScope[] }>(
      `/api/households/${householdId}/invite`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

  acceptHouseholdInvite: (memberId: string, scopes?: CareGrantScope[]) =>
    request<{ ok: boolean }>(`/api/households/invites/${memberId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ scopes: scopes ?? ['EMERGENCY_VIEW', 'REPORTS_VIEW'] }),
    }),

  declineHouseholdInvite: (memberId: string) =>
    request<{ ok: boolean }>(`/api/households/invites/${memberId}/decline`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  revokeCareGrant: (id: string) =>
    request<{ ok: boolean }>(`/api/households/grants/${id}/revoke`, { method: 'POST' }),

  getEmergencyCard: (params?: { forUserId?: string }) => {
    const query = new URLSearchParams();
    if (params?.forUserId) query.set('forUserId', params.forUserId);
    const qs = query.toString();
    return request<EmergencyCard>(`/api/households/emergency-card${qs ? `?${qs}` : ''}`);
  },

  // —— Billing (Stripe) ——
  getBillingConfig: () => request<BillingConfig>('/api/billing/config'),

  getBillingStatus: () => request<BillingStatus>('/api/billing/status'),

  createCheckoutSession: (data: { period: BillingPeriod; platform?: 'web' | 'native' }) =>
    request<{ url: string; sessionId: string }>('/api/billing/checkout-session', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createPortalSession: (data?: { platform?: 'web' | 'native' }) =>
    request<{ url: string }>('/api/billing/portal-session', {
      method: 'POST',
      body: JSON.stringify(data ?? {}),
    }),

  confirmCheckoutSession: (sessionId: string) =>
    request<{ ok: boolean; isPremium: boolean; status: string | null }>(
      '/api/billing/confirm-session',
      {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      }
    ),
};

export { ApiError, API_URL };
