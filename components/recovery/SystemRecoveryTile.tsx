import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { getRecoveryColor, getRecoveryLabel, radius, spacing, typography } from '@/constants/theme';

type SystemRecoveryTileProps = {
  label: string;
  shortLabel: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
};

export function SystemRecoveryTile({
  label,
  shortLabel,
  value,
  icon,
  iconBg,
  iconColor,
}: SystemRecoveryTileProps) {
  const theme = useSpatialTheme();
  const color = getRecoveryColor(value);
  const level = getRecoveryLabel(value);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        tile: {
          flex: 1,
          minHeight: 132,
          flexDirection: 'column',
          backgroundColor: theme.card,
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.separator,
          padding: spacing.md,
          gap: spacing.sm,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        iconWrap: {
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
        },
        label: {
          ...typography.caption,
          color: theme.textSecondary,
          flex: 1,
        },
        valueRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        value: {
          fontSize: 24,
          fontWeight: '700',
          color: theme.text,
          fontVariant: ['tabular-nums'],
          lineHeight: 28,
        },
        level: {
          ...typography.small,
          fontWeight: '600',
          color,
          textAlign: 'right',
        },
        track: {
          height: 5,
          width: '100%',
          backgroundColor: theme.pressed,
          borderRadius: radius.full,
          overflow: 'hidden',
        },
        fill: {
          height: '100%',
          borderRadius: radius.full,
        },
        short: {
          ...typography.small,
          color: theme.textMuted,
          marginTop: 'auto',
        },
      }),
    [theme, color],
  );

  return (
    <View style={styles.tile} accessibilityLabel={`${label}: ${value}% recovered`}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        <Text style={styles.label} numberOfLines={1}>
          {shortLabel}
        </Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}%</Text>
        <Text style={styles.level}>{level}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.short}>{label}</Text>
    </View>
  );
}
