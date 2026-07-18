import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '@/components/ui/GradientButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SwipeToDeleteRow } from '@/components/ui/SwipeToDeleteRow';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useIntakes } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { formatTime } from '@/lib/format';
import { getSubstanceIcon } from '@/lib/substance-icons';

const quickLog = [
  { label: 'Medicine', slug: 'otc', icon: 'medical' as const, color: '#3B82F6' },
  { label: 'Vitamin', slug: 'vitamins', icon: 'nutrition' as const, color: '#FACC15' },
  { label: 'Stimulant', slug: 'stimulants', icon: 'flash' as const, color: '#FBBF24' },
  { label: 'Psychedelic', slug: 'psychedelics', icon: 'color-palette' as const, color: '#F472B6' },
  { label: 'Other', slug: 'other', icon: 'ellipse' as const, color: colors.textMuted },
];

export default function LogScreen() {
  const router = useRouter();
  const { data: intakes, loading, error, refetch } = useIntakes(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const confirmDelete = useCallback(
    (id: string, name: string) => {
      Alert.alert('Delete intake?', `Remove ${name} from your log history?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(id);
            try {
              await api.deleteIntake(id);
              await refetch();
            } catch {
              Alert.alert('Could not delete', 'Please try again.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]);
    },
    [refetch]
  );

  return (
    <Screen>
      <ScreenHeader title="Log Intake" />

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          placeholder="Search substances, medicines, vitamins..."
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          onFocus={() => router.push('/log-search')}
        />
      </View>

      {error && (
        <Text style={styles.errorText}>Could not load recent intakes. Is the API running?</Text>
      )}

      <Text style={styles.sectionTitle}>Quick Log</Text>
      <View style={styles.quickRow}>
        {quickLog.map((item) => (
          <Pressable
            key={item.label}
            style={styles.quickItem}
            onPress={() =>
              router.push({
                pathname: '/log-search',
                params: item.slug ? { category: item.slug } : {},
              })
            }
          >
            <View style={[styles.quickIcon, { backgroundColor: `${item.color}22` }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={styles.quickLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <GradientButton
        title="+ Log Custom Intake"
        onPress={() => router.push('/log-search')}
        style={{ marginBottom: spacing.xl }}
      />

      <Text style={styles.sectionTitle}>Recent</Text>
      <Text style={styles.swipeHint}>Swipe left to delete</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
      ) : intakes && intakes.length > 0 ? (
        intakes.map((item) => {
          const icon = getSubstanceIcon(item.substance.name, item.substance.category?.slug);
          const isDeleting = deletingId === item.id;
          return (
            <SwipeToDeleteRow
              key={item.id}
              onDelete={() => confirmDelete(item.id, item.substance.name)}
            >
              <Pressable
                style={[styles.recentRow, isDeleting && styles.recentRowDeleting]}
                disabled={isDeleting}
                onPress={() =>
                  router.push({
                    pathname: '/log-intake',
                    params: { substanceId: item.substance.id },
                  })
                }
              >
                <View style={styles.recentIcon}>
                  <Ionicons name={icon.icon} size={20} color={icon.color} />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName}>{item.substance.name}</Text>
                  <Text style={styles.recentDose}>
                    {item.dose} {item.unit}
                  </Text>
                </View>
                {isDeleting ? (
                  <ActivityIndicator color={colors.textMuted} size="small" />
                ) : (
                  <Text style={styles.recentTime}>{formatTime(item.takenAt)}</Text>
                )}
              </Pressable>
            </SwipeToDeleteRow>
          );
        })
      ) : (
        <Text style={styles.emptyText}>No intakes logged yet.</Text>
      )}

      <Pressable onPress={() => router.push('/check-interactions')}>
        <Text style={styles.checkLink}>Check Interactions →</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  errorText: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  quickItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  recentRowDeleting: {
    opacity: 0.5,
  },
  swipeHint: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInfo: { flex: 1 },
  recentName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  recentDose: {
    ...typography.caption,
    color: colors.textMuted,
  },
  recentTime: {
    ...typography.caption,
    color: colors.textMuted,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  checkLink: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: spacing.md,
  },
});
