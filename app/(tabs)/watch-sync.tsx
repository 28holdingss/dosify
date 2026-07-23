import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import { GradientButton } from '@/components/ui/GradientButton';
import { LineChart } from '@/components/ui/LineChart';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SyncSuccessBanner } from '@/components/watch-sync/SyncSuccessBanner';
import { WatchSyncStatusIcon } from '@/components/watch-sync/WatchSyncStatusIcon';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useWearableHistory, useWearableStatus } from '@/hooks/useApi';
import { useWatchSync } from '@/hooks/useWatchSync';
import { formatLastSync, openHealthSettings } from '@/lib/watch-sync';

function MetricTile({
  label,
  value,
  unit,
  icon,
  color,
  hint,
  index,
  celebrate,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  hint?: string;
  index: number;
  celebrate: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(celebrate ? index * 70 : index * 40)
        .springify()
        .damping(16)}
      style={styles.metricTile}
    >
      <View style={[styles.metricIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>
        {value}
        {unit && value !== '—' ? <Text style={styles.metricUnit}> {unit}</Text> : null}
      </Text>
      {value === '—' && hint ? <Text style={styles.metricHint}>{hint}</Text> : null}
    </Animated.View>
  );
}

export default function WatchSyncScreen() {
  const router = useRouter();
  const { data: status, loading, refetch } = useWearableStatus();
  const { data: history, refetch: refetchHistory } = useWearableHistory(7);
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const refetchHistoryRef = useRef(refetchHistory);
  refetchHistoryRef.current = refetchHistory;

  const [successKey, setSuccessKey] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [celebrateMetrics, setCelebrateMetrics] = useState(false);
  const wasSyncing = useRef(false);

  const {
    availability,
    autoSync,
    syncing,
    error,
    recoveryUpdated,
    localLastSync,
    syncNow,
    toggleAutoSync,
  } = useWatchSync(() => {
    void refetchRef.current();
    void refetchHistoryRef.current();
  });

  useFocusEffect(
    useCallback(() => {
      void refetchRef.current();
      void refetchHistoryRef.current();
    }, [])
  );

  useEffect(() => {
    if (wasSyncing.current && !syncing && !error) {
      setSuccessKey((k) => k + 1);
      setShowSuccess(true);
      setCelebrateMetrics(true);
      const t = setTimeout(() => setCelebrateMetrics(false), 1200);
      wasSyncing.current = false;
      return () => clearTimeout(t);
    }
    wasSyncing.current = syncing;
  }, [syncing, error]);

  const latest = status?.latest;
  const lastSync = status?.lastSyncAt ?? localLastSync;
  const connected = Boolean(latest);

  const sleepChart = useMemo(() => {
    const daily = history?.daily ?? [];
    if (daily.length < 2) return null;
    const labels = daily.map((d) =>
      new Date(d.recordedAt).toLocaleDateString('en-US', { weekday: 'narrow' })
    );
    const series = daily.map((d) => d.sleepHours ?? 0);
    return { labels, series: [series] };
  }, [history?.daily]);

  const handleSync = async () => {
    setShowSuccess(false);
    try {
      await syncNow();
      refetch();
      refetchHistory();
    } catch {
      // error state handled in hook
    }
  };

  const statusColor = connected
    ? colors.green
    : availability.supported
      ? colors.primary
      : colors.textMuted;

  return (
    <Screen>
      <ScreenHeader title="Apple Watch" showBack onBack={() => router.back()} />

      <Animated.View entering={FadeIn.duration(320)}>
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <WatchSyncStatusIcon
              connected={connected}
              syncing={syncing}
              supported={availability.supported}
              successKey={successKey}
            />
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>
                {syncing
                  ? 'Syncing…'
                  : !availability.supported
                    ? 'Not available here'
                    : connected
                      ? 'Watch connected'
                      : 'Connect Apple Watch'}
              </Text>
              <Text style={styles.heroSub}>
                {syncing
                  ? 'Pulling sleep, heart rate, and activity from Health…'
                  : !availability.supported
                    ? availability.reason
                    : connected
                      ? "Sleep, heart rate, steps, and energy feed Recovery. The Dosify Watch app shows today's doses."
                      : 'Grant Health access, then sync. Wear your watch overnight for sleep.'}
              </Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Animated.View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={styles.lastSync}>
              {syncing ? 'Sync in progress' : `Last sync: ${formatLastSync(lastSync)}`}
            </Text>
          </View>
        </Card>
      </Animated.View>

      {!availability.supported && (
        <Card variant="alert" style={styles.alertCard}>
          <Text style={styles.alertTitle}>How to enable</Text>
          <Text style={styles.alertText}>
            Apple Watch sync needs the Dosify iOS app (development or App Store build), not Expo
            Go. After installing, open this screen and tap Sync Now to allow Health access.
          </Text>
        </Card>
      )}

      {error ? (
        <Card variant="alert" style={styles.alertCard}>
          <Text style={styles.alertText}>{error}</Text>
          {availability.supported ? (
            <Pressable onPress={() => void openHealthSettings()} style={styles.settingsLink}>
              <Text style={styles.settingsLinkText}>Open Health settings</Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      {availability.supported ? (
        <>
          <Card>
            <View style={styles.toggleRow}>
              <View style={styles.toggleCopy}>
                <Text style={styles.toggleTitle}>Sync when app opens</Text>
                <Text style={styles.toggleSub}>
                  Quietly refresh Health data when Dosify comes to the foreground (about every 30
                  minutes).
                </Text>
              </View>
              <Switch
                value={autoSync}
                onValueChange={toggleAutoSync}
                disabled={syncing}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>
          </Card>

          <GradientButton
            title={syncing ? 'Syncing…' : connected ? 'Sync now' : 'Connect & sync'}
            onPress={handleSync}
            disabled={syncing}
          />

          <SyncSuccessBanner
            visible={showSuccess}
            recoveryUpdated={recoveryUpdated}
            onHide={() => setShowSuccess(false)}
          />
        </>
      ) : null}

      {loading && !latest ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : latest ? (
        <>
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.metricGrid} key={celebrateMetrics ? `m-${successKey}` : 'metrics'}>
            <MetricTile
              index={0}
              celebrate={celebrateMetrics}
              label="Heart Rate"
              value={latest.heartRateAvg?.toString() ?? '—'}
              unit="bpm avg"
              icon="heart-outline"
              color={colors.danger}
              hint="Wear watch daytime"
            />
            <MetricTile
              index={1}
              celebrate={celebrateMetrics}
              label="Resting HR"
              value={latest.restingHeartRate?.toString() ?? '—'}
              unit="bpm"
              icon="pulse-outline"
              color={colors.orange}
              hint="Needs overnight wear"
            />
            <MetricTile
              index={2}
              celebrate={celebrateMetrics}
              label="Steps"
              value={latest.steps?.toLocaleString() ?? '—'}
              icon="footsteps-outline"
              color={colors.green}
              hint="Today so far"
            />
            <MetricTile
              index={3}
              celebrate={celebrateMetrics}
              label="Sleep"
              value={latest.sleepHours?.toString() ?? '—'}
              unit="hrs"
              icon="moon-outline"
              color={colors.blue}
              hint="Last night"
            />
            <MetricTile
              index={4}
              celebrate={celebrateMetrics}
              label="Active Energy"
              value={latest.activeEnergyKcal?.toString() ?? '—'}
              unit="kcal"
              icon="flame-outline"
              color={colors.warning}
              hint="Today so far"
            />
          </View>

          {sleepChart ? (
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Text style={styles.sectionTitle}>Sleep · 7 days</Text>
              <LineChart
                data={sleepChart.series}
                labels={sleepChart.labels}
                colors={[colors.blue]}
                height={160}
              />
            </Animated.View>
          ) : null}

          <Text style={styles.recoveryNote}>
            Sleep and resting heart rate drive Recovery most. Steps and energy add a light activity
            signal when those are available.
          </Text>
        </>
      ) : availability.supported ? (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptyText}>
            1. Wear your Apple Watch (especially overnight){'\n'}
            2. Confirm Apple Health shows sleep and heart rate{'\n'}
            3. Tap Connect & sync and allow Dosify to read Health
          </Text>
        </Card>
      ) : null}

      <View style={styles.links}>
        <Pressable onPress={() => router.push('/recovery')} style={styles.linkWrap}>
          <Text style={styles.link}>View Recovery →</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/observational-insights' as never)}
          style={styles.linkWrap}
        >
          <Text style={styles.link}>Wearable insights →</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceLight,
  },
  heroRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: { ...typography.h3, color: colors.text },
  heroSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lastSync: {
    ...typography.caption,
    color: colors.textMuted,
  },
  alertCard: { marginBottom: spacing.md },
  alertTitle: {
    ...typography.body,
    color: colors.danger,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  alertText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  settingsLink: { marginTop: spacing.sm },
  settingsLinkText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleCopy: { flex: 1 },
  toggleTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  toggleSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricTile: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  metricValue: {
    ...typography.h3,
    color: colors.text,
  },
  metricUnit: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  metricHint: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 4,
  },
  recoveryNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  emptyTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 24,
  },
  links: {
    marginTop: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  linkWrap: { paddingVertical: spacing.xs },
  link: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
