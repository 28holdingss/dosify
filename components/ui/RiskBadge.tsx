import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';

type RiskBadgeProps = {
  level: 'Low' | 'Moderate' | 'High';
  score?: number;
};

const levelColors = {
  Low: colors.success,
  Moderate: colors.warning,
  High: colors.danger,
};

export function RiskBadge({ level, score }: RiskBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: `${levelColors[level]}22` }]}>
      <View style={[styles.dot, { backgroundColor: levelColors[level] }]} />
      <Text style={[styles.text, { color: levelColors[level] }]}>
        {level}
        {score !== undefined ? ` · ${score}/100` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  text: {
    ...typography.small,
    fontWeight: '600',
  },
});
