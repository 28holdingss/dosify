import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/FilterChips';
import { GradientButton } from '@/components/ui/GradientButton';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, spacing, typography } from '@/constants/theme';
import { useInteractions } from '@/hooks/useApi';
import { riskLevelToLabel } from '@/lib/format';
import {
  getLastInteractionCheck,
  highestRiskFromFindings,
} from '@/lib/last-interaction-check';

const EMPTY_VERDICT = 'No known major interaction found in checked sources';

export default function InteractionCheckScreen() {
  const router = useRouter();
  const { fromCheck } = useLocalSearchParams<{ fromCheck?: string }>();
  const [tab, setTab] = useState('With Other Substances');
  const { data: interactions, loading, error } = useInteractions();

  const lastCheck = useMemo(() => {
    if (fromCheck !== '1') return null;
    return getLastInteractionCheck();
  }, [fromCheck]);

  const checkFindings = lastCheck?.interactions ?? null;
  const usingCheckResults = Boolean(checkFindings);

  const displayItems = usingCheckResults
    ? (checkFindings ?? []).map((item, index) => ({
        id: `check-${index}`,
        title: item.title,
        riskLevel: item.riskLevel,
        description: item.description,
        advice: item.advice ?? null,
      }))
    : (interactions ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        riskLevel: item.riskLevel,
        description: item.description,
        advice: item.advice,
      }));

  const highCount = displayItems.filter((i) => i.riskLevel === 'HIGH').length;
  const total = displayItems.length;
  const highest = highestRiskFromFindings(displayItems);

  return (
    <Screen>
      <ScreenHeader
        title="Interaction Check"
        showBack
        onBack={() => router.back()}
      />

      {!usingCheckResults && loading && <ActivityIndicator color={colors.primary} />}
      {!usingCheckResults && error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>Could not load interactions. Is the API running?</Text>
        </Card>
      )}

      {total > 0 ? (
        <Card variant="alert">
          <View style={styles.alertBanner}>
            <Ionicons name="warning" size={24} color={colors.danger} />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {highCount > 0 ? 'High' : highest === 'MODERATE' ? 'Moderate' : 'Low'} Interaction
                Risk
              </Text>
              <Text style={styles.alertSub}>
                {total} interaction{total === 1 ? '' : 's'} detected
                {lastCheck?.riskScore != null ? ` · ${lastCheck.riskScore}/100` : ''}
              </Text>
            </View>
          </View>
        </Card>
      ) : (
        !loading && (
          <Card variant="bordered">
            <Text style={styles.emptyVerdict}>{EMPTY_VERDICT}</Text>
            <Text style={styles.emptyText}>
              Nothing flagged in checked sources for this selection. Unknown interactions can still
              exist.
            </Text>
          </Card>
        )
      )}

      <FilterChips
        options={['With Other Substances', 'With Conditions']}
        selected={tab}
        onSelect={setTab}
      />

      {tab === 'With Other Substances' ? (
        displayItems.length > 0 ? (
          displayItems.map((item) => (
            <Card key={item.id} variant="bordered">
              <View style={styles.interactionHeader}>
                <Text style={styles.interactionName}>{item.title}</Text>
                <RiskBadge level={riskLevelToLabel(item.riskLevel)} />
              </View>
              <Text style={styles.interactionDesc}>{item.description}</Text>
              {item.advice && <Text style={styles.advice}>{item.advice}</Text>}
            </Card>
          ))
        ) : (
          !loading && (
            <Card>
              <Text style={styles.emptyText}>{EMPTY_VERDICT}</Text>
            </Card>
          )
        )
      ) : (
        <Card>
          <Text style={styles.interactionDesc}>
            Condition-based checks will use your health profile once fully configured. Try{' '}
            Check before taking for cabinet and recent-intake context.
          </Text>
        </Card>
      )}

      <Card>
        <Text style={styles.adviceTitle}>General Advice</Text>
        <Text style={styles.adviceText}>
          Avoid combining NSAIDs with alcohol. Space out medications by at least 4 hours. Consult
          your doctor if symptoms persist.
        </Text>
      </Card>

      <GradientButton
        title="Check before taking"
        onPress={() => router.push('/check-before-taking' as never)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorCard: {
    borderColor: colors.warning,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.warning,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  alertContent: { flex: 1 },
  alertTitle: {
    ...typography.h3,
    color: colors.danger,
  },
  alertSub: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  interactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  interactionName: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  interactionDesc: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  advice: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  adviceTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  adviceText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emptyVerdict: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
