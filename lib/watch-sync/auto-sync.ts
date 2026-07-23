import { AppState, type AppStateStatus, Platform } from 'react-native';
import { api } from '@/lib/api';
import { getWatchSyncAvailability, syncWatchToServer } from './healthkit';
import {
  setLastAutoSyncAt,
  setLocalLastSyncAt,
  shouldRunAutoSync,
} from './storage';

let started = false;
let inFlight: Promise<boolean> | null = null;

/**
 * Quiet foreground sync used when "Sync when app opens" is enabled.
 * Throttled so HealthKit isn't hit on every brief app switch.
 */
export async function runForegroundWatchSync(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  if (!getWatchSyncAvailability().supported) return false;
  if (!(await shouldRunAutoSync())) return false;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      if (typeof api.syncWearables !== 'function') return false;
      await syncWatchToServer((data) => api.syncWearables(data));
      const now = new Date().toISOString();
      await Promise.all([setLocalLastSyncAt(now), setLastAutoSyncAt(now)]);
      return true;
    } catch {
      return false;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export function startWatchAutoSyncListener(): () => void {
  if (Platform.OS !== 'ios' || started) {
    return () => undefined;
  }
  started = true;

  void runForegroundWatchSync();

  const onChange = (next: AppStateStatus) => {
    if (next === 'active') {
      void runForegroundWatchSync();
    }
  };

  const sub = AppState.addEventListener('change', onChange);
  return () => {
    sub.remove();
    started = false;
  };
}
