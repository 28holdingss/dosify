import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';

type ScreenHeaderProps = {
  title?: string;
  greeting?: string;
  showBack?: boolean;
  showBell?: boolean;
  showSettings?: boolean;
  onBack?: () => void;
  onBellPress?: () => void;
  rightAction?: React.ReactNode;
};

export function ScreenHeader({
  title,
  greeting,
  showBack,
  showBell,
  showSettings,
  onBack,
  onBellPress,
  rightAction,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <Pressable onPress={onBack} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
        )}
        {greeting ? (
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
          </View>
        ) : (
          title && <Text style={styles.title}>{title}</Text>
        )}
      </View>
      <View style={styles.right}>
        {rightAction}
        {showBell && (
          <Pressable style={styles.iconBtn} onPress={onBellPress}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </Pressable>
        )}
        {showSettings && (
          <Pressable style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  greeting: {
    ...typography.h2,
    color: colors.text,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  iconBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
});
