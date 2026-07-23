import type { CabinetItem, DoseEvent } from '@/types/api';
import { formatTime } from '@/lib/format';

export const LOW_QUANTITY_THRESHOLD = 5;

export type CabinetTab = 'Active' | 'As needed' | 'Completed';

export function periodIconForHour(hour: number): 'sunny-outline' | 'partly-sunny-outline' | 'moon-outline' {
  if (hour < 12) return 'sunny-outline';
  if (hour < 18) return 'partly-sunny-outline';
  return 'moon-outline';
}

export function formatNextDoseLine(iso: string): string {
  const when = new Date(iso);
  const ms = when.getTime() - Date.now();
  const time = formatTime(iso);

  if (ms <= 0) return `Due now · ${time}`;

  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return `Next dose ${time} · In ${mins} min`;

  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours < 24) {
    return rem > 0
      ? `Next dose ${time} · In ${hours}h ${rem}m`
      : `Next dose ${time} · In ${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `Next dose ${time} · In ${days}d`;
}

export function nextDoseByCabinetItem(
  doses: DoseEvent[]
): Map<string, DoseEvent> {
  const map = new Map<string, DoseEvent>();
  const now = Date.now();
  for (const dose of doses) {
    if (dose.status !== 'DUE' && dose.status !== 'SNOOZED') continue;
    const at = new Date(dose.snoozedUntil ?? dose.scheduledFor).getTime();
    if (at < now - 60 * 60 * 1000) continue; // ignore very stale
    const existing = map.get(dose.cabinetItemId);
    if (!existing) {
      map.set(dose.cabinetItemId, dose);
      continue;
    }
    const existingAt = new Date(existing.snoozedUntil ?? existing.scheduledFor).getTime();
    if (at < existingAt) map.set(dose.cabinetItemId, dose);
  }
  return map;
}

export function filterCabinetItems(items: CabinetItem[], tab: CabinetTab): CabinetItem[] {
  return items.filter((item) => {
    const hasSchedule = (item.schedules?.length ?? 0) > 0;
    if (tab === 'Active') return item.active && hasSchedule;
    if (tab === 'As needed') return item.active && !hasSchedule;
    return !item.active;
  });
}

export function isLowQuantity(item: CabinetItem): boolean {
  return item.quantity != null && item.quantity <= LOW_QUANTITY_THRESHOLD;
}

export function weekBounds(reference = new Date()): { from: string; to: string } {
  const start = new Date(reference);
  const day = start.getDay(); // 0 Sun
  // Start week on Monday
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

export function adherenceStats(doses: DoseEvent[]) {
  const relevant = doses.filter((d) =>
    ['TAKEN', 'MISSED', 'SKIPPED', 'DUE', 'SNOOZED'].includes(d.status)
  );
  const taken = relevant.filter((d) => d.status === 'TAKEN').length;
  const expected = relevant.filter((d) =>
    ['TAKEN', 'MISSED', 'SKIPPED'].includes(d.status)
  ).length;
  const pct = expected > 0 ? Math.round((taken / expected) * 100) : 0;

  // Mon–Sun flags for completed week days with any TAKEN
  const byDay = Array.from({ length: 7 }, () => false);
  for (const dose of doses) {
    if (dose.status !== 'TAKEN') continue;
    const d = new Date(dose.scheduledFor);
    const js = d.getDay();
    const idx = js === 0 ? 6 : js - 1; // Mon=0
    byDay[idx] = true;
  }

  return { taken, expected, pct, byDay };
}
