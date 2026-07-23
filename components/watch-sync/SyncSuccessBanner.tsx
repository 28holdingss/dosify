import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '@/constants/theme';

type SyncSuccessBannerProps = {
  visible: boolean;
  recoveryUpdated?: boolean | null;
  onHide?: () => void;
};

export function SyncSuccessBanner({
  visible,
  recoveryUpdated,
  onHide,
}: SyncSuccessBannerProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => onHide?.(), 2800);
    return () => clearTimeout(t);
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(15).stiffness(180)}
      exiting={FadeOutUp.duration(220)}
      style={styles.banner}
    >
      <Ionicons name="checkmark-circle" size={20} color={colors.green} />
      <Text style={styles.text}>
        {recoveryUpdated ? 'Synced — Recovery updated' : 'Watch data synced'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: `${colors.green}18`,
    borderWidth: 1,
    borderColor: `${colors.green}44`,
    alignSelf: 'center',
  },
  text: {
    ...typography.caption,
    color: colors.green,
    fontWeight: '700',
  },
});
