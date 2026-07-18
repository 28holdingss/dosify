import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { NativeModules, Platform } from 'react-native';

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
      reason: 'Requires the Dosify dev build — HealthKit is not available in Expo Go.',
    };
  }
  if (!hasNativeHealthKit()) {
    return {
      supported: false,
      reason: 'HealthKit native module is not linked. Rebuild the app with npm run ios.',
    };
  }
  if (!loadHealthKitModule()) {
    return {
      supported: false,
      reason: 'HealthKit APIs are unavailable. Rebuild the app with npm run ios.',
    };
  }
  return { supported: true };
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

function sleepHoursFromSamples(samples: HealthSample[]): number | null {
  const asleepValues = new Set(['ASLEEP', 'INBED', 'CORE', 'DEEP', 'REM']);
  let totalMs = 0;

  for (const sample of samples) {
    const value = typeof sample.value === 'string' ? sample.value : null;
    if (value && !asleepValues.has(value)) continue;
    if (!sample.startDate || !sample.endDate) continue;
    const start = new Date(sample.startDate).getTime();
    const end = new Date(sample.endDate).getTime();
    if (end > start) totalMs += end - start;
  }

  if (totalMs <= 0) return null;
  return Math.round((totalMs / 3600000) * 10) / 10;
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
      ],
      write: [] as string[],
    },
  };

  if (typeof kit.isAvailable === 'function') {
    const available = await promisify<boolean>('isAvailable', (cb) => kit.isAvailable!(cb));
    if (!available) {
      throw new Error('HealthKit is not available on this device.');
    }
  }

  await promisify<void>('initHealthKit', (cb) => kit.initHealthKit!(permissions, cb));
  return true;
}

export async function readWatchHealthData(hoursBack = 24): Promise<WatchSyncPayload> {
  const kit = getHealthKit();

  const endDate = new Date();
  const startDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const range = {
    startDate: startDate.toISOString(),
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
        kit.getActiveEnergyBurned!(range, cb)
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
  const payload = await readWatchHealthData(24);
  await upload(payload);
  return payload;
}
