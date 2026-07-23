import {
  requireOptionalNativeModule,
  type EventSubscription,
} from 'expo-modules-core';
import { Platform } from 'react-native';

type WatchStatus = {
  supported: boolean;
  paired: boolean;
  watchAppInstalled: boolean;
  reachable: boolean;
  activated: boolean;
};

type WatchDoseActionEvent = {
  id: string;
  action: string;
  createdAt?: string;
};

type WatchBridgeNative = {
  isSupported(): boolean;
  getStatus(): WatchStatus;
  pushContext(payload: Record<string, unknown>): Promise<void>;
  addListener(
    eventName: 'onWatchDoseAction',
    listener: (event: WatchDoseActionEvent) => void
  ): EventSubscription;
};

const Native =
  Platform.OS === 'ios'
    ? requireOptionalNativeModule<WatchBridgeNative>('WatchBridge')
    : null;

export function isWatchBridgeAvailable(): boolean {
  return Native != null;
}

export function getWatchBridgeStatus(): WatchStatus {
  if (!Native) {
    return {
      supported: false,
      paired: false,
      watchAppInstalled: false,
      reachable: false,
      activated: false,
    };
  }
  try {
    return Native.getStatus();
  } catch {
    return {
      supported: false,
      paired: false,
      watchAppInstalled: false,
      reachable: false,
      activated: false,
    };
  }
}

/** Push latest doses/summary/alert snapshot to the paired Watch. */
export async function pushWatchContext(payload: {
  dosesJson: string;
  summaryJson: string;
  alertJson: string | null;
  lastSyncAt: string;
}): Promise<void> {
  if (!Native) return;
  try {
    await Native.pushContext({
      type: 'dose_sync',
      dosesJson: payload.dosesJson,
      summaryJson: payload.summaryJson,
      alertJson: payload.alertJson ?? '',
      lastSyncAt: payload.lastSyncAt,
    });
  } catch {
    // Watch may be unpaired / session not ready — never block the phone app.
  }
}

export function addWatchDoseActionListener(
  listener: (event: WatchDoseActionEvent) => void
): EventSubscription {
  if (!Native?.addListener) {
    return { remove() {} };
  }
  return Native.addListener('onWatchDoseAction', listener);
}
