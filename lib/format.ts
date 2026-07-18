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

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
