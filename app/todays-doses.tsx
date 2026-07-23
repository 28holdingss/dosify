import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useDailySnapshot, useDoses } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { cabinetItemLabel, formatTime, localDayBounds } from '@/lib/format';
import { syncLocalDoseReminders } from '@/lib/reminders';
import { refreshWatchCompanion, syncDosesToWatch } from '@/lib/watch-companion';
import { getSubstanceIcon } from '@/lib/substance-icons';
import type { DoseEvent, DoseStatus } from '@/types/api';

const FILTERS = ['All', 'Due', 'Done', 'Skipped'] as const;

function statusLabel(status: DoseStatus) {
  switch (status) {
    case 'DUE':
      return 'Due';
    case 'TAKEN':
      return 'Taken';
    case 'SKIPPED':
      return 'Skipped';
    case 'SNOOZED':
      return 'Snoozed';
    case 'MISSED':
      return 'Missed';
    default:
      return status;
  }
}

function statusColor(status: DoseStatus) {
  switch (status) {
    case 'DUE':
      return colors.primary;
    case 'TAKEN':
      return colors.success;
    case 'SKIPPED':
      return colors.textMuted;
    case 'SNOOZED':
      return colors.warning;
    case 'MISSED':
      return colors.danger;
    default:
      return colors.textSecondary;
  }
}

export default function TodaysDosesScreen() {
  const router = useRouter();
  const bounds = useMemo(() => localDayBounds(), []);
  const { data: doses, loading, error, refetch } = useDoses(bounds.from, bounds.to);
  const { data: snapshot, refetch: refetchSnapshot } = useDailySnapshot();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [busyId, setBusyId] = useState<string | null>(null);
  const warnedPermissionRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchSnapshot();
      void refreshWatchCompanion();
    }, [refetch, refetchSnapshot])
  );

  useEffect(() => {
    if (!doses) return;
    void (async () => {
      const result = await syncLocalDoseReminders(doses);
      if (!result.permissionGranted && !warnedPermissionRef.current) {
        warnedPermissionRef.current = true;
        Alert.alert(
          'Notifications off',
          'Enable notifications for Dosify in iPhone Settings → Dosify → Notifications so dose reminders can appear.'
        );
      }
    })();
    void syncDosesToWatch(doses);
  }, [doses]);

  const filtered = useMemo(() => {
    const list = [...(doses ?? [])].sort(
      (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );
    if (filter === 'Due') {
      return list.filter((d) => d.status === 'DUE' || d.status === 'SNOOZED');
    }
    if (filter === 'Done') return list.filter((d) => d.status === 'TAKEN');
    if (filter === 'Skipped') {
      return list.filter((d) => d.status === 'SKIPPED' || d.status === 'MISSED');
    }
    return list;
  }, [doses, filter]);

  const counts = snapshot?.doses.counts ?? {
    due: doses?.filter((d) => d.status === 'DUE').length ?? 0,
    taken: doses?.filter((d) => d.status === 'TAKEN').length ?? 0,
    skipped: doses?.filter((d) => d.status === 'SKIPPED').length ?? 0,
    snoozed: doses?.filter((d) => d.status === 'SNOOZED').length ?? 0,
    missed: doses?.filter((d) => d.status === 'MISSED').length ?? 0,
    total: doses?.length ?? 0,
  };

  const runAction = async (
    dose: DoseEvent,
    action: 'taken' | 'skipped' | 'snoozed'
  ) => {
    setBusyId(dose.id);
    try {
      if (action === 'taken') await api.markDoseTaken(dose.id);
      else if (action === 'skipped') await api.markDoseSkipped(dose.id);
      else await api.markDoseSnoozed(dose.id, { snoozeMinutes: 15 });
      await Promise.all([refetch(), refetchSnapshot()]);
      await refreshWatchCompanion();
    } catch (e) {
      Alert.alert('Action failed', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Screen>
      <ScreenHeader
        title="Today's doses"
        showBack
        onBack={() => router.back()}
        rightAction={
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push('/health-cabinet' as never)}
            accessibilityLabel="Open Health Cabinet"
          >
            <Ionicons name="medkit-outline" size={22} color={colors.primary} />
          </Pressable>
        }
      />

      <View style={styles.statsRow}>
        {[
          { label: 'Due', value: counts.due + counts.snoozed },
          { label: 'Taken', value: counts.taken },
          { label: 'Missed', value: counts.missed + counts.skipped },
        ].map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <FilterChips
        options={[...FILTERS]}
        selected={filter}
        onSelect={(v) => setFilter(v as (typeof FILTERS)[number])}
      />

      {error && (
        <Text style={styles.errorText}>
          Could not load doses. Confirm `/api/doses` is available.
        </Text>
      )}

      {loading && !doses && (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
      )}

      {!loading && filtered.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="checkmark-circle-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No doses for this filter</Text>
          <Text style={styles.emptyBody}>
            Add items in your Health Cabinet and create a schedule to see today&apos;s doses here.
          </Text>
          <GradientButton title="Open Health Cabinet" onPress={() => router.push('/health-cabinet' as never)} />
        </View>
      )}

      {filtered.map((dose) => {
        const item = dose.cabinetItem;
        const name = item ? cabinetItemLabel(item) : 'Dose';
        const icon = getSubstanceIcon(
          item?.substance?.name ?? name,
          item?.substance?.category?.slug
        );
        const canAct = dose.status === 'DUE' || dose.status === 'SNOOZED';
        const busy = busyId === dose.id;

        return (
          <View key={dose.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.icon, { backgroundColor: `${icon.color}22` }]}>
                <Ionicons name={icon.icon} size={22} color={icon.color} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.meta}>
                  {formatTime(dose.scheduledFor)}
                  {item?.doseValue != null
                    ? ` · ${item.doseValue}${item.doseUnit ? ` ${item.doseUnit}` : ''}`
                    : ''}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${statusColor(dose.status)}22` }]}>
                <Text style={[styles.badgeText, { color: statusColor(dose.status) }]}>
                  {statusLabel(dose.status)}
                </Text>
              </View>
            </View>

            {canAct && (
              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionBtn, styles.takenBtn]}
                  disabled={busy}
                  onPress={() => runAction(dose, 'taken')}
                >
                  <Text style={styles.actionText}>{busy ? '…' : 'Taken'}</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.skipBtn]}
                  disabled={busy}
                  onPress={() => runAction(dose, 'skipped')}
                >
                  <Text style={styles.actionText}>Skip</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.snoozeBtn]}
                  disabled={busy}
                  onPress={() => runAction(dose, 'snoozed')}
                >
                  <Text style={styles.actionText}>Snooze</Text>
                </Pressable>
              </View>
            )}

            {dose.status === 'SNOOZED' && dose.snoozedUntil && (
              <Text style={styles.snoozeHint}>Snoozed until {formatTime(dose.snoozedUntil)}</Text>
            )}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconBtn: { padding: spacing.xs },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
  },
  statLabel: {
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
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
    fontWeight: '600',
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeText: {
    ...typography.small,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  takenBtn: { backgroundColor: 'rgba(34,197,94,0.2)' },
  skipBtn: { backgroundColor: 'rgba(148,163,184,0.2)' },
  snoozeBtn: { backgroundColor: 'rgba(245,158,11,0.2)' },
  actionText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  snoozeHint: {
    ...typography.small,
    color: colors.warning,
    marginTop: spacing.sm,
  },
});
