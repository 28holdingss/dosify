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
