import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'alert' | 'bordered';
};

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'alert' && styles.alert,
        variant === 'bordered' && styles.bordered,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  alert: {
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.border,
  },
});
