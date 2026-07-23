import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BarChart } from '@/components/ui/BarChart';
import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/FilterChips';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, getRiskColor, spacing, typography } from '@/constants/theme';
import { useTrends } from '@/hooks/useApi';
import { riskLevelToLabel } from '@/lib/format';

const CATEGORY_LABELS: Record<string, string> = {
  Substances: 'Substance Intake',
  Risk: 'Average Risk Score',
  Sleep: 'Sleep Quality',
  Heart: 'Cardiovascular Recovery',
  Activity: 'Overall Recovery',
};

const CATEGORY_UNITS: Record<string, string> = {
  Substances: 'logs',
  Risk: '/100 avg',
  Sleep: '% recovery',
  Heart: '% recovery',
  Activity: '% recovery',
};

const TREND_TABS = ['Substances', 'Risk', 'Sleep', 'Heart', 'Activity'] as const;

export default function TrendsScreen() {
  const router = useRouter();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const initialTab =
    typeof tabParam === 'string' && TREND_TABS.includes(tabParam as (typeof TREND_TABS)[number])
      ? tabParam
      : 'Substances';
  const [tab, setTab] = useState(initialTab);
  const [range, setRange] = useState('90D');
  const { data, loading, error } = useTrends(range, tab);

  useEffect(() => {
    if (
      typeof tabParam === 'string' &&
      TREND_TABS.includes(tabParam as (typeof TREND_TABS)[number])
    ) {
      setTab(tabParam);
    }
  }, [tabParam]);

  const chartTitle = CATEGORY_LABELS[tab] ?? 'Trends';
  const chartValues = data?.chart.values.filter((v) => v > 0) ?? [];
  const hasChartData = chartValues.length > 0;

  return (
    <Screen>
      <ScreenHeader
        title="Trends & Reports"
        showBack
        onBack={() => router.back()}
      />

      <FilterChips
        options={[...TREND_TABS]}
        selected={tab}
        onSelect={setTab}
      />

      <View style={styles.rangeRow}>
        {['7D', '30D', '90D', '1Y'].map((r) => (
          <Pressable
            key={r}
            style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
            onPress={() => setRange(r)}
          >
            <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>{r}</Text>
          </Pressable>
        ))}
      </View>

      {loading && <ActivityIndicator color={colors.primary} />}
      {error && (
        <Text style={styles.errorText}>Could not load trends. Is the API running?</Text>
      )}

      {data?.summary && (
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Period Summary · {range}</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{data.summary.totalIntakes}</Text>
              <Text style={styles.summaryLabel}>Intakes</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{data.summary.analyzedIntakes}</Text>
              <Text style={styles.summaryLabel}>Analyzed</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryValue,
                  data.summary.avgRisk > 0 && { color: getRiskColor(data.summary.avgRisk) },
                ]}
              >
                {data.summary.avgRisk || '—'}
              </Text>
              <Text style={styles.summaryLabel}>Avg Risk</Text>
            </View>
          </View>
          <Text style={styles.trendLabel}>{data.summary.trendLabel}</Text>
        </Card>
      )}

      <Text style={styles.sectionTitle}>{chartTitle}</Text>
      {data && hasChartData ? (
        <BarChart data={data.chart.values} labels={data.chart.labels} />
      ) : (
        <Card>
          <Text style={styles.emptyText}>
            No {CATEGORY_UNITS[tab] ?? 'data'} for this period yet.
          </Text>
        </Card>
      )}

      <Text style={styles.sectionTitle}>Most Logged</Text>
      <Card>
        {data && data.mostLogged.length > 0 ? (
          data.mostLogged.map((item, i) => (
            <View
              key={item.name}
              style={[
                styles.loggedRow,
                i < data.mostLogged.length - 1 && styles.loggedBorder,
              ]}
            >
              <Text style={styles.loggedRank}>{i + 1}</Text>
              <Text style={styles.loggedName}>{item.name}</Text>
              <Text style={styles.loggedCount}>{item.count}x</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No intake data for this period.</Text>
        )}
      </Card>

      {data && data.highestRiskSubstances.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Highest Avg Risk</Text>
          <Card>
            {data.highestRiskSubstances.map((item, i) => (
              <View
                key={item.name}
                style={[
                  styles.riskRow,
                  i < data.highestRiskSubstances.length - 1 && styles.loggedBorder,
                ]}
              >
                <View style={styles.riskLeft}>
                  <Text style={styles.loggedName}>{item.name}</Text>
                  <Text style={styles.riskSub}>
                    {item.count} log{item.count === 1 ? '' : 's'} · avg {item.avgRisk}/100
                  </Text>
                </View>
                <RiskBadge level={riskLevelToLabel(item.riskLevel)} />
              </View>
            ))}
          </Card>
        </>
      )}

      <Pressable onPress={() => router.push('/insights')} style={styles.footerLink}>
        <Text style={styles.link}>View Weekly Insights →</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  rangeBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rangeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rangeText: { ...typography.caption, color: colors.textSecondary },
  rangeTextActive: { color: colors.text, fontWeight: '600' },
  errorText: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.md,
  },
  summaryCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceLight,
  },
  summaryTitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 2,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  trendLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  loggedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  loggedBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  loggedRank: {
    ...typography.body,
    color: colors.textMuted,
    width: 24,
  },
  loggedName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    fontWeight: '500',
  },
  loggedCount: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  riskLeft: { flex: 1 },
  riskSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  footerLink: { marginTop: spacing.lg },
  link: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
