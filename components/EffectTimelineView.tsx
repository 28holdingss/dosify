import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  SpatialFilterChips,
  SystemImpactRow,
  TimelineHeroCard,
  TimelinePhaseBar,
} from '@/components/timeline';
import { ApiBanner, SpatialSection } from '@/components/spatial';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { LineChart } from '@/components/ui/LineChart';
import { colors, indicatorIcons, radius, spacing, typography } from '@/constants/theme';
import { useIntakes, useTimeline } from '@/hooks/useApi';
import type { TimelineData } from '@/types/api';
import { formatTime } from '@/lib/format';

const FILTER_OPTIONS = ['All', 'Cognitive', 'Cardio', 'GI', 'Liver', 'Kidney', 'Lungs'] as const;

const FILTER_SERIES: Record<string, (keyof TimelineData['series'])[] | null> = {
  All: null,
  Cognitive: ['cognitive'],
  Cardio: ['cardiovascular'],
  GI: ['gastrointestinal'],
  Liver: ['liver'],
  Kidney: ['kidney'],
  Lungs: ['respiratory'],
};

const SERIES_META = {
  cognitive: {
    label: 'Cognitive',
    color: colors.purple,
    icon: 'bulb-outline' as const,
    iconBg: 'rgba(168, 85, 247, 0.18)',
    iconColor: colors.purple,
  },
  cardiovascular: {
    label: 'Cardiovascular',
    color: indicatorIcons.cardioLoad.color,
    icon: 'heart-outline' as const,
    iconBg: indicatorIcons.cardioLoad.bg,
    iconColor: indicatorIcons.cardioLoad.color,
  },
  gastrointestinal: {
    label: 'Gastrointestinal',
    color: colors.green,
    icon: 'fitness-outline' as const,
    iconBg: 'rgba(16, 185, 129, 0.18)',
    iconColor: colors.green,
  },
  liver: {
    label: 'Liver',
    color: colors.orange,
    icon: 'medical-outline' as const,
    iconBg: 'rgba(249, 115, 22, 0.18)',
    iconColor: colors.orange,
  },
  kidney: {
    label: 'Kidney',
    color: '#0EA5E9',
    icon: 'ellipse-outline' as const,
    iconBg: 'rgba(14, 165, 233, 0.18)',
    iconColor: '#0EA5E9',
  },
  respiratory: {
    label: 'Respiratory',
    color: colors.success,
    icon: 'cloud-outline' as const,
    iconBg: 'rgba(34, 197, 94, 0.18)',
    iconColor: colors.success,
  },
};

type EffectTimelineViewProps = {
  intakeId?: string;
  onRefetchReady?: (refetch: () => Promise<void>) => void;
};

