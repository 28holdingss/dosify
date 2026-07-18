import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { getRiskColor, getRiskLabel, radius, spacing, typography } from '@/constants/theme';

type IndicatorCardProps = {
  title: string;
  description: string;
  score: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  /** Fixed width; when omitted the card flexes to fill its row. */
  width?: number;
  onPress?: () => void;
};

const CARD_HEIGHT = 172;

export function IndicatorCard({
  title,
  description,
  score,
  icon,
  iconBg,
  iconColor,
  width,
  onPress,
}: IndicatorCardProps) {
  const theme = useSpatialTheme();
  const level = getRiskLabel(score);
  const levelColor = getRiskColor(score);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          ...(width !== undefined
            ? { width, flexShrink: 0, flexGrow: 0 }
            : { flex: 1, minWidth: 0 }),
          height: CARD_HEIGHT,
          backgroundColor: theme.card,
          borderRadius: radius.xl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.separator,
          padding: spacing.md,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 10,
          elevation: 4,
        },
        iconWrap: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
        },
        title: {
          fontSize: 15,
          fontWeight: '700',
          color: theme.text,
          marginBottom: 3,
        },
        description: {
          ...typography.caption,
          color: theme.textSecondary,
          lineHeight: 16,
          minHeight: 32,
        },
        spacer: {
          flex: 1,
        },
        footer: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        },
        scoreRow: {
          flexDirection: 'row',
          alignItems: 'baseline',
        },
        score: {
          fontSize: 26,
          fontWeight: '700',
          color: theme.text,
          fontVariant: ['tabular-nums'],
          lineHeight: 30,
        },
        scoreMax: {
          fontSize: 13,
          color: theme.textMuted,
          marginLeft: 1,
        },
        level: {
          ...typography.small,
          fontWeight: '600',
          marginTop: 1,
        },
        viewBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: spacing.md,
          paddingVertical: 6,
          borderRadius: radius.full,
          backgroundColor: theme.pressed,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.separator,
        },
        viewText: {
          fontSize: 11,
          fontWeight: '600',
          color: theme.accent,
        },
        pressed: {
          opacity: 0.92,
          transform: [{ scale: 0.98 }],
        },
      }),
    [theme, width],
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>
      <View style={styles.spacer} />
      <View style={styles.footer}>
        <View>
          <View style={styles.scoreRow}>
            <Text style={styles.score}>{score}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <Text style={[styles.level, { color: levelColor }]}>{level}</Text>
        </View>
        <View style={styles.viewBtn}>
          <Ionicons name="play" size={9} color={theme.accent} />
          <Text style={styles.viewText}>View</Text>
        </View>
      </View>
    </Pressable>
  );
}
