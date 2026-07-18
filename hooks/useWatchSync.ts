import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { formatLastSync } from '@/lib/watch-sync/format';
import {
  getAutoSyncEnabled,
  getLocalLastSyncAt,
  setAutoSyncEnabled,
  setLocalLastSyncAt,
} from '@/lib/watch-sync/storage';
import {
  getWatchSyncAvailability,
  syncWatchToServer,
  type WatchSyncAvailability,
} from '@/lib/watch-sync/healthkit';

export function useWatchSync(onSynced?: () => void) {
  const onSyncedRef = useRef(onSynced);
  onSyncedRef.current = onSynced;

  const [availability] = useState<WatchSyncAvailability>(() => getWatchSyncAvailability());
  const [autoSync, setAutoSync] = useState(false);
  const [localLastSync, setLocalLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<Awaited<
    ReturnType<typeof syncWatchToServer>
  > | null>(null);

  const refreshPrefs = useCallback(async () => {
    const [enabled, lastSync] = await Promise.all([
      getAutoSyncEnabled(),
      getLocalLastSyncAt(),
    ]);
    setAutoSync(enabled);
    setLocalLastSync(lastSync);
  }, []);

  useEffect(() => {
    refreshPrefs();
  }, [refreshPrefs]);

  const syncInFlightRef = useRef(false);

  const syncNow = useCallback(async () => {
    if (syncInFlightRef.current) return;
    syncInFlightRef.current = true;
    setSyncing(true);
    setError(null);
    try {
      if (typeof api.syncWearables !== 'function') {
        throw new Error('Wearables API is not available.');
      }
      const payload = await syncWatchToServer((data) => api.syncWearables(data));
      const now = new Date().toISOString();
      await setLocalLastSyncAt(now);
      setLocalLastSync(now);
      setLastPayload(payload);
      onSyncedRef.current?.();
      return payload;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Watch sync failed';
      setError(message);
      throw e;
    } finally {
      syncInFlightRef.current = false;
      setSyncing(false);
    }
  }, []);

  const toggleAutoSync = useCallback(async (enabled: boolean) => {
    await setAutoSyncEnabled(enabled);
    setAutoSync(enabled);
    if (enabled && availability.supported) {
      try {
        await syncNow();
      } catch {
        // keep toggle on; user can retry manually
      }
    }
  }, [availability.supported, syncNow]);

  return {
    availability,
    autoSync,
    syncing,
    error,
    lastPayload,
    localLastSync,
    lastSyncLabel: formatLastSync(localLastSync),
    syncNow,
    toggleAutoSync,
    refreshPrefs,
  };
}
