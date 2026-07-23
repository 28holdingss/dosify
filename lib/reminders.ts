import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type * as ExpoNotifications from 'expo-notifications';

const STORAGE_KEY = 'bioos.local-dose-reminders';
const ANDROID_CHANNEL_ID = 'medication-reminders';
const MAX_SCHEDULED_REMINDERS = 32;

type ReminderDose = {
  id: string;
  scheduledFor: string;
  status: string;
  snoozedUntil?: string | null;
  cabinetItem?: {
    displayName?: string | null;
    substance?: { name: string } | null;
  } | null;
  schedule?: {
    cabinetItem?: {
      displayName?: string | null;
      substance?: { name: string } | null;
    } | null;
  } | null;
};

function doseName(dose: ReminderDose) {
  const item = dose.cabinetItem ?? dose.schedule?.cabinetItem;
  return item?.displayName || item?.substance?.name || 'Medication';
}

function reminderWhen(dose: ReminderDose): Date | null {
  if (dose.status === 'DUE') {
    const at = new Date(dose.scheduledFor);
    return Number.isNaN(at.getTime()) ? null : at;
  }
  if (dose.status === 'SNOOZED' && dose.snoozedUntil) {
    const at = new Date(dose.snoozedUntil);
    return Number.isNaN(at.getTime()) ? null : at;
  }
  return null;
}

async function loadNotificationModule() {
  if (Platform.OS === 'web') return null;
  return import('expo-notifications');
}

export async function configureReminderNotifications() {
  const Notifications = await loadNotificationModule();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestReminderPermission() {
  const Notifications = await loadNotificationModule();
  if (!Notifications) return false;

  const current = await Notifications.getPermissionsAsync();
  const result =
    current.status === 'granted'
      ? current
      : await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true },
        });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Medication reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return result.status === 'granted';
}

export async function cancelLocalDoseReminders() {
  const Notifications = await loadNotificationModule();
  if (!Notifications) return;

  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const identifiers = raw ? (JSON.parse(raw) as string[]) : [];
  await Promise.all(
    identifiers.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined)
    )
  );
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function syncLocalDoseReminders(doses: ReminderDose[]) {
  const Notifications = await loadNotificationModule();
  if (!Notifications) return { scheduled: 0, supported: false };
  if (!(await requestReminderPermission())) return { scheduled: 0, supported: true };

  await cancelLocalDoseReminders();

  const now = Date.now();
  const upcoming = doses
    .map((dose) => ({ dose, when: reminderWhen(dose) }))
    .filter((row): row is { dose: ReminderDose; when: Date } => {
      return row.when != null && row.when.getTime() > now;
    })
    .sort((a, b) => a.when.getTime() - b.when.getTime())
    .slice(0, MAX_SCHEDULED_REMINDERS);

  const identifiers: string[] = [];
  for (const { dose, when } of upcoming) {
    const isSnooze = dose.status === 'SNOOZED';
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: isSnooze
          ? `${doseName(dose)} — snooze ended`
          : `${doseName(dose)} is due`,
        body: isSnooze
          ? 'Your snooze window ended. Open Dosify to take, skip, or snooze again.'
          : 'Open Dosify to mark it as taken, skipped, or snoozed.',
        sound: 'default',
        data: { route: '/todays-doses', doseEventId: dose.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
      },
    });
    identifiers.push(identifier);
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(identifiers));
  return { scheduled: identifiers.length, supported: true };
}

type NotificationResponseListener = (
  response: ExpoNotifications.NotificationResponse
) => void;

/** Route taps on local notifications (dose due / snooze). */
export async function addReminderResponseListener(
  onResponse: NotificationResponseListener
): Promise<() => void> {
  const Notifications = await loadNotificationModule();
  if (!Notifications) return () => undefined;

  const sub = Notifications.addNotificationResponseReceivedListener(onResponse);

  // Cold start: user opened the app by tapping a notification.
  try {
    const last = await Notifications.getLastNotificationResponseAsync();
    if (last) onResponse(last);
  } catch {
    // ignore
  }

  return () => sub.remove();
}
