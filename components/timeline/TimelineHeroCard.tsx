import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { getSubstanceIcon } from '@/lib/substance-icons';
import { formatIntakeDateTime } from '@/lib/format';
import { radius, spacing, typography } from '@/constants/theme';

type TimelineHeroCardProps = {
  substanceName: string;
  categoryLabel?: string;
  drugClass?: string | null;
  takenAt: string;
  durationMinHours: number | null;
  durationMaxHours: number | null;
  peakWindowStart?: number;
  peakWindowEnd?: number;
  hoursFromStart: number;
  peakTimeLabel: string;
};

export function TimelineHeroCard({
  substanceName,
  categoryLabel,
  drugClass,
  takenAt,
  durationMinHours,
  durationMaxHours,
  peakWindowStart,
  peakWindowEnd,
  hoursFromStart,
  peakTimeLabel,
}: TimelineHeroCardProps) {
  const theme = useSpatialTheme();
  const icon = getSubstanceIcon(substanceName);

  const durationLabel =
    durationMinHours != null && durationMaxHours != null
      ? `${durationMinHours}–${durationMaxHours}h`
      : `${durationMaxHours ?? '—'}h`;

  const peakWindowLabel =
    peakWindowStart != null && peakWindowEnd != null
      ? `${peakWindowStart}–${peakWindowEnd}h`
      : peakTimeLabel;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: theme.card,
          borderRadius: radius.xl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.separator,
          padding: spacing.lg,
          marginBottom: spacing.md,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 3,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
        iconWrap: {
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
        },
        copy: {
          flex: 1,
          gap: 4,
        },
        name: {
          ...typography.h3,
          color: theme.text,
          fontWeight: '700',
        },
        meta: {
          ...typography.caption,
          color: theme.textSecondary,
        },
        badge: {
          alignSelf: 'flex-start',
          marginTop: 4,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: radius.full,
          backgroundColor: theme.pressed,
        },
        badgeText: {
          ...typography.small,
          color: theme.textMuted,
          fontWeight: '600',
        },
        stats: {
          flexDirection: 'row',
          marginTop: spacing.lg,
          gap: spacing.sm,
        },
        stat: {
          flex: 1,
          backgroundColor: theme.pressed,
          borderRadius: radius.md,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.sm,
          alignItems: 'center',
        },
        statValue: {
          fontSize: 16,
          fontWeight: '700',
          color: theme.text,
          fontVariant: ['tabular-nums'],
        },
        statLabel: {
          ...typography.small,
          color: theme.textMuted,
          marginTop: 2,
          textAlign: 'center',
        },
      }),
    [theme],
  );

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: `${icon.color}22` }]}>
          <Ionicons name={icon.icon} size={22} color={icon.color} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.name}>{substanceName}</Text>
          <Text style={styles.meta}>{formatIntakeDateTime(new Date(takenAt))}</Text>
          {(categoryLabel || drugClass) && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {[categoryLabel, drugClass].filter(Boolean).join(' · ')}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{hoursFromStart}h</Text>
          <Text style={styles.statLabel}>Elapsed</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{durationLabel}</Text>
          <Text style={styles.statLabel}>Active window</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { fontSize: 13 }]}>{peakWindowLabel}</Text>
          <Text style={styles.statLabel}>Peak window</Text>
        </View>
      </View>
    </View>
  );
}
