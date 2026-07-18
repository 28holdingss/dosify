import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useNotifications } from '@/hooks/useApi';
import { formatRelativeTime } from '@/lib/format';
import { getNotificationStyle } from '@/lib/notifications';
import { api } from '@/lib/api';

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications, loading, error, refetch } = useNotifications();

  const handlePress = async (id: string, type: string) => {
    try {
      await api.markNotificationRead(id);
      refetch();
    } catch {
      // non-blocking
    }
    if (type === 'INTERACTION_ALERT') {
      router.push('/interaction-alert');
    }
  };

  return (
    <Screen>
      <ScreenHeader
        title="Notifications"
        showBack
        onBack={() => router.back()}
      />

      {loading && <ActivityIndicator color={colors.primary} />}
      {error && (
        <Text style={styles.errorText}>Could not load notifications. Is the API running?</Text>
      )}

      {notifications?.map((n) => {
        const style = getNotificationStyle(n.type);
        return (
          <Pressable
            key={n.id}
            style={[
              styles.card,
              { backgroundColor: style.bg },
              !n.read && styles.unread,
            ]}
            onPress={() => handlePress(n.id, n.type)}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${style.color}22` }]}>
              <Ionicons name={style.icon} size={22} color={style.color} />
            </View>
            <View style={styles.content}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{n.title}</Text>
                <Text style={styles.time}>{formatRelativeTime(n.createdAt)}</Text>
              </View>
              <Text style={styles.cardBody}>{n.body}</Text>
            </View>
          </Pressable>
        );
      })}

      {notifications?.length === 0 && !loading && (
        <Text style={styles.emptyText}>No notifications yet.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorText: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unread: {
    borderColor: colors.primary,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  time: {
    ...typography.small,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  cardBody: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
