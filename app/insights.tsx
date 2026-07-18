import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { LineChart } from '@/components/ui/LineChart';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, getRiskColor, spacing, typography } from '@/constants/theme';
import { useInsights } from '@/hooks/useApi';
import { formatRelativeTime } from '@/lib/format';

export default function InsightsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState('Overview');
  const { data, loading, error } = useInsights();

  const riskTrend = data?.riskTrend.values.some((v) => v > 0)
    ? [data.riskTrend.values]
    : [];
  const riskLabels = data?.riskTrend.labels ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const impactTrend =
    data?.impactTrend &&
    (data.impactTrend.cognitive.some((v) => v > 0) ||
      data.impactTrend.cardiovascular.some((v) => v > 0) ||
      data.impactTrend.gastrointestinal.some((v) => v > 0))
      ? [
          data.impactTrend.cognitive,
          data.impactTrend.cardiovascular,
          data.impactTrend.gastrointestinal,
        ]
      : [];

  const breakdown = data?.impactBreakdown;

  return (
    <Screen>
      <ScreenHeader title="Insights & Reports" showBack onBack={() => router.back()} />

      <View style={styles.tabs}>
        {['Overview', 'Patterns', 'Stats'].map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {loading && <ActivityIndicator color={colors.primary} />}
      {error && (
        <Text style={styles.errorText}>Could not load insights. Is the API running?</Text>
      )}

      {tab === 'Overview' && data && (
        <>
          <Card style={styles.narrativeCard}>
            <Text style={styles.narrativeLabel}>Weekly Report</Text>
            <Text style={styles.narrativeText}>{data.weeklyNarrative}</Text>
            {data.stats.avgRiskThisWeek > 0 && (
              <View style={styles.narrativeFooter}>
                <RiskBadge
                  level={
                    data.stats.avgRiskThisWeek >= 70
                      ? 'High'
                      : data.stats.avgRiskThisWeek >= 40
                        ? 'Moderate'
                        : 'Low'
                  }
                  score={data.stats.avgRiskThisWeek}
                />
              </View>
            )}
          </Card>

          {breakdown && breakdown.count > 0 && (
            <>
              <Text style={styles.sectionTitle}>Average Impact This Week</Text>
              <Card>
                {[
                  { label: 'Cognitive', value: breakdown.cognitive, color: colors.purple },
                  { label: 'Cardiovascular', value: breakdown.cardiovascular, color: colors.blue },
                  { label: 'Gastrointestinal', value: breakdown.gastrointestinal, color: colors.green },
                  { label: 'Interaction', value: breakdown.interaction, color: colors.danger },
                ].map((item) => (
                  <ProgressBar
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    color={item.color}
                  />
                ))}
              </Card>
            </>
          )}

          <Text style={styles.sectionTitle}>This Week vs Last Week</Text>
          {data.comparisons.map((item) => {
            const isBad = item.invertColors ? item.up : false;
            const isGood = item.invertColors ? !item.up && item.changePercent !== 0 : item.up;
            const color = isBad ? colors.danger : isGood ? colors.success : colors.textMuted;
            return (
              <Card key={item.label} style={styles.compareCard}>
                <View style={styles.compareRow}>
                  <Text style={styles.compareLabel}>{item.label}</Text>
                  <View style={styles.compareRight}>
                    <Text style={styles.compareValue}>{item.thisWeek}</Text>
                    <View style={styles.changeRow}>
                      <Ionicons
                        name={item.changePercent >= 0 ? 'arrow-up' : 'arrow-down'}
                        size={12}
                        color={color}
                      />
                      <Text style={[styles.changeText, { color }]}>
                        {Math.abs(item.changePercent)}%
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.compareSub}>Last week: {item.lastWeek}</Text>
              </Card>
            );
          })}

          <Text style={styles.sectionTitle}>Risk Score Trend</Text>
          {!loading && riskTrend.length > 0 ? (
            <LineChart data={riskTrend} labels={riskLabels} colors={[colors.purple]} />
          ) : (
            <Card>
              <Text style={styles.emptyChart}>Log and analyze intakes to see risk trends.</Text>
            </Card>
          )}

          {!loading && impactTrend.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Impact Trends</Text>
              <LineChart
                data={impactTrend}
                labels={data.impactTrend.labels}
                colors={[colors.purple, colors.blue, colors.green]}
              />
              <View style={styles.legend}>
                {['Cognitive', 'Cardio', 'GI'].map((label, i) => (
                  <View key={label} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        {
                          backgroundColor: [colors.purple, colors.blue, colors.green][i],
                        },
                      ]}
                    />
                    <Text style={styles.legendText}>{label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {data.recentAnalyses.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recent Analyses</Text>
              {data.recentAnalyses.map((item) => (
                <Pressable
                  key={item.intakeId}
                  onPress={() =>
                    router.push({
                      pathname: '/analysis',
                      params: { intakeId: item.intakeId },
                    })
                  }
                >
                  <Card style={styles.analysisRow}>
                    <View style={styles.analysisLeft}>
                      <Text style={styles.analysisName}>{item.substanceName}</Text>
                      <Text style={styles.analysisTime}>
                        {formatRelativeTime(item.takenAt)}
                      </Text>
                    </View>
                    <Text style={[styles.analysisScore, { color: getRiskColor(item.overallScore) }]}>
                      {item.overallScore}
                    </Text>
                  </Card>
                </Pressable>
              ))}
            </>
          )}

          {data.topPositiveImpact && (
            <Card style={{ marginTop: spacing.lg }}>
              <Text style={styles.positiveLabel}>Lowest-Risk Substance</Text>
              <Text style={styles.positiveText}>{data.topPositiveImpact.message}</Text>
            </Card>
          )}
        </>
      )}

      {tab === 'Patterns' && (
        <>
          <Text style={styles.sectionTitle}>This Week's Patterns</Text>
          {(data?.patterns ?? []).map((p) => (
            <Card key={p.title}>
              <Text style={styles.patternTitle}>{p.title}</Text>
              <Text style={styles.patternValue}>{p.value}</Text>
            </Card>
          ))}
        </>
      )}

      {tab === 'Stats' && data?.stats && (
        <>
          <Text style={styles.sectionTitle}>Weekly Stats</Text>
          <View style={styles.statsGrid}>
            {[
              { label: 'Total Intakes', value: data.stats.totalIntakes },
              { label: 'Analyses Run', value: data.stats.analysesRun },
              { label: 'High-Risk Logs', value: data.stats.highRiskLogs },
              { label: 'Interaction Alerts', value: data.stats.interactionAlerts },
              { label: 'Unique Substances', value: data.stats.uniqueSubstances },
              { label: 'Avg Risk', value: data.stats.avgRiskThisWeek },
            ].map((s) => (
              <Card key={s.label} style={styles.statCard}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </Card>
            ))}
          </View>
        </>
      )}

      <Pressable onPress={() => router.push('/trends')}>
        <Text style={styles.link}>View Full Trends & Reports →</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.caption, color: colors.textSecondary },
  tabTextActive: { color: colors.text, fontWeight: '600' },
  errorText: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.md,
  },
  narrativeCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceLight,
  },
  narrativeLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  narrativeText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  narrativeFooter: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  compareCard: { paddingVertical: spacing.md, marginBottom: spacing.sm },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compareLabel: { ...typography.body, color: colors.textSecondary },
  compareRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  compareValue: { ...typography.h3, color: colors.text },
  compareSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  changeText: { ...typography.small, fontWeight: '600' },
  emptyChart: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.small, color: colors.textSecondary },
  analysisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  analysisLeft: { flex: 1 },
  analysisName: { ...typography.body, color: colors.text, fontWeight: '600' },
  analysisTime: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  analysisScore: { ...typography.h3, fontWeight: '700' },
  positiveLabel: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  positiveText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  patternTitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  patternValue: {
    ...typography.h3,
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statValue: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  link: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: spacing.lg,
  },
});
