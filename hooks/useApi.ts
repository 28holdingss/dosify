import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';

type UseApiState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useDashboard() {
  return useApi(() => api.getDashboard(), []);
}

export function useProfile() {
  return useApi(() => api.getMe(), []);
}

export function useSubstanceCategories() {
  return useApi(() => api.getSubstanceCategories(), []);
}

export function useSubstances(params?: { category?: string; popular?: boolean; search?: string }) {
  return useApi(
    () => api.getSubstances(params),
    [params?.category, params?.popular, params?.search]
  );
}

export function useRecovery() {
  return useApi(() => api.getRecovery(), []);
}

export function useRecoveryHistory(days = 7) {
  return useApi(() => api.getRecoveryHistory(days), [days]);
}

export function useNotifications() {
  return useApi(() => api.getNotifications(), []);
}

export function useIntakes(limit = 20) {
  return useApi(() => api.getIntakes(limit), [limit]);
}

export function useInteractions() {
  return useApi(() => api.getInteractions(), []);
}

export function useIntakeCalendar(month: string) {
  return useApi(() => api.getIntakeCalendar(month), [month]);
}

export function useSubstance(id: string | undefined) {
  return useApi(
    () => {
      if (!id) return Promise.reject(new Error('No substance id'));
      return api.getSubstance(id);
    },
    [id]
  );
}

export function useIntakeReport(id: string | undefined) {
  return useApi(
    () => {
      if (!id) return Promise.reject(new Error('No intake id'));
      return api.getIntakeReport(id);
    },
    [id]
  );
}

export function useAnalysisReport(id: string | undefined) {
  return useIntakeReport(id);
}

export function useIntake(id: string | undefined) {
  return useApi(
    () => {
      if (!id) return Promise.reject(new Error('No intake id'));
      return api.getIntake(id);
    },
    [id]
  );
}

export function useInsights() {
  return useApi(() => api.getInsights(), []);
}

export function useTrends(range: string, category: string) {
  return useApi(() => api.getTrends({ range, category }), [range, category]);
}

export function useTimeline(intakeId?: string) {
  return useApi(() => api.getTimeline(intakeId), [intakeId]);
}

export function useWearableStatus() {
  return useApi(() => api.getWearableStatus(), []);
}

export function useWearableHistory(days = 7) {
  return useApi(() => api.getWearableHistory(days), [days]);
}

export function useCabinet(params?: { active?: boolean }) {
  return useApi(() => api.getCabinet(params), [params?.active]);
}

export function useCabinetItem(id: string | undefined) {
  return useApi(
    async () => {
      if (!id) return null as never;
      return api.getCabinetItem(id);
    },
    [id]
  );
}

export function useSchedules(
  params?: { cabinetItemId?: string; active?: boolean },
  enabled = true
) {
  return useApi(
    async () => {
      if (!enabled) return [];
      return api.getSchedules(params);
    },
    [enabled, params?.cabinetItemId, params?.active]
  );
}

export function useDoses(from: string, to: string, enabled = true) {
  return useApi(
    async () => {
      if (!enabled || !from || !to) return [];
      return api.getDoses({ from, to });
    },
    [enabled, from, to]
  );
}

export function useDailySnapshot() {
  const timezone =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC';
  return useApi(() => api.getDailySnapshot({ timezone }), [timezone]);
}

export function useInteractionChecks() {
  return useApi(() => api.getInteractionChecks(), []);
}

export function useInteractionCheck(id: string | undefined) {
  return useApi(
    async () => {
      if (!id) return null as never;
      return api.getInteractionCheck(id);
    },
    [id]
  );
}

export function useProductSearch(q: string, enabled = true) {
  const trimmed = q.trim();
  return useApi(
    async () => {
      if (!enabled || trimmed.length < 2) return { products: [], substances: [] };
      return api.searchProducts(trimmed);
    },
    [enabled, trimmed]
  );
}

export function useSubstanceKnowledge(id: string | undefined) {
  return useApi(
    async () => {
      if (!id) return null as never;
      return api.getSubstanceKnowledge(id);
    },
    [id]
  );
}

export function useEmergencyContacts(forUserId?: string) {
  return useApi(() => api.getEmergencyContacts(forUserId ? { forUserId } : undefined), [
    forUserId,
  ]);
}

export function useSymptoms(params?: { from?: string; to?: string; forUserId?: string }) {
  return useApi(
    () => api.getSymptoms(params),
    [params?.from, params?.to, params?.forUserId]
  );
}

export function useReports(forUserId?: string) {
  return useApi(() => api.getReports(forUserId ? { forUserId } : undefined), [forUserId]);
}

export function useHouseholds() {
  return useApi(() => api.getHouseholds(), []);
}

export function useEmergencyCard(forUserId?: string) {
  return useApi(() => api.getEmergencyCard(forUserId ? { forUserId } : undefined), [forUserId]);
}
