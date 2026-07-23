import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import {
  TimelineIntakePickerModal,
  type TimelineIntakeOption,
} from '@/components/timeline/TimelineIntakeSwitcher';
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
  intakeOptions?: TimelineIntakeOption[];
  selectedIntakeId?: string;
  onSelectIntake?: (id: string) => void;
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
  intakeOptions = [],
  selectedIntakeId,
  onSelectIntake,
}: TimelineHeroCardProps) {
  const theme = useSpatialTheme();
  const icon = getSubstanceIcon(substanceName);
  const [pickerOpen, setPickerOpen] = useState(false);

  const canSwitch = intakeOptions.length > 1 && selectedIntakeId && onSelectIntake;

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
        nameRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'nowrap',
        },
        name: {
          ...typography.h3,
          color: theme.text,
          fontWeight: '700',
          flexShrink: 1,
        },
        namePressable: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          flexShrink: 1,
          maxWidth: '100%',
        },
        namePressed: {
          opacity: 0.75,
        },
        chevron: {
          marginTop: 2,
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

  const nameContent = (
    <>
      <Text style={styles.name} numberOfLines={1}>
        {substanceName}
      </Text>
      {canSwitch && (
        <Ionicons
          name="chevron-down"
          size={18}
          color={theme.textSecondary}
          style={styles.chevron}
        />
      )}
    </>
  );

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: `${icon.color}22` }]}>
          <Ionicons name={icon.icon} size={22} color={icon.color} />
        </View>
        <View style={styles.copy}>
          {canSwitch ? (
            <Pressable
              onPress={() => setPickerOpen(true)}
              style={({ pressed }) => [
                styles.namePressable,
                pressed && styles.namePressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Choose recent intake"
            >
              {nameContent}
            </Pressable>
          ) : (
            <View style={styles.nameRow}>{nameContent}</View>
          )}
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

      {canSwitch && (
        <TimelineIntakePickerModal
          visible={pickerOpen}
          options={intakeOptions}
          selectedId={selectedIntakeId}
          onSelect={onSelectIntake}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </View>
  );
}
