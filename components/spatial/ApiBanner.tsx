import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { radius, spacing, typography } from '@/constants/theme';

type ApiBannerProps = {
  message?: string;
};

export function ApiBanner({ message = 'API offline — showing cached data' }: ApiBannerProps) {
  const theme = useSpatialTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        banner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginHorizontal: spacing.lg,
          marginBottom: spacing.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          backgroundColor: theme.card,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.separator,
        },
        text: {
          ...typography.caption,
          color: theme.textSecondary,
          flex: 1,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color={theme.accent} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}
