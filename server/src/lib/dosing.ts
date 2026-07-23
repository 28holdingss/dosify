import type { MedicationSchedule } from '@prisma/client';
import { prisma } from './prisma.js';

/** How far ahead dose events are materialized. */
export const MATERIALIZE_DAYS = 14;
/** Alias used by dose routes for window validation. */
export const MAX_GENERATION_WINDOW_DAYS = MATERIALIZE_DAYS;
/** Hard cap on events created per schedule per materialization pass. */
const MAX_EVENTS_PER_SCHEDULE = 200;
/** DUE doses older than this are lazily marked MISSED. */
const MISSED_GRACE_MS = 12 * 60 * 60 * 1000;

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Offset (ms) of `timeZone` from UTC at the given instant. */
function tzOffsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') % 24,
    get('minute'),
    get('second')
  );
  return asUtc - utcMs;
}

/** Converts wall-clock components in `timeZone` to a UTC Date. */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let ts = guess - tzOffsetMs(guess, timeZone);
  ts = guess - tzOffsetMs(ts, timeZone);
  return new Date(ts);
}

function localDateParts(utcMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    dayOfWeek: weekdays.indexOf(get('weekday')),
  };
}

function parseTimes(value: unknown): { hour: number; minute: number }[] {
  if (!Array.isArray(value)) return [];
  const out: { hour: number; minute: number }[] = [];
  for (const t of value) {
    if (typeof t !== 'string') continue;
    const m = TIME_RE.exec(t);
    if (m) out.push({ hour: Number(m[1]), minute: Number(m[2]) });
  }
  return out;
}

function parseDaysOfWeek(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((d): d is number => typeof d === 'number' && d >= 0 && d <= 6);
}

export function computeOccurrences(
  schedule: Pick<
    MedicationSchedule,
    'recurrence' | 'times' | 'intervalHours' | 'daysOfWeek' | 'startDate' | 'endDate' | 'timezone'
  >,
  windowStart: Date,
  windowEnd: Date
): Date[] {
  const tz = isValidTimezone(schedule.timezone) ? schedule.timezone : 'UTC';
  const startMs = Math.max(windowStart.getTime(), schedule.startDate.getTime());
  const endMs = Math.min(
    windowEnd.getTime(),
    schedule.endDate ? schedule.endDate.getTime() : Infinity
  );
  if (startMs > endMs) return [];

  const occurrences: Date[] = [];

  if (schedule.recurrence === 'INTERVAL') {
    const stepMs = (schedule.intervalHours ?? 0) * 60 * 60 * 1000;
    if (stepMs <= 0) return [];
    let ts = schedule.startDate.getTime();
    if (ts < startMs) {
      ts += Math.ceil((startMs - ts) / stepMs) * stepMs;
    }
    while (ts <= endMs && occurrences.length < MAX_EVENTS_PER_SCHEDULE) {
      occurrences.push(new Date(ts));
      ts += stepMs;
    }
    return occurrences;
  }

  const times = parseTimes(schedule.times);
  if (times.length === 0) return [];
  const weeklyDays = parseDaysOfWeek(schedule.daysOfWeek);

  const dayMs = 24 * 60 * 60 * 1000;
  for (let cursor = startMs - dayMs; cursor <= endMs + dayMs; cursor += dayMs) {
    const local = localDateParts(cursor, tz);

    if (schedule.recurrence === 'WEEKDAYS' && (local.dayOfWeek === 0 || local.dayOfWeek === 6)) {
      continue;
    }
    if (schedule.recurrence === 'WEEKLY' && !weeklyDays.includes(local.dayOfWeek)) {
      continue;
    }

    for (const t of times) {
      const at = zonedTimeToUtc(local.year, local.month, local.day, t.hour, t.minute, tz);
      const ms = at.getTime();
      if (ms >= startMs && ms <= endMs) occurrences.push(at);
    }
    if (occurrences.length >= MAX_EVENTS_PER_SCHEDULE) break;
  }

  const unique = [...new Set(occurrences.map((d) => d.getTime()))].sort((a, b) => a - b);
  return unique.slice(0, MAX_EVENTS_PER_SCHEDULE).map((ms) => new Date(ms));
}

export async function materializeScheduleDoseEvents(
  schedule: MedicationSchedule,
  now: Date = new Date(),
  windowEndOverride?: Date
): Promise<number> {
  const windowEnd =
    windowEndOverride ?? new Date(now.getTime() + MATERIALIZE_DAYS * 24 * 60 * 60 * 1000);

  await prisma.doseEvent.deleteMany({
    where: {
      scheduleId: schedule.id,
      status: 'DUE',
      scheduledFor: { gt: now },
    },
  });

  if (!schedule.active) return 0;

  const occurrences = computeOccurrences(schedule, now, windowEnd);
  if (occurrences.length === 0) return 0;

  const result = await prisma.doseEvent.createMany({
    data: occurrences.map((scheduledFor) => ({
      userId: schedule.userId,
      scheduleId: schedule.id,
      cabinetItemId: schedule.cabinetItemId,
      scheduledFor,
    })),
    skipDuplicates: true,
  });
  return result.count;
}

export async function materializeDoseEvents(
  userId: string,
  from: Date = new Date(),
  to?: Date
): Promise<number> {
  const windowEnd = to ?? new Date(from.getTime() + MATERIALIZE_DAYS * 24 * 60 * 60 * 1000);
  const schedules = await prisma.medicationSchedule.findMany({
    where: { userId, active: true },
  });

  let created = 0;
  for (const schedule of schedules) {
    created += await materializeScheduleDoseEvents(schedule, from, windowEnd);
  }
  return created;
}

export async function markMissedDoseEvents(userId: string, now: Date = new Date()) {
  const cutoff = new Date(now.getTime() - MISSED_GRACE_MS);

  const overdue = await prisma.doseEvent.findMany({
    where: {
      userId,
      OR: [
        { status: 'DUE', scheduledFor: { lt: cutoff } },
        { status: 'SNOOZED', snoozedUntil: { lt: cutoff } },
      ],
    },
    include: {
      cabinetItem: { include: { substance: { select: { name: true } } } },
    },
    take: 40,
  });

  if (overdue.length === 0) return 0;

  const result = await prisma.doseEvent.updateMany({
    where: { id: { in: overdue.map((d) => d.id) } },
    data: { status: 'MISSED', snoozedUntil: null },
  });

  try {
    const { notifyMissedDoses } = await import('./notifications.js');
    await notifyMissedDoses(
      userId,
      overdue.map((d) => ({
        id: d.id,
        name: d.cabinetItem.displayName?.trim() || d.cabinetItem.substance.name,
      }))
    );
  } catch {
    // Inbox notify is best-effort
  }

  return result.count;
}

export const markOverdueDosesMissed = markMissedDoseEvents;
