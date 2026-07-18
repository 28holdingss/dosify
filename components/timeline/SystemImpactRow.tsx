import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { getRiskColor, getRiskLabel, radius, spacing, typography } from '@/constants/theme';

type SystemImpactRowProps = {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  insight: string;
  isLast?: boolean;
};

export function SystemImpactRow({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  insight,
  isLast = false,
}: SystemImpactRowProps) {
  const theme = useSpatialTheme();
  const level = getRiskLabel(value);
  const color = getRiskColor(value);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: theme.separator,
        },
        iconWrap: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
        },
        copy: {
          flex: 1,
          gap: 4,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        label: {
          ...typography.body,
          color: theme.text,
          fontWeight: '600',
        },
        score: {
          ...typography.body,
          fontWeight: '700',
          fontVariant: ['tabular-nums'],
        },
        level: {
          ...typography.small,
          fontWeight: '600',
        },
        insight: {
          ...typography.caption,
          color: theme.textSecondary,
          lineHeight: 18,
        },
        track: {
          height: 4,
          backgroundColor: theme.pressed,
          borderRadius: radius.full,
          overflow: 'hidden',
          marginTop: 4,
        },
        fill: {
          height: '100%',
          borderRadius: radius.full,
        },
      }),
    [theme, isLast],
  );

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.copy}>
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.score, { color }]}>{value}</Text>
        </View>
        <Text style={[styles.level, { color }]}>{level} impact</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${value}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.insight}>{insight}</Text>
      </View>
    </View>
  );
}

export function insightForSystem(
  system: 'cognitive' | 'cardiovascular' | 'gastrointestinal' | 'liver',
  value: number
): string {
  if (system === 'cognitive') {
    if (value >= 60) return 'High cognitive load — avoid driving or complex tasks.';
    if (value >= 40) return 'Noticeable mental effects — take it easy.';
    return 'Cognitive impact is manageable.';
  }
  if (system === 'cardiovascular') {
    if (value >= 60) return 'Elevated cardiovascular strain — rest and hydrate.';
    if (value >= 40) return 'Some cardiac load — avoid intense exercise.';
    return 'Cardiovascular load is within normal range.';
  }
  if (system === 'liver') {
    if (value >= 60) return 'Elevated liver processing load — avoid alcohol and hepatotoxic drugs.';
    if (value >= 40) return 'Moderate liver workload — limit alcohol while active.';
    return 'Liver impact is minimal.';
  }
  if (value >= 40) return 'GI effects may be noticeable — eat lightly.';
  if (value >= 25) return 'Mild gastrointestinal sensitivity possible.';
  return 'Gastrointestinal effects are minimal.';
}
