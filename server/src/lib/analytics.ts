export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function rangeToDays(range: string): number {
  switch (range) {
    case '7D':
      return 7;
    case '30D':
      return 30;
    case '1Y':
      return 365;
    case '90D':
    default:
      return 90;
  }
}

export function generateEffectCurve(peakScore: number, pointCount = 12): number[] {
  const peak = Math.max(1, Math.min(pointCount - 2, Math.floor(pointCount * 0.35)));
  return Array.from({ length: pointCount }, (_, i) => {
    if (peakScore <= 0) return 0;
    if (i <= peak) {
      return Math.round(peakScore * (i / peak));
    }
    const tail = pointCount - 1 - peak;
    const decay = (pointCount - 1 - i) / tail;
    return Math.round(peakScore * Math.max(0, decay));
  });
}

export function formatHourLabel(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }).toLowerCase();
}

export function dayLabels(count: number): string[] {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(labels[d.getDay()]);
  }
  return result;
}
