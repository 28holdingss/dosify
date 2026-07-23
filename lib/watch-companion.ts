import { AppState, Platform, type AppStateStatus } from 'react-native';
import { ExtensionStorage } from '@bacons/apple-targets';
import {
  addWatchDoseActionListener,
  isWatchBridgeAvailable,
  pushWatchContext,
} from '../modules/watch-bridge/src';
import { api } from '@/lib/api';
import { cabinetItemLabel, formatTime, localDayBounds } from '@/lib/format';
import type { DoseEvent, Interaction, RiskLevel } from '@/types/api';

export const WATCH_APP_GROUP = 'group.com.dhafee.dosify';

const KEYS = {
  doses: 'watch.doses',
  pendingActions: 'watch.pendingActions',
  lastSyncAt: 'watch.lastSyncAt',
  summary: 'watch.summary',
  alert: 'watch.alert',
} as const;

export type WatchDosePayload = {
  id: string;
  name: string;
  scheduledFor: string;
  status: string;
  timeLabel: string;
  doseLabel: string | null;
  hint: string | null;
};

export type WatchSummaryPayload = {
  taken: number;
  total: number;
  percent: number;
  streakDays: number;
};

export type WatchAlertPayload = {
  riskLevel: RiskLevel;
  title: string;
  advice: string | null;
  pairLabel: string;
} | null;

export type WatchPendingAction = {
  id: string;
  action: string;
  createdAt: string;
};

function storage(): ExtensionStorage | null {
  if (Platform.OS !== 'ios') return null;
  try {
    return new ExtensionStorage(WATCH_APP_GROUP);
  } catch {
    return null;
  }
}

function toWatchDose(dose: DoseEvent): WatchDosePayload {
  const item = dose.cabinetItem ?? dose.schedule?.cabinetItem;
  const name = item ? cabinetItemLabel(item) : 'Medication';
  const doseLabel =
    item?.doseValue != null && item.doseUnit
      ? `${item.doseValue} ${item.doseUnit}`
      : item?.doseValue != null
        ? String(item.doseValue)
        : null;
  const hint = item?.instructions?.trim() || null;
  return {
    id: dose.id,
    name,
    scheduledFor: dose.scheduledFor,
    status: dose.status,
    timeLabel: formatTime(dose.scheduledFor),
    doseLabel,
    hint,
  };
}

function dayKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function dayKeyFromIso(iso: string): string {
  return dayKeyFromDate(new Date(iso));
}

function summarizeToday(doses: DoseEvent[]): Omit<WatchSummaryPayload, 'streakDays'> {
  const actionable = doses.filter((d) => d.status !== 'SKIPPED');
  const total = actionable.length || doses.length;
  const taken = doses.filter((d) => d.status === 'TAKEN').length;
  const percent = total > 0 ? Math.round((taken / total) * 100) : 0;
  return { taken, total, percent };
}

