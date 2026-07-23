import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useNotifications } from '@/hooks/useApi';
import { formatRelativeTime } from '@/lib/format';
import { getNotificationStyle, routeForNotificationType } from '@/lib/notifications';
import { api } from '@/lib/api';

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications, loading, error, refetch } = useNotifications();
  const [busy, setBusy] = useState(false);

  // Leaving the inbox clears the home bell (marks everything read).
  useFocusEffect(
    useCallback(() => {
      void refetch();

      return () => {
        void api.markAllNotificationsRead().catch(() => undefined);
      };
    }, [refetch])
  );

  const handlePress = async (id: string, type: string) => {
    try {
      await api.markNotificationRead(id);
      await refetch();
    } catch {
      // non-blocking
    }
    const route = routeForNotificationType(type);
    if (route) router.push(route as never);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear all notifications?',
      'This removes every item from your inbox. You can’t undo this.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await api.clearAllNotifications();
                await refetch();
              } catch (e) {
                Alert.alert(
                  'Could not clear',
                  e instanceof Error ? e.message : 'Something went wrong'
                );
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ]
    );
  };

  const handleDeleteOne = (id: string) => {
    Alert.alert('Remove notification?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await api.deleteNotification(id);
              await refetch();
            } catch {
              // non-blocking
            }
          })();
        },
      },
    ]);
  };

  const hasItems = (notifications?.length ?? 0) > 0;

  return (
    <Screen>
      <ScreenHeader
        title="Notifications"
        showBack
        onBack={() => router.back()}
        rightAction={
          hasItems ? (
            <Pressable
              onPress={handleClearAll}
              hitSlop={8}
              disabled={busy}
              accessibilityLabel="Clear all notifications"
            >
              <Text style={styles.clearAll}>{busy ? 'Clearing…' : 'Clear all'}</Text>
            </Pressable>
          ) : undefined
        }
      />

      {loading && !notifications && <ActivityIndicator color={colors.primary} />}
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
            onPress={() => void handlePress(n.id, n.type)}
            onLongPress={() => handleDeleteOne(n.id)}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${style.color}22` }]}>
              <Ionicons name={style.icon} size={22} color={style.color} />
              {!n.read ? <View style={styles.unreadDot} /> : null}
            </View>
            <View style={styles.content}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{n.title}</Text>
                <Text style={styles.time}>{formatRelativeTime(n.createdAt)}</Text>
              </View>
              <Text style={styles.cardBody}>{n.body}</Text>
            </View>
            <Pressable
              onPress={() => handleDeleteOne(n.id)}
              hitSlop={10}
              accessibilityLabel="Remove notification"
              style={styles.deleteBtn}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </Pressable>
        );
      })}

      {notifications?.length === 0 && !loading && (
        <Text style={styles.emptyText}>No notifications yet.</Text>
      )}

      {hasItems ? (
        <Text style={styles.hint}>Tip: long-press or tap × to remove one item.</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  clearAll: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
  },
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
    alignItems: 'flex-start',
  },
  unread: {
    borderColor: colors.danger,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  content: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: 4,
  },
  cardTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  cardBody: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  deleteBtn: {
    padding: 2,
    marginTop: 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
