import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '@/constants/theme';

type ProgressBarProps = {
  label: string;
  value: number;
  color?: string;
  showValue?: boolean;
};

export function ProgressBar({
  label,
  value,
  color = colors.primary,
  showValue = true,
}: ProgressBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {showValue && <Text style={[styles.value, { color }]}>{value}%</Text>}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  value: {
    ...typography.caption,
    fontWeight: '600',
  },
  track: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