/** Consecutive days (ending today) where every non-skipped dose was taken. */
function computeStreak(history: DoseEvent[]): number {
  const byDay = new Map<string, DoseEvent[]>();
  for (const dose of history) {
    const key = dayKeyFromIso(dose.scheduledFor);
    const list = byDay.get(key) ?? [];
    list.push(dose);
    byDay.set(key, list);
  }

  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 30; i += 1) {
    const key = dayKeyFromDate(cursor);
    const list = byDay.get(key) ?? [];
    if (list.length === 0) {
      if (i === 0) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
    const relevant = list.filter((d) => d.status !== 'SKIPPED');
    const pool = relevant.length > 0 ? relevant : list;
    const complete = pool.length > 0 && pool.every((d) => d.status === 'TAKEN');
    if (!complete) {
      if (i === 0) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function pickWatchAlert(interactions: Interaction[]): WatchAlertPayload {
  const ranked = [...interactions].sort((a, b) => {
    const order = { HIGH: 0, MODERATE: 1, LOW: 2 } as const;
    return order[a.riskLevel] - order[b.riskLevel];
  });
  const top = ranked[0];
  if (!top || top.riskLevel === 'LOW') return null;
  return {
    riskLevel: top.riskLevel,
    title: top.title,
    advice: top.advice ?? 'Avoid combining',
    pairLabel: `${top.substanceA.name} + ${top.substanceB.name}`,
  };
}

async function applyWatchAction(action: WatchPendingAction): Promise<boolean> {
  try {
    if (action.action === 'taken') {
      await api.markDoseTaken(action.id);
    } else if (action.action === 'skipped') {
      await api.markDoseSkipped(action.id);
    } else if (action.action === 'snoozed') {
      await api.markDoseSnoozed(action.id, { snoozeMinutes: 10 });
    } else {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Push today's doses + summary + alert to the Watch via WatchConnectivity. */
export async function syncDosesToWatch(doses?: DoseEvent[]): Promise<number> {
  if (Platform.OS !== 'ios') return 0;

  let list = doses;
  if (!list) {
    const { from, to } = localDayBounds();
    list = await api.getDoses({ from, to });
  }

  const payload = list.map(toWatchDose);
  const dosesJson = JSON.stringify(payload);
  const lastSyncAt = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const todaySummary = summarizeToday(list);
  let streakDays = 0;
  try {
    const historyFrom = new Date();
    historyFrom.setDate(historyFrom.getDate() - 14);
    historyFrom.setHours(0, 0, 0, 0);
    const history = await api.getDoses({
      from: historyFrom.toISOString(),
      to: localDayBounds().to,
    });
    streakDays = computeStreak(history);
  } catch {
    streakDays = todaySummary.percent === 100 && todaySummary.total > 0 ? 1 : 0;
  }

  const summary: WatchSummaryPayload = { ...todaySummary, streakDays };
  const summaryJson = JSON.stringify(summary);

  let alert: WatchAlertPayload = null;
  try {
    const interactions = await api.getInteractions();
    alert = pickWatchAlert(interactions);
  } catch {
    alert = null;
  }
  const alertJson = alert ? JSON.stringify(alert) : null;

  // Keep App Group write for same-device extensions/widgets; Watch needs WCSession.
  const store = storage();
  if (store) {
    try {
      store.set(KEYS.doses, dosesJson);
      store.set(KEYS.lastSyncAt, lastSyncAt);
      store.set(KEYS.summary, summaryJson);
      if (alertJson) store.set(KEYS.alert, alertJson);
      else store.remove(KEYS.alert);
    } catch {
      // ignore
    }
  }

  await pushWatchContext({
    dosesJson,
    summaryJson,
    alertJson,
    lastSyncAt,
  });

  return payload.length;
}

function readPendingActions(store: ExtensionStorage): WatchPendingAction[] {
  const raw = store.get(KEYS.pendingActions);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as WatchPendingAction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Apply Taken / Skip / Snooze actions queued in App Group (legacy / fallback). */
export async function processWatchPendingActions(): Promise<number> {
  const store = storage();
  if (!store) return 0;

  const pending = readPendingActions(store);
  if (pending.length === 0) return 0;

  let handled = 0;
  const remaining: WatchPendingAction[] = [];

  for (const action of pending) {
    const ok = await applyWatchAction(action);
    if (ok) handled += 1;
    else remaining.push(action);
  }

  if (remaining.length === 0) {
    store.remove(KEYS.pendingActions);
  } else {
    store.set(KEYS.pendingActions, JSON.stringify(remaining));
  }

  if (handled > 0) {
    await syncDosesToWatch();
  }

  return handled;
}

/** Sync doses out + drain Watch actions. Safe to call often. */
export async function refreshWatchCompanion(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    await processWatchPendingActions();
    await syncDosesToWatch();
  } catch {
    // Watch bridge is best-effort; never block the main app.
  }
}

let companionStarted = false;

/** Foreground listener so Watch stays in sync while Dosify is used. */
export function startWatchCompanionBridge(): () => void {
  if (Platform.OS !== 'ios' || companionStarted) {
    return () => undefined;
  }
  companionStarted = true;

  void refreshWatchCompanion();

  const onChange = (next: AppStateStatus) => {
    if (next === 'active') {
      void refreshWatchCompanion();
    }
  };
  const sub = AppState.addEventListener('change', onChange);

  const actionSub = isWatchBridgeAvailable()
    ? addWatchDoseActionListener((event) => {
        void (async () => {
          const ok = await applyWatchAction({
            id: event.id,
            action: event.action,
            createdAt: event.createdAt ?? new Date().toISOString(),
          });
          if (ok) {
            await syncDosesToWatch();
          }
        })();
      })
    : { remove() {} };

  return () => {
    sub.remove();
    actionSub.remove();
    companionStarted = false;
  };
}
