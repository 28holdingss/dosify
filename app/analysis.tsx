import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { CircularGauge } from '@/components/ui/CircularGauge';
import { GradientButton } from '@/components/ui/GradientButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Screen } from '@/components/ui/Screen';
import { colors, getRiskColor, spacing, typography } from '@/constants/theme';
import { useAnalysisReport } from '@/hooks/useApi';
import { splitRecommendations } from '@/lib/food-tips';
import { formatRelativeTime, formatTime, riskLevelToLabel } from '@/lib/format';

export default function AnalysisScreen() {
  const router = useRouter();
  const { intakeId } = useLocalSearchParams<{ intakeId?: string }>();
  const { data: report, loading, error } = useAnalysisReport(intakeId);

  const intake = report?.intake;
  const analysis = report?.analysis;
  const riskLabel = (analysis?.riskLabel ?? 'Moderate') as 'Low' | 'Moderate' | 'High';

  const { foodTips, other: generalRecs } = useMemo(
    () => splitRecommendations(analysis?.recommendations),
    [analysis?.recommendations]
  );

  const impacts = analysis
    ? [
        { label: 'Cognitive', value: analysis.cognitiveScore, icon: 'brain-outline' as const },
        { label: 'Cardiovascular', value: analysis.cardiovascularScore, icon: 'heart-outline' as const },
        { label: 'Gastrointestinal', value: analysis.gastrointestinalScore, icon: 'fitness-outline' as const },
        { label: 'Liver', value: analysis.liverScore ?? 0, icon: 'water-outline' as const },
        { label: 'Kidney', value: analysis.kidneyScore ?? 0, icon: 'ellipse-outline' as const },
        { label: 'Respiratory', value: analysis.respiratoryScore ?? 0, icon: 'cloud-outline' as const },
        { label: 'Interaction Risk', value: analysis.interactionRiskScore, icon: 'warning-outline' as const },
      ]
    : [];

  const duration =
    analysis?.durationMinHours != null && analysis?.durationMaxHours != null
      ? `${analysis.durationMinHours} – ${analysis.durationMaxHours} hours`
      : null;

  const peak =
    analysis?.peakWindow != null
      ? `${analysis.peakWindow.startHours} – ${analysis.peakWindow.endHours} hours after intake`
      : null;

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Analysis Report</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && <ActivityIndicator color={colors.primary} />}
      {error && (
        <Card variant="alert">
          <Text style={styles.errorText}>
            Could not load analysis. Log and analyze an intake first.
          </Text>
        </Card>
      )}

      {intake && analysis && (
        <>
          <Card>
            <View style={styles.intakeHeader}>
              <View style={styles.intakeIcon}>
                <Ionicons name="flask" size={22} color={colors.primary} />
              </View>
              <View style={styles.intakeMeta}>
                <Text style={styles.substanceName}>{intake.substance.name}</Text>
                <Text style={styles.substanceDose}>
                  {intake.dose} {intake.unit} · {formatTime(intake.takenAt)} ·{' '}
                  {formatRelativeTime(intake.takenAt)}
                </Text>
                {intake.purpose && (
                  <Text style={styles.purpose}>Purpose: {intake.purpose}</Text>
                )}
              </View>
            </View>
            <RiskBadge level={riskLabel} score={analysis.overallScore} />
          </Card>

          <Card>
            <View style={styles.gaugeCenter}>
              <CircularGauge
                value={analysis.overallScore}
                label="/100"
                size={160}
                showRisk={false}
                riskRing
              />
            </View>
            {analysis.summary && <Text style={styles.summary}>{analysis.summary}</Text>}
            {analysis.doseAssessmentLabel && (
              <View style={styles.metaRow}>
                <Ionicons name="speedometer-outline" size={16} color={colors.textMuted} />
                <Text style={styles.metaText}>{analysis.doseAssessmentLabel}</Text>
              </View>
            )}
          </Card>

          <Text style={styles.sectionTitle}>Impact Breakdown</Text>
          <Card>
            {impacts.map((item) => (
              <View key={item.label} style={styles.impactRow}>
                <View style={styles.impactHeader}>
                  <View style={styles.impactLabelRow}>
                    <Ionicons name={item.icon} size={16} color={colors.textSecondary} />
                    <Text style={styles.impactLabel}>{item.label}</Text>
                  </View>
                  <Text style={[styles.impactValue, { color: getRiskColor(item.value) }]}>
                    {item.value}/100
                  </Text>
                </View>
                <ProgressBar
                  label=""
                  value={item.value}
                  color={getRiskColor(item.value)}
                  showValue={false}
                />
              </View>
            ))}
          </Card>

          <View style={styles.twoCol}>
            {duration && (
              <Card style={styles.halfCard}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={styles.miniLabel}>Duration</Text>
                <Text style={styles.miniValue}>{duration}</Text>
              </Card>
            )}
            {peak && (
              <Card style={styles.halfCard}>
                <Ionicons name="pulse-outline" size={18} color={colors.orange} />
                <Text style={styles.miniLabel}>Peak Window</Text>
                <Text style={styles.miniValue}>{peak}</Text>
              </Card>
            )}
          </View>

          {(report?.activeSubstances.length ?? 0) > 1 && (
            <>
              <Text style={styles.sectionTitle}>Active in Last 48h</Text>
              <Card>
                <Text style={styles.activeText}>
                  {report!.activeSubstances.map((s) => s.name).join(' · ')}
                </Text>
              </Card>
            </>
          )}

          {(report?.interactions.length ?? 0) > 0 && (
            <>
              <Text style={styles.sectionTitle}>Detected Interactions</Text>
              {report!.interactions.map((interaction) => (
                <Card key={interaction.id} variant="alert" style={styles.interactionCard}>
                  <View style={styles.interactionHeader}>
                    <Text style={styles.interactionTitle}>{interaction.title}</Text>
                    <Text
                      style={[
                        styles.interactionRisk,
                        {
                          color: getRiskColor(
                            riskLevelToLabel(interaction.riskLevel) === 'High' ? 85 : 55
                          ),
                        },
                      ]}
                    >
                      {riskLevelToLabel(interaction.riskLevel)}
                    </Text>
                  </View>
                  <Text style={styles.interactionBody}>{interaction.description}</Text>
                  {interaction.advice && (
                    <Text style={styles.interactionAdvice}>{interaction.advice}</Text>
                  )}
                </Card>
              ))}
            </>
          )}

          {(analysis.warnings?.length ?? 0) > 0 && (
            <>
              <Text style={styles.sectionTitle}>Warnings</Text>
              <Card variant="alert">
                {(analysis.warnings ?? []).map((w) => (
                  <Text key={w} style={styles.warningItem}>
                    • {w}
                  </Text>
                ))}
              </Card>
            </>
          )}

          {foodTips.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Food & timing</Text>
              <Card style={styles.foodCard}>
                <Text style={styles.foodLead}>
                  How meals and drinks can affect {intake.substance.name}.
                </Text>
                {foodTips.map((r) => (
                  <View key={r} style={styles.recRow}>
                    <Ionicons name="restaurant-outline" size={16} color={colors.orange} />
                    <Text style={styles.recItem}>{r}</Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          {generalRecs.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              <Card>
                {generalRecs.map((r) => (
                  <View key={r} style={styles.recRow}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                    <Text style={styles.recItem}>{r}</Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          {analysis.aiGenerated && (
            <Text style={styles.aiBadge}>✦ AI-enhanced analysis</Text>
          )}

          <Text style={styles.disclaimer}>{report.disclaimer}</Text>

          <GradientButton
            title="View Effect Timeline"
            onPress={() =>
              router.push({
                pathname: '/effect-timeline',
                params: intakeId ? { intakeId } : {},
              })
            }
          />
          <Pressable onPress={() => router.push('/interaction-check')}>
            <Text style={styles.interactionLink}>Check All Interactions →</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  title: { ...typography.h3, color: colors.text },
  errorText: {
    ...typography.body,
    color: colors.danger,
    lineHeight: 22,
  },
  intakeHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  intakeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intakeMeta: { flex: 1 },
  substanceName: { ...typography.h3, color: colors.text },
  substanceDose: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  purpose: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  gaugeCenter: { alignItems: 'center', paddingVertical: spacing.md },
  summary: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  metaText: { ...typography.caption, color: colors.textMuted },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  impactRow: { marginBottom: spacing.sm },
  impactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  impactLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  impactLabel: { ...typography.body, color: colors.text },
  impactValue: { ...typography.body, fontWeight: '600' },
  twoCol: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfCard: {
    flex: 1,
    gap: spacing.xs,
  },
  miniLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  miniValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  activeText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  interactionCard: { marginBottom: spacing.sm },
  interactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  interactionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  interactionRisk: { ...typography.small, fontWeight: '700' },
  interactionBody: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  interactionAdvice: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  warningItem: {
    ...typography.body,
    color: colors.danger,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  foodCard: {
    borderColor: `${colors.orange}44`,
  },
  foodLead: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  recRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  recItem: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    flex: 1,
  },
  aiBadge: {
    ...typography.caption,
    color: colors.purple,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  disclaimer: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  interactionLink: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: spacing.md,
  },
});
