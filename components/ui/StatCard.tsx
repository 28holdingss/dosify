import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  level?: 'Low' | 'Moderate' | 'High' | 'Good';
  icon?: keyof typeof Ionicons.glyphMap;
};

const levelColors: Record<string, string> = {
  Low: colors.success,
  Moderate: colors.warning,
  High: colors.danger,
  Good: colors.success,
};

export function StatCard({ title, value, subtitle, level, icon }: StatCardProps) {
  return (
    <View style={styles.card}>
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={colors.textSecondary}
          style={styles.icon}
        />
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {level && (
        <Text style={[styles.level, { color: levelColors[level] }]}>{level}</Text>
      )}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    minWidth: '45%',
  },
  icon: {
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: 4,
  },
  value: {
    ...typography.h3,
    color: colors.text,
  },
  level: {
    ...typography.small,
    fontWeight: '600',
    marginTop: 2,
  },
  subtitle: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },
});
