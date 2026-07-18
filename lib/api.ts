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
} from '@/types/api';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  'http://localhost:3001';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
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
    throw new ApiError(res.status, body || res.statusText);
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
    request<{ interactions: Array<{ title: string; riskLevel: string; description: string; advice?: string }>; count: number }>(
      '/api/interactions/check',
      { method: 'POST', body: JSON.stringify({ substanceIds }) }
    ),

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
};

export { ApiError, API_URL };
