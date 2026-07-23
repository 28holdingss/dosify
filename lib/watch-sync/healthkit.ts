import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Linking, NativeModules, Platform } from 'react-native';

export type WatchSyncPayload = {
  heartRateAvg: number | null;
  restingHeartRate: number | null;
  steps: number | null;
  sleepHours: number | null;
  activeEnergyKcal: number | null;
  source: string;
};

export type WatchSyncAvailability = {
  supported: boolean;
  reason?: string;
};

type HealthSample = {
  value?: number | string;
  startDate?: string;
  endDate?: string;
};

type HealthKitModule = {
  initHealthKit?: (
    permissions: { permissions: { read: string[]; write: string[] } },
    callback: (error: string | null) => void
  ) => void;
  isAvailable?: (callback: (error: unknown, available: boolean) => void) => void;
  getStepCount?: (
    options: { date: string; includeManuallyAdded?: boolean },
    callback: (error: string | null, result: { value: number }) => void
  ) => void;
  getHeartRateSamples?: (
    options: { startDate: string; endDate: string; ascending?: boolean },
    callback: (error: string | null, results: HealthSample[]) => void
  ) => void;
  getRestingHeartRate?: (
    options: { startDate: string; endDate: string },
    callback: (error: string | null, result: { value: number }) => void
  ) => void;
  getRestingHeartRateSamples?: (
    options: { startDate: string; endDate: string },
    callback: (error: string | null, results: HealthSample[]) => void
  ) => void;
  getSleepSamples?: (
    options: { startDate: string; endDate: string },
    callback: (error: string | null, results: HealthSample[]) => void
  ) => void;
  getActiveEnergyBurned?: (
    options: { startDate: string; endDate: string },
    callback: (error: string | null, results: HealthSample[]) => void
  ) => void;
  Constants?: {
    Permissions: Record<string, string>;
  };
};

const REQUIRED_METHODS = [
  'initHealthKit',
  'getStepCount',
  'getHeartRateSamples',
  'getSleepSamples',
  'getActiveEnergyBurned',
] as const;

const SLEEP_STAGE_VALUES = new Set([
  'ASLEEP',
  'CORE',
  'DEEP',
  'REM',
  'ASLEEP_UNSPECIFIED',
  'ASLEEPUNSPECIFIED',
]);
const SLEEP_INBED_VALUES = new Set(['INBED']);

function isExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

function hasNativeHealthKit(): boolean {
  return Boolean(
    requireOptionalNativeModule('AppleHealthKit') ?? NativeModules.AppleHealthKit
  );
}

function loadHealthKitModule(): HealthKitModule | null {
  if (Platform.OS !== 'ios' || !hasNativeHealthKit()) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-health');
    const kit = (mod?.default ?? mod) as HealthKitModule;

    for (const method of REQUIRED_METHODS) {
      if (typeof kit[method] !== 'function') return null;
    }

    if (!kit.Constants?.Permissions) return null;
    return kit;
  } catch {
    return null;
  }
}

function getHealthKit(): HealthKitModule {
  const kit = loadHealthKitModule();
  if (!kit) {
    throw new Error(getWatchSyncAvailability().reason ?? 'HealthKit unavailable');
  }
  return kit;
}

export function getWatchSyncAvailability(): WatchSyncAvailability {
  if (Platform.OS !== 'ios') {
    return { supported: false, reason: 'Apple Watch sync is available on iPhone only.' };
  }
  if (isExpoGo()) {
    return {
      supported: false,
      reason: 'Requires the Dosify iOS build — HealthKit is not available in Expo Go.',
    };
  }
  if (!hasNativeHealthKit()) {
    return {
      supported: false,
      reason: 'HealthKit native module is not linked. Rebuild with a development or production iOS build.',
    };
  }
  if (!loadHealthKitModule()) {
    return {
      supported: false,
      reason: 'HealthKit APIs are unavailable. Rebuild the Dosify iOS app.',
    };
  }
  return { supported: true };
}

export async function openHealthSettings(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    await Linking.openURL('App-Prefs:HEALTH');
  } catch {
    await Linking.openSettings();
  }
}

function promisify<T>(
  label: string,
  run: ((cb: (error: string | null, result: T) => void) => void) | undefined
): Promise<T> {
  if (typeof run !== 'function') {
    return Promise.reject(new Error(`HealthKit.${label} is not available`));
  }

  return new Promise((resolve, reject) => {
    run((error, result) => {
      if (error) reject(new Error(String(error)));
      else resolve(result);
    });
  });
}

type Interval = { start: number; end: number };

function normalizeSleepValue(value: string): string {
  return value.toUpperCase().replace(/[\s_-]+/g, '');
}

function sampleIntervals(
  samples: HealthSample[],
  allowed: Set<string>
): Interval[] {
  const intervals: Interval[] = [];
  for (const sample of samples) {
    if (typeof sample.value !== 'string') continue;
    const value = normalizeSleepValue(sample.value);
    if (!allowed.has(value)) continue;
    if (!sample.startDate || !sample.endDate) continue;
    const start = new Date(sample.startDate).getTime();
    const end = new Date(sample.endDate).getTime();
    if (end > start) intervals.push({ start, end });
  }
  return intervals;
}

/** Merge overlapping intervals so staged sleep isn't double-counted. */
function mergedDurationHours(intervals: Interval[]): number | null {
  if (intervals.length === 0) return null;
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  let totalMs = 0;
  let cursorStart = sorted[0]!.start;
  let cursorEnd = sorted[0]!.end;

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i]!;
    if (next.start <= cursorEnd) {
      cursorEnd = Math.max(cursorEnd, next.end);
    } else {
      totalMs += cursorEnd - cursorStart;
      cursorStart = next.start;
      cursorEnd = next.end;
    }
  }
  totalMs += cursorEnd - cursorStart;
  if (totalMs <= 0) return null;
  return Math.round((totalMs / 3600000) * 10) / 10;
}

