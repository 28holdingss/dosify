import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'bioos.local-dose-reminders';
const ANDROID_CHANNEL_ID = 'medication-reminders';
const MAX_SCHEDULED_REMINDERS = 32;

type ReminderDose = {
  id: string;
  scheduledFor: string;
  status: string;
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
    .filter((dose) => dose.status === 'DUE' && new Date(dose.scheduledFor).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    )
    .slice(0, MAX_SCHEDULED_REMINDERS);

  const identifiers: string[] = [];
  for (const dose of upcoming) {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${doseName(dose)} is due`,
        body: 'Open BioOS to mark it as taken, skipped, or snoozed.',
        sound: 'default',
        data: { route: '/todays-doses', doseEventId: dose.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(dose.scheduledFor),
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
      },
    });
    identifiers.push(identifier);
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(identifiers));
  return { scheduled: identifiers.length, supported: true };
}

