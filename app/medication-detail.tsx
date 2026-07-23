import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
import { GradientButton } from '@/components/ui/GradientButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useCabinetItem, useDoses, useSchedules } from '@/hooks/useApi';
import { api } from '@/lib/api';
import {
  adherenceStats,
  formatNextDoseLine,
  isLowQuantity,
  nextDoseByCabinetItem,
  periodIconForHour,
  weekBounds,
} from '@/lib/cabinet-helpers';
import {
  cabinetItemLabel,
  formatDateOnly,
  formatRecurrenceLabel,
} from '@/lib/format';
import { getSubstanceIcon } from '@/lib/substance-icons';

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function MedicationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: item, loading, error, refetch } = useCabinetItem(id);
  const { data: schedules, refetch: refetchSchedules } = useSchedules(
    id ? { cabinetItemId: id } : undefined,
    Boolean(id)
  );
  const week = useMemo(() => weekBounds(), []);
  const { data: weekDoses, refetch: refetchDoses } = useDoses(week.from, week.to, Boolean(id));
  const upcomingWindow = useMemo(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 7);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);
  const { data: upcomingDoses, refetch: refetchUpcoming } = useDoses(
    upcomingWindow.from,
    upcomingWindow.to,
    Boolean(id)
  );
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchSchedules();
      refetchDoses();
      refetchUpcoming();
    }, [refetch, refetchSchedules, refetchDoses, refetchUpcoming])
  );

  const name = item ? cabinetItemLabel(item) : 'Medication';
  const icon = getSubstanceIcon(item?.substance?.name ?? name, item?.substance?.category?.slug);
  const scheduleList = schedules ?? item?.schedules ?? [];
  const itemDoses = useMemo(
    () => (weekDoses ?? []).filter((d) => d.cabinetItemId === id),
    [weekDoses, id]
  );
  const stats = useMemo(() => adherenceStats(itemDoses), [itemDoses]);
  const nextMap = useMemo(
    () => nextDoseByCabinetItem(upcomingDoses ?? []),
    [upcomingDoses]
  );
  const nextDose = id ? nextMap.get(id) : undefined;
  const lowQty = item ? isLowQuantity(item) : false;

  const doseLabel =
    item?.doseValue != null
      ? `${item.doseValue}${item.doseUnit ? ` ${item.doseUnit}` : ''}`
      : null;

  const updateQuantity = () => {
    if (!item || !id) return;
    const openEditor = () =>
      router.push({ pathname: '/cabinet-edit' as never, params: { id } });

    if (typeof Alert.prompt === 'function') {
      Alert.prompt(
        'Update quantity',
        'How many doses/units do you have left?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: async (value?: string) => {
              const n = Number(value);
              if (!Number.isFinite(n) || n < 0) {
                Alert.alert('Invalid quantity', 'Enter a number 0 or greater.');
                return;
              }
              setBusy(true);
              try {
                await api.updateCabinetItem(id, { quantity: n });
                await refetch();
              } catch (e) {
                Alert.alert(
                  'Could not update',
                  e instanceof Error ? e.message : 'Something went wrong'
                );
              } finally {
                setBusy(false);
              }
            },
          },
        ],
        'plain-text',
        item.quantity != null ? String(item.quantity) : ''
      );
      return;
    }

    Alert.alert('Update quantity', 'Open Edit medication to change quantity on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit', onPress: openEditor },
    ]);
  };

  if (loading && !item) {
    return (
      <Screen scroll={false} style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </Screen>
    );
  }

  if (error || !item || !id) {
    return (
      <Screen>
        <ScreenHeader title="Medication" showBack onBack={() => router.back()} />
        <Text style={styles.errorText}>Could not load this medication.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title={name}
        showBack
        onBack={() => router.back()}
        rightAction={
          <Pressable
            onPress={() =>
              router.push({ pathname: '/cabinet-edit' as never, params: { id } })
            }
            hitSlop={8}
          >
            <Text style={styles.editLink}>Edit</Text>
          </Pressable>
        }
      />

      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: `${icon.color}22` }]}>
          <Ionicons name={icon.icon} size={28} color={icon.color} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroName}>{name}</Text>
          <Text style={styles.heroMeta}>
            {[
              doseLabel,
              item.substance?.category?.name,
              item.active ? null : 'Completed',
            ]
              .filter(Boolean)
              .join(' · ') || 'No dose set'}
          </Text>
          {nextDose ? (
            <View style={styles.nextRow}>
              <Ionicons
                name={periodIconForHour(
                  new Date(nextDose.snoozedUntil ?? nextDose.scheduledFor).getHours()
                )}
                size={14}
                color={colors.primary}
              />
              <Text style={styles.nextText}>
                {formatNextDoseLine(nextDose.snoozedUntil ?? nextDose.scheduledFor)}
              </Text>
            </View>
          ) : (
            <Text style={styles.nextMuted}>
              {scheduleList.length > 0 ? 'No upcoming dose in the next 7 days' : 'As needed · no schedule'}
            </Text>
          )}
        </View>
      </View>

      {(lowQty || item.refillDate) && (
        <View style={[styles.refillCard, lowQty && styles.refillCardWarn]}>
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={lowQty ? colors.warning : colors.primary}
          />
          <View style={styles.refillCopy}>
            <Text style={styles.refillTitle}>
              {lowQty
                ? `${item.quantity ?? 0} doses remaining`
                : `Refill ${formatDateOnly(item.refillDate)}`}
            </Text>
            <Text style={styles.refillSub}>
              {lowQty
                ? 'Update quantity when you refill so reminders stay accurate.'
                : 'Keep your refill date current to avoid running out.'}
            </Text>
          </View>
          <Pressable onPress={updateQuantity} disabled={busy}>
            <Text style={styles.refillAction}>Update</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Adherence this week</Text>
        <View style={styles.pctRow}>
          <Text style={styles.pctValue}>{stats.pct}%</Text>
          <Text style={styles.pctMeta}>
            {stats.taken} of {stats.expected || '—'} logged doses taken
          </Text>
        </View>
        <ProgressBar label="Taken" value={stats.pct} color={colors.primary} showValue={false} />
        <View style={styles.weekRow}>
          {WEEK_LABELS.map((label, index) => (
            <View key={`${label}-${index}`} style={styles.weekDay}>
              <View
                style={[
                  styles.weekDot,
                  stats.byDay[index] && styles.weekDotOn,
                ]}
              />
              <Text style={styles.weekLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {item.instructions ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Instructions</Text>
          <Text style={styles.cardBody}>{item.instructions}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Schedule</Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/schedule-edit' as never,
                params: { cabinetItemId: id },
              })
            }
          >
            <Text style={styles.link}>Add</Text>
          </Pressable>
        </View>
        {scheduleList.length === 0 ? (
          <Text style={styles.cardBody}>No schedule yet. Add times to track doses.</Text>
        ) : (
          scheduleList.map((schedule) => {
            const times = Array.isArray(schedule.times)
              ? (schedule.times as string[])
              : [];
            return (
              <Pressable
                key={schedule.id}
                style={styles.scheduleRow}
                onPress={() =>
                  router.push({
                    pathname: '/schedule-edit' as never,
                    params: { id: schedule.id, cabinetItemId: id },
                  })
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleTitle}>
                    {formatRecurrenceLabel(schedule.recurrence, {
                      intervalHours: schedule.intervalHours,
                      daysOfWeek: schedule.daysOfWeek,
                      times,
                    })}
                  </Text>
                  <Text style={styles.scheduleMeta}>
                    {times.length
                      ? times
                          .map((t) => {
                            const [h, m] = t.split(':').map(Number);
                            const d = new Date();
                            d.setHours(h || 0, m || 0, 0, 0);
                            return d.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            });
                          })
                          .join(' · ')
                      : 'No times set'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            );
          })
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Details</Text>
        <DetailRow label="Quantity" value={item.quantity != null ? String(item.quantity) : '—'} />
        <DetailRow label="Expiration" value={formatDateOnly(item.expirationDate)} />
        <DetailRow label="Refill" value={formatDateOnly(item.refillDate)} />
        <DetailRow label="Prescriber" value={item.prescriber ?? '—'} />
      </View>

      <GradientButton
        title="Today’s doses"
        onPress={() => router.push('/todays-doses' as never)}
        style={{ marginTop: spacing.sm }}
      />
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  editLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  errorText: {
    ...typography.body,
    color: colors.warning,
  },
  hero: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1, gap: 4 },
  heroName: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  heroMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  nextText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  nextMuted: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  refillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  refillCardWarn: {
    borderColor: `${colors.warning}66`,
    backgroundColor: `${colors.warning}14`,
  },
  refillCopy: { flex: 1, gap: 2 },
  refillTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  refillSub: {
    ...typography.caption,
    color: colors.textMuted,
  },
  refillAction: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  cardBody: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  pctRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pctValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  pctMeta: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  weekDay: { alignItems: 'center', gap: 6, flex: 1 },
  weekDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  weekDotOn: {
    backgroundColor: colors.primary,
  },
  weekLabel: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
  link: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  scheduleTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  scheduleMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  detailValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
});
