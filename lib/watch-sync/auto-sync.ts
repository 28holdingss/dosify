import { AppState, type AppStateStatus, Platform } from 'react-native';
import { api } from '@/lib/api';
import { getWatchSyncAvailability, syncWatchToServer } from './healthkit';
import {
  getAutoSyncEnabled,
  getLastAutoSyncAt,
  getLocalLastSyncAt,
  setLastAutoSyncAt,
  setLocalLastSyncAt,
  shouldRunAutoSync,
  AUTO_SYNC_MIN_INTERVAL_MS,
} from './storage';

let started = false;
let inFlight: Promise<boolean> | null = null;

async function performSync(): Promise<boolean> {
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

/**
 * Quiet foreground sync used when "Sync when app opens" is enabled.
 * Throttled so HealthKit isn't hit on every brief app switch.
 */
export async function runForegroundWatchSync(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  if (!getWatchSyncAvailability().supported) return false;
  if (!(await shouldRunAutoSync())) return false;
  return performSync();
}

/**
 * Home Key Indicators refresh: if HealthKit/Watch was connected before,
 * pull a fresh snapshot (throttled) so cognitive/cardio/sleep stay accurate.
 */
export async function runHomeWearableRefresh(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  if (!getWatchSyncAvailability().supported) return false;

  const [autoOn, lastSync, lastAuto] = await Promise.all([
    getAutoSyncEnabled(),
    getLocalLastSyncAt(),
    getLastAutoSyncAt(),
  ]);

  // Only when user has synced before, or explicitly enabled auto-sync.
  if (!lastSync && !autoOn) return false;

  if (lastAuto) {
    const elapsed = Date.now() - new Date(lastAuto).getTime();
    if (elapsed < Math.min(AUTO_SYNC_MIN_INTERVAL_MS, 15 * 60 * 1000)) {
      return false;
    }
  }

  return performSync();
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
