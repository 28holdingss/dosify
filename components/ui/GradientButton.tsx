import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';

type GradientButtonProps = {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  subtitle?: string;
  variant?: 'primary' | 'danger';
  disabled?: boolean;
};

export function GradientButton({
  title,
  onPress,
  style,
  subtitle,
  variant = 'primary',
  disabled = false,
}: GradientButtonProps) {
  const gradientColors =
    variant === 'danger'
      ? ([colors.danger, '#B91C1C'] as const)
      : ([colors.gradientStart, colors.gradientEnd] as const);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.wrapper, style, disabled && styles.disabled]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginVertical: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
});
