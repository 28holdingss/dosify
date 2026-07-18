import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { getRiskColor, spacing, typography } from '@/constants/theme';

type SpatialListRowProps = {
  title: string;
  subtitle?: string;
  value?: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Overrides the accent tint of the icon chip. */
  iconColor?: string;
  showChevron?: boolean;
  isLast?: boolean;
  onPress?: () => void;
  valueColor?: string;
};

export function SpatialListRow({
  title,
  subtitle,
  value,
  icon,
  iconColor,
  showChevron = true,
  isLast = false,
  onPress,
  valueColor,
}: SpatialListRowProps) {
  const theme = useSpatialTheme();
  const tint = iconColor ?? theme.accent;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          gap: spacing.md,
          minHeight: 52,
        },
        pressed: {
          backgroundColor: theme.pressed,
        },
        border: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.separator,
        },
        iconWrap: {
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${tint}1A`,
        },
        textCol: {
          flex: 1,
        },
        title: {
          ...typography.body,
          color: theme.text,
        },
        subtitle: {
          ...typography.caption,
          color: theme.textSecondary,
          marginTop: 2,
        },
        value: {
          ...typography.body,
          fontWeight: '600',
          color: theme.textSecondary,
          fontVariant: ['tabular-nums'],
        },
      }),
    [theme, tint],
  );

  const content = (
    <>
      {icon && (
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={17} color={tint} />
        </View>
      )}
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {value !== undefined && (
        <Text style={[styles.value, valueColor ? { color: valueColor } : null]}>
          {value}
        </Text>
      )}
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          !isLast && styles.border,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.row, !isLast && styles.border]}>{content}</View>;
}

export function SpatialMetricRow({
  score,
  ...props
}: Omit<SpatialListRowProps, 'valueColor' | 'value'> & { score: number }) {
  return (
    <SpatialListRow {...props} value={score} valueColor={getRiskColor(score)} />
  );
}
