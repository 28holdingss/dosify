export const colors = {
  background: '#0B0E14',
  surface: '#141824',
  surfaceLight: '#1C2233',
  border: '#2A3144',
  text: '#FFFFFF',
  textSecondary: '#8B95A8',
  textMuted: '#5C6578',
  primary: '#6366F1',
  primaryEnd: '#8B5CF6',
  accent: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  purple: '#A855F7',
  pink: '#EC4899',
  orange: '#F97316',
  yellow: '#EAB308',
  green: '#10B981',
  red: '#DC2626',
  blue: '#3B82F6',
  gradientStart: '#3B82F6',
  gradientEnd: '#8B5CF6',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const layout = {
  /** Max content column width on narrow/mobile web. */
  maxContentWidth: 640,
  /** Max content column width on desktop web (with sidebar). */
  maxDesktopContentWidth: 960,
  /** Width of the desktop web sidebar navigation. */
  sidebarWidth: 248,
  /** Window width at which web switches to the desktop layout. */
  desktopBreakpoint: 1024,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  small: { fontSize: 11, fontWeight: '500' as const },
};

export function getRiskColor(score: number) {
  if (score >= 70) return colors.danger;
  if (score >= 40) return colors.warning;
  return colors.success;
}

export function getRiskLabel(score: number) {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Moderate';
  return 'Low';
}

/** Recovery % — higher is better (inverse of risk scoring). */
export function getRecoveryColor(pct: number) {
  if (pct >= 70) return colors.success;
  if (pct >= 40) return colors.warning;
  return colors.danger;
}

export function getRecoveryLabel(pct: number) {
  if (pct >= 85) return 'Excellent';
  if (pct >= 70) return 'Strong';
  if (pct >= 40) return 'Moderate';
  return 'Low';
}

/** Spatial UI — Apple-style minimal, light & dark */
export type SpatialTheme = {
  background: string;
  glass: string;
  card: string;
  separator: string;
  pressed: string;
  accent: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  blurTint: 'light' | 'dark';
  liquid: {
    fill: string;
    highlight: string;
    rim: string;
    indicator: string;
    shadow: string;
  };
};

export const spatialLight: SpatialTheme = {
  background: '#F2F2F7',
  glass: '#FFFFFF',
  card: '#FFFFFF',
  separator: 'rgba(60, 60, 67, 0.12)',
  pressed: 'rgba(0, 0, 0, 0.04)',
  accent: '#007AFF',
  text: '#000000',
  textSecondary: 'rgba(60, 60, 67, 0.6)',
  textMuted: 'rgba(60, 60, 67, 0.3)',
  blurTint: 'light',
  liquid: {
    fill: 'rgba(255, 255, 255, 0.55)',
    highlight: 'rgba(255, 255, 255, 0.85)',
    rim: 'rgba(255, 255, 255, 0.65)',
    indicator: 'rgba(255, 255, 255, 0.72)',
    shadow: 'rgba(0, 0, 0, 0.12)',
  },
};

export const spatialDark: SpatialTheme = {
  background: colors.background,
  glass: colors.surface,
  card: colors.surfaceLight,
  separator: colors.border,
  pressed: 'rgba(255, 255, 255, 0.06)',
  accent: colors.primary,
  text: colors.text,
  textSecondary: colors.textSecondary,
  textMuted: colors.textMuted,
  blurTint: 'dark',
  liquid: {
    fill: 'rgba(20, 24, 36, 0.72)',
    highlight: 'rgba(255, 255, 255, 0.14)',
    rim: 'rgba(255, 255, 255, 0.12)',
    indicator: 'rgba(255, 255, 255, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.45)',
  },
};

export function getSpatialTheme(scheme: 'light' | 'dark'): SpatialTheme {
  return scheme === 'light' ? spatialLight : spatialDark;
}

export const indicatorIcons = {
  cognitiveLoad: { icon: 'bulb-outline' as const, bg: 'rgba(168, 85, 247, 0.18)', color: '#A855F7' },
  cardioLoad: { icon: 'heart-outline' as const, bg: 'rgba(239, 68, 68, 0.18)', color: '#EF4444' },
  sleepImpact: { icon: 'moon-outline' as const, bg: 'rgba(59, 130, 246, 0.18)', color: '#3B82F6' },
  alcoholExposure: { icon: 'wine-outline' as const, bg: 'rgba(249, 115, 22, 0.18)', color: '#F97316' },
};
