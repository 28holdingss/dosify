import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { radius, spacing, typography } from '@/constants/theme';

export type TimelinePhase = 'onset' | 'peak' | 'comedown' | 'clearing';

const PHASES: { key: TimelinePhase; label: string }[] = [
  { key: 'onset', label: 'Onset' },
  { key: 'peak', label: 'Peak' },
  { key: 'comedown', label: 'Wear-off' },
  { key: 'clearing', label: 'Clear' },
];

export function resolveTimelinePhase(
  markerIndex: number,
  peakIndex: number,
  pointCount: number
): TimelinePhase {
  if (markerIndex >= pointCount - 1) return 'clearing';
  if (markerIndex > peakIndex + 1) return 'comedown';
  if (markerIndex >= Math.max(0, peakIndex - 1)) return 'peak';
  return 'onset';
}

type TimelinePhaseBarProps = {
  phase: TimelinePhase;
  markerIndex: number;
  peakIndex: number;
  pointCount: number;
  phaseLabels?: Record<TimelinePhase, string>;
  phaseDescription?: string;
};

export function TimelinePhaseBar({
  phase,
  markerIndex,
  peakIndex,
  pointCount,
  phaseLabels,
  phaseDescription,
}: TimelinePhaseBarProps) {
  const theme = useSpatialTheme();
  const progress = pointCount > 1 ? markerIndex / (pointCount - 1) : 0;
  const peakProgress = pointCount > 1 ? peakIndex / (pointCount - 1) : 0.5;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginBottom: spacing.md,
        },
        track: {
          height: 6,
          backgroundColor: theme.pressed,
          borderRadius: radius.full,
          overflow: 'hidden',
          position: 'relative',
        },
        fill: {
          height: '100%',
          backgroundColor: theme.accent,
          borderRadius: radius.full,
        },
        peakDot: {
          position: 'absolute',
          top: -3,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: theme.card,
          borderWidth: 2,
          borderColor: theme.accent,
          marginLeft: -6,
        },
        markerDot: {
          position: 'absolute',
          top: -5,
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: theme.accent,
          marginLeft: -8,
          shadowColor: theme.accent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 4,
        },
        labels: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: spacing.sm,
        },
        label: {
          ...typography.small,
          color: theme.textMuted,
        },
        labelActive: {
          color: theme.accent,
          fontWeight: '700',
        },
        caption: {
          ...typography.caption,
          color: theme.textSecondary,
          textAlign: 'center',
          marginTop: spacing.sm,
        },
      }),
    [theme],
  );

  const phaseLabel =
    phaseLabels?.[phase] ?? PHASES.find((p) => p.key === phase)?.label ?? 'Active';

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
        <View style={[styles.peakDot, { left: `${Math.round(peakProgress * 100)}%` }]} />
        <View style={[styles.markerDot, { left: `${Math.round(progress * 100)}%` }]} />
      </View>
      <View style={styles.labels}>
        {(phaseLabels
          ? (Object.entries(phaseLabels) as [TimelinePhase, string][]).map(([key, label]) => ({
              key,
              label,
            }))
          : PHASES
        ).map((p) => (
          <Text
            key={p.key}
            style={[styles.label, p.key === phase && styles.labelActive]}
          >
            {p.label}
          </Text>
        ))}
      </View>
      <Text style={styles.caption}>
        {phaseDescription ?? `Current phase · ${phaseLabel}`}
      </Text>
    </View>
  );
}
