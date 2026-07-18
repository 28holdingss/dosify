import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSpatialTheme, useSpatialThemeToggle } from '@/components/spatial/useSpatialTheme';
import { spacing, typography } from '@/constants/theme';

type SpatialHeaderProps = {
  greeting?: string;
  name?: string;
  showBell?: boolean;
  notificationCount?: number;
  showThemeToggle?: boolean;
  onBellPress?: () => void;
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
};

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getDateLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function SpatialHeader({
  greeting,
  name = 'Alex',
  showBell,
  notificationCount = 0,
  showThemeToggle = true,
  onBellPress,
  showBack,
  onBack,
  title,
}: SpatialHeaderProps) {
  const theme = useSpatialTheme();
  const { scheme, toggleScheme } = useSpatialThemeToggle();
  const displayGreeting = greeting ?? getTimeGreeting();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing.lg,
          paddingTop: spacing.xs,
        },
        left: {
          flex: 1,
        },
        backBtn: {
          marginBottom: spacing.sm,
          marginLeft: -spacing.xs,
        },
        greeting: {
          ...typography.caption,
          color: theme.textSecondary,
          marginBottom: 2,
        },
        name: {
          fontSize: 32,
          fontWeight: '700',
          color: theme.text,
          letterSpacing: 0.2,
        },
        date: {
          ...typography.small,
          color: theme.textMuted,
          marginTop: 4,
        },
        largeTitle: {
          fontSize: 32,
          fontWeight: '700',
          color: theme.text,
          letterSpacing: 0.2,
        },
        actions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.xs,
        },
        iconBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.pressed,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.separator,
        },
        bellWrap: {
          position: 'relative',
        },
        badge: {
          position: 'absolute',
          top: -6,
          right: -8,
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: theme.accent,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 4,
        },
        badgeText: {
          ...typography.small,
          color: '#FFFFFF',
          fontWeight: '700',
          fontSize: 10,
          lineHeight: 12,
        },
      }),
    [theme],
  );

  const themeIcon = scheme === 'dark' ? 'moon' : 'moon-outline';

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={theme.accent} />
          </Pressable>
        )}
        {title ? (
          <Text style={styles.largeTitle}>{title}</Text>
        ) : (
          <View>
            <Text style={styles.greeting}>{displayGreeting}</Text>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.date}>{getDateLabel()}</Text>
          </View>
        )}
      </View>
      {(showThemeToggle || showBell) && (
        <View style={styles.actions}>
          {showThemeToggle && (
            <Pressable
              style={styles.iconBtn}
              onPress={toggleScheme}
              hitSlop={8}
              accessibilityLabel={scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <Ionicons name={themeIcon} size={22} color={theme.accent} />
            </Pressable>
          )}
          {showBell && (
            <Pressable style={styles.iconBtn} onPress={onBellPress} hitSlop={8}>
              <View style={styles.bellWrap}>
                <Ionicons name="notifications-outline" size={22} color={theme.accent} />
                {notificationCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
