import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { GradientButton } from '@/components/ui/GradientButton';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, spacing, typography } from '@/constants/theme';
import { useSubstanceKnowledge } from '@/hooks/useApi';
import { riskLevelToLabel } from '@/lib/format';

export default function MedicineInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ substanceId?: string }>();
  const substanceId = typeof params.substanceId === 'string' ? params.substanceId : undefined;
  const { data, loading, error } = useSubstanceKnowledge(substanceId);

  return (
    <Screen>
      <ScreenHeader title="Medicine info" showBack onBack={() => router.back()} />

      {!substanceId && (
        <Card>
          <Text style={styles.body}>No substance selected.</Text>
        </Card>
      )}

      {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />}

      {error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      {data && (
        <>
          <Text style={styles.title}>{data.substance.name}</Text>
          <Text style={styles.meta}>
            {data.substance.category.name}
            {data.profile?.drugClass ? ` · ${data.profile.drugClass}` : ''}
          </Text>

          {data.plainLanguageSummary ? (
            <Card style={{ marginTop: spacing.lg }}>
              <Text style={styles.sectionLabel}>Overview</Text>
              <Text style={styles.body}>{data.plainLanguageSummary}</Text>
              {data.aiGenerated ? (
                <Text style={styles.aiNote}>Plain-language summary assisted by AI from catalog facts.</Text>
              ) : null}
            </Card>
          ) : null}

          {data.substance.description ? (
            <Card style={{ marginTop: spacing.md }}>
              <Text style={styles.sectionLabel}>Catalog description</Text>
              <Text style={styles.body}>{data.substance.description}</Text>
            </Card>
          ) : null}

          {data.profile && (
            <Card style={{ marginTop: spacing.md }}>
              <Text style={styles.sectionLabel}>Catalog profile</Text>
              {data.profile.halfLifeHours != null && (
                <Text style={styles.body}>Half-life (catalog): ~{data.profile.halfLifeHours}h</Text>
              )}
              {data.profile.typicalDurationMinHours != null &&
                data.profile.typicalDurationMaxHours != null && (
                  <Text style={styles.body}>
                    Typical duration window: {data.profile.typicalDurationMinHours}–
                    {data.profile.typicalDurationMaxHours}h
                  </Text>
                )}
              {data.substance.minDose != null && data.substance.maxDose != null && (
                <Text style={styles.body}>
                  Catalog dose range (not a prescription): {data.substance.minDose}–
                  {data.substance.maxDose} {data.substance.defaultUnit}
                </Text>
              )}
            </Card>
          )}

          <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>
            Interaction considerations
          </Text>
          {data.considerations.length === 0 ? (
            <Card>
              <Text style={styles.body}>
                No known major interaction rules matched this substance in the checked catalog
                sources.
              </Text>
            </Card>
          ) : (
            data.considerations.map((item, index) => (
              <Card key={`${item.title}-${index}`} style={{ marginBottom: spacing.sm }}>
                <View style={styles.row}>
                  <Text style={styles.considerTitle}>{item.title}</Text>
                  <RiskBadge level={riskLevelToLabel(item.riskLevel)} />
                </View>
                <Text style={styles.body}>{item.description}</Text>
                {item.advice ? <Text style={styles.advice}>{item.advice}</Text> : null}
                {item.source ? <Text style={styles.source}>Source: {item.source}</Text> : null}
              </Card>
            ))
          )}

          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.disclaimer}>{data.disclaimer}</Text>
          </Card>

          <GradientButton
            title="Check before taking"
            onPress={() => router.push('/check-before-taking' as never)}
            style={{ marginTop: spacing.lg }}
          />
          <Pressable
            style={styles.link}
            onPress={() =>
              router.push({
                pathname: '/cabinet-edit',
                params: { substanceId: data.substance.id },
              } as never)
            }
          >
            <Ionicons name="medkit-outline" size={18} color={colors.primary} />
            <Text style={styles.linkText}>Save to Health Cabinet</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h2,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  aiNote: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  considerTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  advice: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  source: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  errorCard: {
    borderColor: colors.warning,
    borderWidth: 1,
  },
  errorText: {
    ...typography.caption,
    color: colors.warning,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  linkText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
