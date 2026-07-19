import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterChips } from '@/components/ui/FilterChips';
import { GradientButton } from '@/components/ui/GradientButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useCabinet } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { cabinetItemLabel, formatDateOnly } from '@/lib/format';
import { getSubstanceIcon } from '@/lib/substance-icons';

const FILTERS = ['Active', 'All', 'Inactive'] as const;

export default function HealthCabinetScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Active');
  const activeParam =
    filter === 'Active' ? true : filter === 'Inactive' ? false : undefined;
  const { data, loading, error, refetch } = useCabinet(
    activeParam === undefined ? undefined : { active: activeParam }
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const items = useMemo(() => data ?? [], [data]);

  const confirmDelete = (id: string, name: string) => {
    Alert.alert('Remove from cabinet?', `Remove ${name} from your Health Cabinet?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusyId(id);
          try {
            await api.deleteCabinetItem(id);
            await refetch();
          } catch (e) {
            Alert.alert('Could not remove', e instanceof Error ? e.message : 'Something went wrong');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScreenHeader
        title="Health Cabinet"
        showBack
        onBack={() => router.back()}
        rightAction={
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push('/cabinet-edit' as never)}
            accessibilityLabel="Add cabinet item"
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </Pressable>
        }
      />

      <Text style={styles.subtitle}>
        Medicines and supplements you keep on hand — doses, refills, and schedules.
      </Text>

      <Pressable
        style={styles.checkCta}
        onPress={() => router.push('/check-before-taking' as never)}
      >
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
        <View style={styles.checkCopy}>
          <Text style={styles.checkTitle}>Check before taking</Text>
          <Text style={styles.checkSub}>Compare a substance with your cabinet and recent intakes</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Pressable
        style={styles.checkCta}
        onPress={() => router.push('/product-lookup' as never)}
      >
        <Ionicons name="barcode-outline" size={20} color={colors.primary} />
        <View style={styles.checkCopy}>
          <Text style={styles.checkTitle}>Look up by barcode</Text>
          <Text style={styles.checkSub}>Enter a code or search products to add to your cabinet</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <FilterChips
        options={[...FILTERS]}
        selected={filter}
        onSelect={(v) => setFilter(v as (typeof FILTERS)[number])}
      />

      {error && (
        <Text style={styles.errorText}>
          Could not load cabinet. Is the API running with Phase 1 routes?
        </Text>
      )}

      {loading && !data && (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
      )}

      {!loading && items.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="medkit-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Cabinet is empty</Text>
          <Text style={styles.emptyBody}>
            Add a medication or supplement from the substance catalog to start scheduling doses.
          </Text>
          <GradientButton title="Add item" onPress={() => router.push('/cabinet-edit' as never)} />
        </View>
      )}

      {items.map((item) => {
        const name = cabinetItemLabel(item);
        const icon = getSubstanceIcon(item.substance?.name ?? name, item.substance?.category?.slug);
        const dose =
          item.doseValue != null
            ? `${item.doseValue}${item.doseUnit ? ` ${item.doseUnit}` : ''}`
            : null;
        const meta = [
          dose,
          item.quantity != null ? `Qty ${item.quantity}` : null,
          item.refillDate ? `Refill ${formatDateOnly(item.refillDate)}` : null,
        ]
          .filter(Boolean)
          .join(' · ');

        return (
          <Pressable
            key={item.id}
            style={[styles.row, !item.active && styles.rowInactive]}
            onPress={() =>
              router.push({ pathname: '/cabinet-edit' as never, params: { id: item.id } })
            }
            onLongPress={() => confirmDelete(item.id, name)}
          >
            <View style={[styles.icon, { backgroundColor: `${icon.color}22` }]}>
              <Ionicons name={icon.icon} size={22} color={icon.color} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.meta}>{meta || item.substance?.category?.name || 'No dose set'}</Text>
              {!item.active && <Text style={styles.inactiveTag}>Inactive</Text>}
            </View>
            {busyId === item.id ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            )}
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    padding: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  checkCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  checkCopy: { flex: 1, minWidth: 0 },
  checkTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  checkSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  errorText: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowInactive: {
    opacity: 0.65,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  name: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  inactiveTag: {
    ...typography.small,
    color: colors.warning,
    marginTop: 4,
    fontWeight: '600',
  },
});