export function EffectTimelineView({ intakeId: intakeIdProp, onRefetchReady }: EffectTimelineViewProps) {
  const router = useRouter();
  const theme = useSpatialTheme();
  const [filter, setFilter] = useState<string>('All');
  const { data: intakes, refetch: refetchIntakes } = useIntakes(20);

  const recentOptions = useMemo(
    () =>
      (intakes ?? [])
        .filter((intake) => intake.analysis != null)
        .map((intake) => ({
          id: intake.id,
          substanceName: intake.substance.name,
          takenAt: intake.takenAt,
        })),
    [intakes]
  );

  const [selectedId, setSelectedId] = useState<string | undefined>(intakeIdProp);

  useEffect(() => {
    if (intakeIdProp) {
      setSelectedId(intakeIdProp);
    }
  }, [intakeIdProp]);

  useEffect(() => {
    if (recentOptions.length === 0) return;
    if (selectedId && recentOptions.some((option) => option.id === selectedId)) return;
    if (intakeIdProp && recentOptions.some((option) => option.id === intakeIdProp)) {
      setSelectedId(intakeIdProp);
      return;
    }
    setSelectedId(recentOptions[0]?.id);
  }, [intakeIdProp, recentOptions, selectedId]);

  const { data, loading, error, refetch } = useTimeline(selectedId);

  const combinedRefetch = useCallback(async () => {
    await Promise.all([refetch(), refetchIntakes()]);
  }, [refetch, refetchIntakes]);

  useFocusEffect(
    useCallback(() => {
      combinedRefetch();
    }, [combinedRefetch])
  );

  useEffect(() => {
    onRefetchReady?.(combinedRefetch);
  }, [onRefetchReady, combinedRefetch]);

  const timeline = data && !('empty' in data) ? data : null;
  const empty = data && 'empty' in data ? data.message : null;
  const isSwitching =
    Boolean(loading && timeline && selectedId && timeline.intakeId !== selectedId);

  const chartData = useMemo(() => {
    if (!timeline) return { data: [] as number[][], labels: [] as string[], legend: [] as string[] };
    const keys = FILTER_SERIES[filter] ?? [
      'cognitive',
      'cardiovascular',
      'gastrointestinal',
      'liver',
      'kidney',
      'respiratory',
    ];
    return {
      data: keys.map((k) => timeline.series[k]),
      labels: timeline.labels,
      legend: keys.map((k) => SERIES_META[k].label),
      colors: keys.map((k) => SERIES_META[k].color),
    };
  }, [timeline, filter]);

  const phase = timeline?.phase ?? 'onset';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        loadingWrap: {
          paddingVertical: spacing.xxxl,
          alignItems: 'center',
        },
        emptyWrap: {
          backgroundColor: theme.card,
          borderRadius: radius.xl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.separator,
          padding: spacing.xxl,
          alignItems: 'center',
          gap: spacing.md,
        },
        emptyIcon: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: `${theme.accent}18`,
          alignItems: 'center',
          justifyContent: 'center',
        },
        emptyTitle: {
          ...typography.h3,
          color: theme.text,
          textAlign: 'center',
        },
        emptyBody: {
          ...typography.caption,
          color: theme.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
        },
        cta: {
          marginTop: spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          borderRadius: radius.full,
          backgroundColor: theme.accent,
        },
        ctaText: {
          ...typography.body,
          color: '#FFFFFF',
          fontWeight: '600',
        },
        chartWrap: {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
        legend: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
        },
        legendItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        legendDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
        },
        legendText: {
          ...typography.small,
          color: theme.textSecondary,
        },
        summaryBox: {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.separator,
        },
        summaryText: {
          ...typography.caption,
          color: theme.textSecondary,
          lineHeight: 20,
        },
        footerTip: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
        footerText: {
          ...typography.caption,
          color: theme.accent,
          flex: 1,
          lineHeight: 18,
          fontStyle: 'italic',
        },
        nowBadge: {
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: spacing.md,
          paddingVertical: 6,
          borderRadius: radius.full,
          backgroundColor: `${theme.accent}18`,
          marginBottom: spacing.sm,
        },
        nowText: {
          ...typography.small,
          color: theme.accent,
          fontWeight: '600',
        },
        highlightRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.separator,
        },
        highlightRowLast: {
          borderBottomWidth: 0,
        },
        highlightText: {
          ...typography.caption,
          color: theme.textSecondary,
          flex: 1,
          lineHeight: 18,
        },
      }),
    [theme]
  );

  if (loading && !timeline) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (error) {
    return <ApiBanner message="Could not load timeline. Is the API running?" />;
  }

  if (empty) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIcon}>
          <Ionicons name="analytics-outline" size={28} color={theme.accent} />
        </View>
        <Text style={styles.emptyTitle}>No timeline yet</Text>
        <Text style={styles.emptyBody}>{empty}</Text>
        <Pressable style={styles.cta} onPress={() => router.push('/log-search')}>
          <Text style={styles.ctaText}>Log a substance</Text>
        </Pressable>
      </View>
    );
  }

  if (!timeline) return null;

  const markerIdx = timeline.markerIndex;
  const systems = [
    {
      key: 'cognitive' as const,
      ...SERIES_META.cognitive,
      value: timeline.series.cognitive[markerIdx] ?? 0,
    },
    {
      key: 'cardiovascular' as const,
      ...SERIES_META.cardiovascular,
      value: timeline.series.cardiovascular[markerIdx] ?? 0,
    },
    {
      key: 'gastrointestinal' as const,
      ...SERIES_META.gastrointestinal,
      value: timeline.series.gastrointestinal[markerIdx] ?? 0,
    },
    {
      key: 'liver' as const,
      ...SERIES_META.liver,
      value: timeline.series.liver[markerIdx] ?? 0,
    },
    {
      key: 'kidney' as const,
      ...SERIES_META.kidney,
      value: timeline.series.kidney?.[markerIdx] ?? 0,
    },
    {
      key: 'respiratory' as const,
      ...SERIES_META.respiratory,
      value: timeline.series.respiratory?.[markerIdx] ?? 0,
    },
  ];

  const filteredSystems =
    filter === 'All'
      ? systems
      : systems.filter((s) => {
          if (filter === 'Cognitive') return s.key === 'cognitive';
          if (filter === 'Cardio') return s.key === 'cardiovascular';
          if (filter === 'GI') return s.key === 'gastrointestinal';
          if (filter === 'Liver') return s.key === 'liver';
          if (filter === 'Kidney') return s.key === 'kidney';
          if (filter === 'Lungs') return s.key === 'respiratory';
          return true;
        });

  return (
    <>
      {isSwitching ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <>
      <TimelineHeroCard
        substanceName={timeline.substanceName}
        categoryLabel={timeline.categoryLabel}
        drugClass={timeline.drugClass}
        takenAt={timeline.takenAt}
        durationMinHours={timeline.durationMinHours}
        durationMaxHours={timeline.durationMaxHours}
        peakWindowStart={timeline.peakWindowStart}
        peakWindowEnd={timeline.peakWindowEnd}
        hoursFromStart={timeline.hoursFromStart}
        peakTimeLabel={formatTime(timeline.peakTime)}
        intakeOptions={recentOptions}
        selectedIntakeId={selectedId}
        onSelectIntake={setSelectedId}
      />

      <TimelinePhaseBar
        phase={phase}
        markerIndex={timeline.markerIndex}
        peakIndex={timeline.peakIndex}
        pointCount={timeline.series.cognitive.length}
        phaseLabels={timeline.phaseLabels}
        phaseDescription={timeline.phaseDescription}
      />

      <SpatialFilterChips
        options={[...FILTER_OPTIONS]}
        selected={filter}
        onSelect={setFilter}
      />

      <SpatialSection
        title="Effect Curve"
        footer="Dashed line marks your current position on the timeline."
        layout="grouped"
      >
        <View style={styles.nowBadge}>
          <Ionicons name="locate-outline" size={14} color={theme.accent} />
          <Text style={styles.nowText}>
            Now · {timeline.hoursFromStart}h · {formatTime(timeline.markerTime)}
          </Text>
        </View>
        <View style={styles.chartWrap}>
          <LineChart
            data={chartData.data}
            labels={chartData.labels}
            colors={chartData.colors}
            showMarker
            markerIndex={timeline.markerIndex}
            height={200}
            surfaceColor="transparent"
            gridColor={theme.separator}
            markerColor={theme.accent}
            labelColor={theme.textMuted}
            markerLabel="Current position"
          />
        </View>
        <View style={styles.legend}>
          {chartData.legend.map((name, i) => (
            <View key={name} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: chartData.colors[i] ?? theme.accent },
                ]}
              />
              <Text style={styles.legendText}>{name}</Text>
            </View>
          ))}
        </View>
      </SpatialSection>

      {timeline.impactHighlights.length > 0 && (
        <SpatialSection
          title="What to Expect"
          footer={`Based on ${timeline.categoryLabel} pharmacology.`}
          layout="grouped"
        >
          {timeline.impactHighlights.map((highlight, index) => (
            <View
              key={highlight}
              style={[
                styles.highlightRow,
                index === timeline.impactHighlights.length - 1 && styles.highlightRowLast,
              ]}
            >
              <Ionicons name="pulse-outline" size={14} color={theme.accent} />
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ))}
        </SpatialSection>
      )}

      <SpatialSection
        title="Current Impact"
        footer={`Peak window ${timeline.peakWindowStart}–${timeline.peakWindowEnd}h · curve peak at ${formatTime(timeline.peakTime)}.`}
        layout="grouped"
      >
        {filteredSystems.map((sys, index) => (
          <SystemImpactRow
            key={sys.key}
            label={sys.label}
            value={sys.value}
            icon={sys.icon}
            iconBg={sys.iconBg}
            iconColor={sys.iconColor}
            insight={timeline.systemInsights[sys.key]}
            isLast={index === filteredSystems.length - 1}
          />
        ))}
      </SpatialSection>

      {(timeline.summary || timeline.footer) && (
        <SpatialSection title="Summary" layout="grouped">
          {timeline.summary && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>{timeline.summary}</Text>
            </View>
          )}
          {timeline.footer && (
            <View style={styles.footerTip}>
              <Ionicons name="water-outline" size={16} color={theme.accent} />
              <Text style={styles.footerText}>{timeline.footer}</Text>
            </View>
          )}
        </SpatialSection>
      )}
        </>
      )}
    </>
  );
}
