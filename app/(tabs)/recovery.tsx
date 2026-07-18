import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  RecoveryHeroPanel,
  RecoveryTipsPanel,
  SystemRecoveryTile,
} from '@/components/recovery';
import {
  ApiBanner,
  SpatialHeader,
  SpatialListRow,
  SpatialScreen,
  SpatialSection,
} from '@/components/spatial';
import { useSpatialColorScheme, useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { LineChart } from '@/components/ui/LineChart';
import { colors, indicatorIcons, spacing, typography } from '@/constants/theme';
import { useRecovery, useRecoveryHistory, useWearableStatus } from '@/hooks/useApi';
import { formatLastSync } from '@/lib/watch-sync/format';

const SYSTEMS = [
  {
    key: 'cognitive',
    label: 'Cognitive System',
    shortLabel: 'Cognitive',
    field: 'cognitivePct' as const,
    icon: 'bulb-outline' as const,
    iconBg: 'rgba(168, 85, 247, 0.18)',
    iconColor: colors.purple,
  },
  {
    key: 'cardiovascular',
    label: 'Cardiovascular',
    shortLabel: 'Cardio',
    field: 'cardiovascularPct' as const,
    icon: 'heart-outline' as const,
    iconBg: indicatorIcons.cardioLoad.bg,
    iconColor: indicatorIcons.cardioLoad.color,
  },
  {
    key: 'liver',
    label: 'Liver Function',
    shortLabel: 'Liver',
    field: 'liverPct' as const,
    icon: 'water-outline' as const,
    iconBg: 'rgba(249, 115, 22, 0.18)',
    iconColor: colors.orange,
  },
  {
    key: 'sleep',
    label: 'Sleep Quality',
    shortLabel: 'Sleep',
    field: 'sleepPct' as const,
    icon: 'moon-outline' as const,
    iconBg: indicatorIcons.sleepImpact.bg,
    iconColor: indicatorIcons.sleepImpact.color,
  },
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function chartFromHistory(
  history: Array<{ score: number; recordedAt?: string }> | null,
  currentScore: number
) {
  if (history && history.length >= 2) {
    const labels = history.map((h) => {
      const d = new Date(h.recordedAt ?? Date.now());
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });
    return { labels, series: [history.map((h) => h.score)] };
  }

  // Gentle demo curve when history is sparse
  const base = currentScore;
  const series = [
    Math.max(0, base - 18),
    Math.max(0, base - 12),
    Math.max(0, base - 8),
    Math.max(0, base - 5),
    Math.max(0, base - 3),
    Math.max(0, base - 1),
    base,
  ];
  return { labels: DAY_LABELS, series: [series] };
}

export default function RecoveryScreen() {
  const router = useRouter();
  const theme = useSpatialTheme();
  const colorScheme = useSpatialColorScheme();
  const { data, loading, error, refetch } = useRecovery();
  const { data: history, refetch: refetchHistory } = useRecoveryHistory(7);
  const { data: wearableStatus, refetch: refetchWearable } = useWearableStatus();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchHistory();
      refetchWearable();
    }, [refetch, refetchHistory, refetchWearable])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchHistory(), refetchWearable()]);
    setRefreshing(false);
  }, [refetch, refetchHistory, refetchWearable]);

  const score = data?.score ?? 68;
  const tileGap = spacing.sm;
  const tileRows = [SYSTEMS.slice(0, 2), SYSTEMS.slice(2, 4)];

  const chart = useMemo(
    () => chartFromHistory(history, score),
    [history, score]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        loadingWrap: {
          paddingVertical: spacing.xxxl,
          alignItems: 'center',
        },
        watchPromo: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
        watchIcon: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: `${theme.accent}18`,
          alignItems: 'center',
          justifyContent: 'center',
        },
        watchCopy: { flex: 1 },
        watchTitle: {
          ...typography.body,
          color: theme.text,
          fontWeight: '600',
        },
        watchMeta: {
          ...typography.caption,
          color: theme.textSecondary,
          marginTop: 2,
          lineHeight: 18,
        },
        gridRow: {
          flexDirection: 'row',
          alignItems: 'stretch',
          gap: tileGap,
          marginBottom: tileGap,
        },
        gridCell: {
          flex: 1,
          minWidth: 0,
        },
        chartWrap: {
          paddingVertical: spacing.md,
        },
        chartNote: {
          ...typography.caption,
          color: theme.textMuted,
          textAlign: 'center',
          marginTop: spacing.sm,
        },
        pressed: {
          backgroundColor: theme.pressed,
        },
      }),
    [theme, tileGap]
  );

  return (
    <SpatialScreen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
      }
    >
      <SpatialHeader title="Recovery" showThemeToggle showBell={false} />

      {error && <ApiBanner message="Could not load recovery data. Is the API running?" />}

      {loading && !data && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.accent} />
        </View>
      )}

      <RecoveryHeroPanel
        score={score}
        estimatedRecoveryAt={data?.estimatedRecoveryAt}
        variant={colorScheme === 'light' ? 'light' : 'dark'}
      />

      <SpatialSection title="Body Systems" layout="plain">
        {tileRows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {row.map((sys) => (
              <View key={sys.key} style={styles.gridCell}>
                <SystemRecoveryTile
                  label={sys.label}
                  shortLabel={sys.shortLabel}
                  value={data?.[sys.field] ?? 70}
                  icon={sys.icon}
                  iconBg={sys.iconBg}
                  iconColor={sys.iconColor}
                />
              </View>
            ))}
          </View>
        ))}
      </SpatialSection>

      <SpatialSection
        title="7-Day Trend"
        footer={
          history && history.length >= 2
            ? 'Recovery score from your logged snapshots.'
            : 'Trend preview — updates as you log intakes and sync data.'
        }
        layout="grouped"
      >
        <View style={styles.chartWrap}>
          <LineChart
            data={chart.series}
            labels={chart.labels}
            colors={[theme.accent]}
            height={160}
            showMarker
            markerIndex={Math.max(0, chart.labels.length - 1)}
          />
        </View>
      </SpatialSection>

      <SpatialSection title="Today's Focus" layout="grouped">
        <RecoveryTipsPanel
          cognitivePct={data?.cognitivePct ?? 72}
          cardiovascularPct={data?.cardiovascularPct ?? 64}
          liverPct={data?.liverPct ?? 58}
          sleepPct={data?.sleepPct ?? 70}
          substanceName={data?.latestSubstance?.name}
          drugClass={data?.latestSubstance?.drugClass}
          categorySlug={data?.latestSubstance?.categorySlug}
        />
      </SpatialSection>

      <SpatialSection title="Wearables" layout="grouped">
        {wearableStatus?.latest ? (
          <SpatialListRow
            title="Apple Watch synced"
            subtitle={[
              formatLastSync(wearableStatus.lastSyncAt),
              wearableStatus.latest.sleepHours != null
                ? `${wearableStatus.latest.sleepHours}h sleep`
                : null,
              wearableStatus.latest.restingHeartRate != null
                ? `${wearableStatus.latest.restingHeartRate} bpm resting`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
            icon="watch-outline"
            onPress={() => router.push('/watch-sync')}
            isLast
          />
        ) : (
          <Pressable
            onPress={() => router.push('/watch-sync')}
            style={({ pressed }) => [styles.watchPromo, pressed && styles.pressed]}
          >
            <View style={styles.watchIcon}>
              <Ionicons name="watch-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.watchCopy}>
              <Text style={styles.watchTitle}>Connect Apple Watch</Text>
              <Text style={styles.watchMeta}>
                Sync sleep and heart rate to improve recovery estimates.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </Pressable>
        )}
      </SpatialSection>

      <SpatialSection title="Explore" layout="grouped">
        <SpatialListRow
          title="Health Trends"
          subtitle="Recovery, sleep, and activity over time"
          icon="analytics-outline"
          onPress={() => router.push('/trends')}
        />
        <SpatialListRow
          title="Insights"
          subtitle="Weekly patterns and recommendations"
          icon="sparkles-outline"
          onPress={() => router.push('/insights')}
        />
        <SpatialListRow
          title="Effect Timeline"
          subtitle="See how substances wear off"
          icon="git-commit-outline"
          onPress={() => router.push('/effect-timeline')}
          isLast
        />
      </SpatialSection>
    </SpatialScreen>
  );
}
