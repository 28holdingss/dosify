import { requireOptionalNativeModule } from 'expo-modules-core';

const AUTO_SYNC_KEY = '@bioos/watch_auto_sync';
const LAST_SYNC_KEY = '@bioos/watch_last_sync';

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

let cachedStorage: KeyValueStorage | null | undefined;

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
  const value = await safeGetItem(AUTO_SYNC_KEY);
  return value === '1';
}

export async function setAutoSyncEnabled(enabled: boolean): Promise<void> {
  await safeSetItem(AUTO_SYNC_KEY, enabled ? '1' : '0');
}

export async function getLocalLastSyncAt(): Promise<string | null> {
  return safeGetItem(LAST_SYNC_KEY);
}

export async function setLocalLastSyncAt(iso: string): Promise<void> {
  await safeSetItem(LAST_SYNC_KEY, iso);
}
