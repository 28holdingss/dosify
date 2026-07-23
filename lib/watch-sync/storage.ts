import { requireOptionalNativeModule } from 'expo-modules-core';

const AUTO_SYNC_KEY = '@dosify/watch_auto_sync';
const LAST_SYNC_KEY = '@dosify/watch_last_sync';
const LAST_AUTO_SYNC_KEY = '@dosify/watch_last_auto_sync';
/** Legacy keys — still read so existing installs keep preferences. */
const LEGACY_AUTO_SYNC_KEY = '@bioos/watch_auto_sync';
const LEGACY_LAST_SYNC_KEY = '@bioos/watch_last_sync';

/** Minimum gap between automatic foreground syncs. */
export const AUTO_SYNC_MIN_INTERVAL_MS = 30 * 60 * 1000;

type KeyValueStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStorage: KeyValueStorage = {
  getItem: async (key) => memory.get(key) ?? null,
  setItem: async (key, value) => {
    memory.set(key, value);
  },
};

let cachedStorage: KeyValueStorage | undefined;

function getStorage(): KeyValueStorage {
  if (cachedStorage !== undefined) return cachedStorage;

  const nativeModule = requireOptionalNativeModule('RNCAsyncStorage');
  if (!nativeModule) {
    cachedStorage = memoryStorage;
    return cachedStorage;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-async-storage/async-storage');
    cachedStorage = (mod.default ?? mod) as KeyValueStorage;
    return cachedStorage;
  } catch {
    cachedStorage = memoryStorage;
    return cachedStorage;
  }
}

async function safeGetItem(key: string): Promise<string | null> {
  try {
    return await getStorage().getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

async function safeSetItem(key: string, value: string): Promise<void> {
  try {
    await getStorage().setItem(key, value);
  } catch {
    memory.set(key, value);
  }
}

export async function getAutoSyncEnabled(): Promise<boolean> {
  const value = (await safeGetItem(AUTO_SYNC_KEY)) ?? (await safeGetItem(LEGACY_AUTO_SYNC_KEY));
  // Default on for supported installs once the user has synced at least once.
  if (value == null) return false;
  return value === '1';
}

export async function setAutoSyncEnabled(enabled: boolean): Promise<void> {
  await safeSetItem(AUTO_SYNC_KEY, enabled ? '1' : '0');
}

export async function getLocalLastSyncAt(): Promise<string | null> {
  return (await safeGetItem(LAST_SYNC_KEY)) ?? (await safeGetItem(LEGACY_LAST_SYNC_KEY));
}

export async function setLocalLastSyncAt(iso: string): Promise<void> {
  await safeSetItem(LAST_SYNC_KEY, iso);
}

export async function getLastAutoSyncAt(): Promise<string | null> {
  return safeGetItem(LAST_AUTO_SYNC_KEY);
}

export async function setLastAutoSyncAt(iso: string): Promise<void> {
  await safeSetItem(LAST_AUTO_SYNC_KEY, iso);
}

export async function shouldRunAutoSync(now = Date.now()): Promise<boolean> {
  if (!(await getAutoSyncEnabled())) return false;
  const last = await getLastAutoSyncAt();
  if (!last) return true;
  return now - new Date(last).getTime() >= AUTO_SYNC_MIN_INTERVAL_MS;
}