/**
 * Prefer Apple sleep stages (CORE/DEEP/REM/ASLEEP). Fall back to INBED only when
 * stages are missing — summing both inflates hours.
 */
export function sleepHoursFromSamples(samples: HealthSample[]): number | null {
  const stages = mergedDurationHours(sampleIntervals(samples, SLEEP_STAGE_VALUES));
  if (stages != null) return stages;
  return mergedDurationHours(sampleIntervals(samples, SLEEP_INBED_VALUES));
}

function averageHeartRate(samples: HealthSample[]): number | null {
  const values = samples
    .map((sample) => (typeof sample.value === 'number' ? sample.value : null))
    .filter((value): value is number => value != null && value > 0);

  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function sumEnergy(samples: HealthSample[]): number | null {
  const values = samples
    .map((sample) => (typeof sample.value === 'number' ? sample.value : null))
    .filter((value): value is number => value != null);

  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0));
}

async function readRestingHeartRate(
  kit: HealthKitModule,
  range: { startDate: string; endDate: string }
): Promise<number | null> {
  if (typeof kit.getRestingHeartRate === 'function') {
    try {
      const result = await promisify<{ value: number }>('getRestingHeartRate', (cb) =>
        kit.getRestingHeartRate!(range, cb)
      );
      if (result.value > 0) return Math.round(result.value);
    } catch {
      // fall back to samples
    }
  }

  if (typeof kit.getRestingHeartRateSamples === 'function') {
    try {
      const samples = await promisify<HealthSample[]>('getRestingHeartRateSamples', (cb) =>
        kit.getRestingHeartRateSamples!(range, cb)
      );
      const values = samples
        .map((sample) => (typeof sample.value === 'number' ? sample.value : null))
        .filter((value): value is number => value != null && value > 0);
      if (values.length > 0) return Math.round(values[values.length - 1]!);
    } catch {
      // no resting heart rate available
    }
  }

  return null;
}

export async function requestWatchPermissions(): Promise<boolean> {
  const kit = getHealthKit();

  const permissions = {
    permissions: {
      read: [
        kit.Constants!.Permissions.HeartRate,
        kit.Constants!.Permissions.RestingHeartRate,
        kit.Constants!.Permissions.Steps,
        kit.Constants!.Permissions.SleepAnalysis,
        kit.Constants!.Permissions.ActiveEnergyBurned,
      ].filter(Boolean),
      write: [] as string[],
    },
  };

  if (typeof kit.isAvailable === 'function') {
    const available = await new Promise<boolean>((resolve, reject) => {
      kit.isAvailable!((error, result) => {
        if (error) reject(new Error(String(error)));
        else resolve(result);
      });
    });
    if (!available) {
      throw new Error('HealthKit is not available on this device.');
    }
  }

  await promisify<void>('initHealthKit', (cb) => kit.initHealthKit!(permissions, cb));
  return true;
}

/**
 * Reads a coherent daily window:
 * - Steps + active energy: calendar day (today)
 * - Heart rate / resting HR / sleep: last 36h (covers last night + morning)
 */
export async function readWatchHealthData(hoursBack = 36): Promise<WatchSyncPayload> {
  const kit = getHealthKit();

  const endDate = new Date();
  const startDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const range = {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };

  const dayStart = new Date(endDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayRange = {
    startDate: dayStart.toISOString(),
    endDate: endDate.toISOString(),
  };

  const [stepsResult, heartSamples, restingHeartRate, sleepSamples, energySamples] =
    await Promise.all([
      promisify<{ value: number }>('getStepCount', (cb) =>
        kit.getStepCount!({ date: endDate.toISOString(), includeManuallyAdded: true }, cb)
      ).catch(() => ({ value: 0 })),
      promisify<HealthSample[]>('getHeartRateSamples', (cb) =>
        kit.getHeartRateSamples!({ ...range, ascending: false }, cb)
      ).catch(() => []),
      readRestingHeartRate(kit, range),
      promisify<HealthSample[]>('getSleepSamples', (cb) => kit.getSleepSamples!(range, cb)).catch(
        () => []
      ),
      promisify<HealthSample[]>('getActiveEnergyBurned', (cb) =>
        kit.getActiveEnergyBurned!(dayRange, cb)
      ).catch(() => []),
    ]);

  return {
    heartRateAvg: averageHeartRate(heartSamples),
    restingHeartRate,
    steps: stepsResult.value > 0 ? Math.round(stepsResult.value) : null,
    sleepHours: sleepHoursFromSamples(sleepSamples),
    activeEnergyKcal: sumEnergy(energySamples),
    source: 'HEALTHKIT',
  };
}

export function isEmptyWatchPayload(payload: WatchSyncPayload): boolean {
  return (
    payload.heartRateAvg == null &&
    payload.restingHeartRate == null &&
    payload.steps == null &&
    payload.sleepHours == null &&
    payload.activeEnergyKcal == null
  );
}

export async function syncWatchToServer(
  upload: (payload: WatchSyncPayload) => Promise<unknown>
): Promise<WatchSyncPayload> {
  const availability = getWatchSyncAvailability();
  if (!availability.supported) {
    throw new Error(availability.reason ?? 'Watch sync unavailable');
  }

  if (typeof upload !== 'function') {
    throw new Error('Watch sync upload handler is not configured.');
  }

  await requestWatchPermissions();
  const payload = await readWatchHealthData(36);

  if (isEmptyWatchPayload(payload)) {
    throw new Error(
      'No Health data found for the last day. Wear your Apple Watch overnight, open the Health app once, then try again.'
    );
  }

  await upload(payload);
  return payload;
}
