import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useCabinet, useDailySnapshot, useDoses } from '@/hooks/useApi';
import {
  type CabinetTab,
  filterCabinetItems,
  formatNextDoseLine,
  isLowQuantity,
  nextDoseByCabinetItem,
  periodIconForHour,
} from '@/lib/cabinet-helpers';
import { cabinetItemLabel, formatDateOnly } from '@/lib/format';
import { getSubstanceIcon } from '@/lib/substance-icons';

const TABS: CabinetTab[] = ['Active', 'As needed', 'Completed'];

export default function HealthCabinetScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<CabinetTab>('Active');
  const { data, loading, error, refetch } = useCabinet();
  const { data: snapshot, refetch: refetchSnapshot } = useDailySnapshot();

  const upcomingWindow = useMemo(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setDate(to.getDate() + 7);
    to.setHours(23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);
  const { data: doses, refetch: refetchDoses } = useDoses(
    upcomingWindow.from,
    upcomingWindow.to
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchSnapshot();
      refetchDoses();
    }, [refetch, refetchSnapshot, refetchDoses])
  );

  const items = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => filterCabinetItems(items, tab), [items, tab]);
  const nextMap = useMemo(() => nextDoseByCabinetItem(doses ?? []), [doses]);
  const refills = snapshot?.refillsDueSoon ?? [];

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    []
  );

  const openAdd = () => router.push('/add-medication' as never);
  const openDetail = (id: string) =>
    router.push({ pathname: '/medication-detail' as never, params: { id } });

  return (
    <Screen>
      <ScreenHeader
        title="My Medications"
        showBack
        onBack={() => router.back()}
        rightAction={
          <Pressable
            style={styles.iconBtn}
            onPress={openAdd}
            accessibilityLabel="Add medication"
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        }
      />

      <Text style={styles.dateLabel}>{todayLabel}</Text>
      <Text style={styles.subtitle}>
        Store medications, track intakes, and stay ahead of refills.
      </Text>

      {refills.length > 0 && (
        <Pressable
          style={styles.refillBanner}
          onPress={() => openDetail(refills[0]!.id)}
        >
          <Ionicons name="alert-circle" size={18} color={colors.warning} />
          <Text style={styles.refillBannerText}>
            {refills[0]!.overdue ? 'Refill overdue' : 'Refill soon'}:{' '}
            {refills[0]!.displayName}
            {refills.length > 1 ? ` +${refills.length - 1} more` : ''}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      )}

      <FilterChips
        options={[...TABS]}
        selected={tab}
        onSelect={(v) => setTab(v as CabinetTab)}
      />

      {error && (
        <Text style={styles.errorText}>
          Could not load medications. Is the API running?
        </Text>
      )}

      {loading && !data && (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
      )}

      {!loading && filtered.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="medkit-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>
            {tab === 'Active'
              ? 'No scheduled medications'
              : tab === 'As needed'
                ? 'No as-needed medications'
                : 'No completed medications'}
          </Text>
          <Text style={styles.emptyBody}>
            {tab === 'Completed'
              ? 'Inactive medications will appear here.'
              : 'Add a medication to start tracking doses and intakes.'}
          </Text>
          {tab !== 'Completed' && (
            <GradientButton title="Add medication" onPress={openAdd} />
          )}
        </View>
      )}

      {filtered.map((item) => {
        const name = cabinetItemLabel(item);
        const icon = getSubstanceIcon(
          item.substance?.name ?? name,
          item.substance?.category?.slug
        );
        const dose =
          item.doseValue != null
            ? `${item.doseValue}${item.doseUnit ? ` ${item.doseUnit}` : ''}`
            : null;
        const next = nextMap.get(item.id);
        const nextAt = next ? next.snoozedUntil ?? next.scheduledFor : null;
        const low = isLowQuantity(item);
        const periodIcon = nextAt
          ? periodIconForHour(new Date(nextAt).getHours())
          : 'medkit-outline';

        return (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => openDetail(item.id)}
          >
            <View style={styles.cardTop}>
              <View style={[styles.icon, { backgroundColor: `${icon.color}22` }]}>
                <Ionicons name={icon.icon} size={22} color={icon.color} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.meta}>
                  {[dose, item.substance?.category?.name].filter(Boolean).join(' · ') ||
                    'No dose set'}
                </Text>
              </View>
              <Ionicons name={periodIcon} size={18} color={colors.textMuted} />
            </View>

            {nextAt ? (
              <Text style={styles.nextLine}>{formatNextDoseLine(nextAt)}</Text>
            ) : tab === 'As needed' ? (
              <Text style={styles.nextMuted}>As needed · no fixed schedule</Text>
            ) : tab === 'Completed' ? (
              <Text style={styles.nextMuted}>Inactive</Text>
            ) : (
              <Text style={styles.nextMuted}>No upcoming dose scheduled</Text>
            )}

            <View style={styles.footer}>
              {item.quantity != null && (
                <Text style={[styles.footerTag, low && styles.footerWarn]}>
                  Qty {item.quantity}
                  {low ? ' · Low' : ''}
                </Text>
              )}
              {item.refillDate && (
                <Text style={styles.footerTag}>
                  Refill {formatDateOnly(item.refillDate)}
                </Text>
              )}
            </View>
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
  dateLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  refillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.warning}18`,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.warning}44`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  refillBannerText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
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
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
    fontWeight: '700',
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  nextLine: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  nextMuted: {
    ...typography.caption,
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footerTag: {
    ...typography.small,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceLight,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    fontWeight: '600',
  },
  footerWarn: {
    color: colors.warning,
  },
});
