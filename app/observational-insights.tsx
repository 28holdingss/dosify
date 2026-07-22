import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { GradientButton } from '@/components/ui/GradientButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, spacing, typography } from '@/constants/theme';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';

export default function ObservationalInsightsScreen() {
  const router = useRouter();
  const { data, loading, error } = useApi(() => api.getObservationalInsights(28), []);

  const premiumBlocked =
    error?.toLowerCase().includes('premium') ||
    (error && error.includes('402'));

  return (
    <Screen>
      <ScreenHeader title="Wearable Insights" showBack onBack={() => router.back()} />

      <Text style={styles.hint}>
        Observational only — associations in your adherence, sleep, heart rate, and symptoms. Not
        causation or medical advice.
      </Text>

      {loading && <ActivityIndicator color={colors.primary} />}
      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>
            {premiumBlocked
              ? 'Dosify Pro unlocks observational wearable insights — sleep, heart rate, and adherence patterns.'
              : error}
          </Text>
          {premiumBlocked ? (
            <GradientButton
              title="See Dosify Pro"
              onPress={() => router.push('/pricing' as never)}
              style={styles.upgradeBtn}
            />
          ) : null}
        </Card>
      ) : null}

      {data ? (
        <>
          <Text style={styles.meta}>
            Window: {data.windowDays} days · Symptom days: {data.symptomDays}
          </Text>
          {data.findings.map((f) => (
            <Card key={f.id} style={styles.card}>
              <Text style={styles.title}>{f.title}</Text>
              <Text style={styles.corr}>
                r = {f.correlation ?? 'n/a'} · n = {f.sampleDays} days
              </Text>
              <Text style={styles.body}>{f.interpretation}</Text>
            </Card>
          ))}
          <Card style={styles.disclaimerCard}>
            <Text style={styles.disclaimer}>{data.disclaimer}</Text>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  errorCard: {
    borderColor: colors.warning,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.caption, color: colors.warning, lineHeight: 18 },
  upgradeBtn: { marginTop: spacing.md, marginVertical: 0 },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  card: { marginBottom: spacing.sm },
  title: { ...typography.body, color: colors.text, fontWeight: '700' },
  corr: { ...typography.caption, color: colors.primary, marginTop: spacing.xs },
  body: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 18 },
  disclaimerCard: {
    marginTop: spacing.md,
    borderColor: colors.border,
    borderWidth: 1,
  },
  disclaimer: { ...typography.caption, color: colors.textMuted, lineHeight: 18 },
});
