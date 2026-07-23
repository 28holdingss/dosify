export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatIntakeDateTime(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (isToday) return `Today · ${time}`;
  if (isYesterday) return `Yesterday · ${time}`;

  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return `${datePart} · ${time}`;
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatGender(gender: string | null | undefined): string {
  if (!gender) return '—';
  return gender.charAt(0) + gender.slice(1).toLowerCase().replace(/_/g, ' ');
}

export function formatRecoveryTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  const now = new Date();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const isNextDay =
    d.getDate() !== now.getDate() || d.getMonth() !== now.getMonth();
  if (isNextDay) return `Tomorrow, ${time}`;
  return `${d.toLocaleDateString('en-US', { weekday: 'short' })}, ${time}`;
}

export function hoursUntil(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const ms = new Date(dateStr).getTime() - Date.now();
  if (ms <= 0) return 'Recovery window reached';
  const hours = Math.floor(ms / 3600000);
  const mins = Math.round((ms % 3600000) / 60000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const rem = hours % 24;
    return rem > 0 ? `~${days}d ${rem}h remaining` : `~${days}d remaining`;
  }
  if (hours > 0) return mins > 0 ? `~${hours}h ${mins}m remaining` : `~${hours}h remaining`;
  return `~${Math.max(1, mins)}m remaining`;
}

export function recoveryCountdownProgress(
  estimatedAt: string | null | undefined,
  windowHours = 24
): number {
  if (!estimatedAt) return 0;
  const remaining = new Date(estimatedAt).getTime() - Date.now();
  if (remaining <= 0) return 100;
  const elapsed = windowHours * 3600000 - remaining;
  return Math.min(100, Math.max(0, Math.round((elapsed / (windowHours * 3600000)) * 100)));
}

export function riskLevelToLabel(level: string): 'Low' | 'Moderate' | 'High' {
  if (level === 'HIGH') return 'High';
  if (level === 'MODERATE') return 'Moderate';
  return 'Low';
}

export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Friendly label like "Accra (GMT)" from an IANA zone. */
export function formatTimezoneLabel(timeZone: string): string {
  const city = timeZone.split('/').pop()?.replace(/_/g, ' ') ?? timeZone;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    }).formatToParts(new Date());
    const short = parts.find((part) => part.type === 'timeZoneName')?.value;
    return short ? `${city} (${short})` : city;
  } catch {
    return city;
  }
}

/** Start/end of local calendar day as ISO strings for dose range queries. */
export function localDayBounds(date = new Date()): { from: string; to: string } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

export function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr.length <= 10 ? `${dateStr}T12:00:00` : dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRecurrenceLabel(
  recurrence: string,
  opts?: { intervalHours?: number | null; daysOfWeek?: number[] | null; times?: string[] }
): string {
  const times = opts?.times?.length ? opts.times.join(', ') : null;
  let base = recurrence;
  if (recurrence === 'DAILY') base = 'Daily';
  else if (recurrence === 'WEEKDAYS') base = 'Weekdays';
  else if (recurrence === 'WEEKLY') {
    const days = opts?.daysOfWeek;
    if (days?.length) {
      const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      base = days.map((d) => labels[d] ?? d).join(', ');
    } else {
      base = 'Weekly';
    }
  } else if (recurrence === 'INTERVAL') {
    const h = opts?.intervalHours;
    base = h ? `Every ${h}h` : 'Interval';
  }
  return times ? `${base} · ${times}` : base;
}

export function cabinetItemLabel(item: {
  displayName?: string | null;
  substance?: { name?: string } | null;
}): string {
  return item.displayName?.trim() || item.substance?.name || 'Cabinet item';
}

export function toDateInputValue(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseOptionalNumber(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
