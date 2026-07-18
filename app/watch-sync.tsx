import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { GradientButton } from '@/components/ui/GradientButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useWearableStatus } from '@/hooks/useApi';
import { useWatchSync } from '@/hooks/useWatchSync';
import { formatLastSync } from '@/lib/watch-sync/format';

function MetricTile({
  label,
  value,
  unit,
  icon,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View style={styles.metricTile}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>
        {value}
        {unit ? <Text style={styles.metricUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

export default function WatchSyncScreen() {
  const router = useRouter();
  const { data: status, loading, refetch } = useWearableStatus();
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  const {
    availability,
    autoSync,
    syncing,
    error,
    localLastSync,
    syncNow,
    toggleAutoSync,
  } = useWatchSync(() => {
    void refetchRef.current();
  });

  const autoSyncRanRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      void refetchRef.current();
      autoSyncRanRef.current = false;

      if (autoSync && availability.supported && !autoSyncRanRef.current) {
        autoSyncRanRef.current = true;
        void syncNow()
          .then(() => refetchRef.current())
          .catch(() => {});
      }

      return () => {
        autoSyncRanRef.current = false;
      };
    }, [autoSync, availability.supported, syncNow])
  );

  const latest = status?.latest;
  const lastSync = status?.lastSyncAt ?? localLastSync;

  const handleSync = async () => {
    try {
      await syncNow();
      refetch();
    } catch {
      // error state handled in hook
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Apple Watch Sync" showBack onBack={() => router.back()} />

      <Card style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="watch-outline" size={28} color={colors.primary} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>HealthKit Sync</Text>
            <Text style={styles.heroSub}>
              Pull heart rate, sleep, steps, and activity from Apple Watch via the
              Health app on iPhone.
            </Text>
          </View>
        </View>
        <Text style={styles.lastSync}>
          Last sync: {formatLastSync(lastSync)}
        </Text>
      </Card>

      {!availability.supported && (
        <Card variant="alert" style={styles.alertCard}>
          <Text style={styles.alertTitle}>Sync unavailable</Text>
          <Text style={styles.alertText}>{availability.reason}</Text>
        </Card>
      )}

      {error && (
        <Card variant="alert" style={styles.alertCard}>
          <Text style={styles.alertText}>{error}</Text>
        </Card>
      )}

      <Card>
        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Auto-sync on open</Text>
            <Text style={styles.toggleSub}>
              Sync watch data when you open this screen.
            </Text>
          </View>
          <Switch
            value={autoSync}
            onValueChange={toggleAutoSync}
            disabled={!availability.supported || syncing}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
      </Card>

      <GradientButton
        title={syncing ? 'Syncing…' : 'Sync Now'}
        onPress={handleSync}
        disabled={!availability.supported || syncing}
      />

      {loading && !latest ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : latest ? (
        <>
          <Text style={styles.sectionTitle}>Latest Watch Data</Text>
          <View style={styles.metricGrid}>
            <MetricTile
              label="Heart Rate"
              value={latest.heartRateAvg?.toString() ?? '—'}
              unit="bpm avg"
              icon="heart-outline"
              color={colors.danger}
            />
            <MetricTile
              label="Resting HR"
              value={latest.restingHeartRate?.toString() ?? '—'}
              unit="bpm"
              icon="pulse-outline"
              color={colors.orange}
            />
            <MetricTile
              label="Steps"
              value={latest.steps?.toLocaleString() ?? '—'}
              icon="footsteps-outline"
              color={colors.green}
            />
            <MetricTile
              label="Sleep"
              value={latest.sleepHours?.toString() ?? '—'}
              unit="hrs"
              icon="moon-outline"
              color={colors.blue}
            />
            <MetricTile
              label="Active Energy"
              value={latest.activeEnergyKcal?.toString() ?? '—'}
              unit="kcal"
              icon="flame-outline"
              color={colors.warning}
            />
          </View>
          <Text style={styles.recoveryNote}>
            Synced data blends into your Recovery score (sleep and cardiovascular
            metrics).
          </Text>
        </>
      ) : (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.emptyText}>
            No watch data synced yet. Wear your Apple Watch, then tap Sync Now.
          </Text>
        </Card>
      )}

      <Pressable onPress={() => router.push('/recovery')} style={styles.linkWrap}>
        <Text style={styles.link}>View Recovery Center →</Text>
      </Pressable>
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
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${colors.primary}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: { ...typography.h3, color: colors.text },
  heroSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
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
  recoveryNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 22,
  },
  linkWrap: { marginTop: spacing.xl },
  link: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
