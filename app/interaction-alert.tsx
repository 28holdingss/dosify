import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { GradientButton } from '@/components/ui/GradientButton';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, spacing, typography } from '@/constants/theme';
import { useInteractions } from '@/hooks/useApi';
import { riskLevelToLabel } from '@/lib/format';
import { api } from '@/lib/api';

export default function InteractionAlertScreen() {
  const router = useRouter();
  const [tab, setTab] = useState('Details');
  const { data: interactions, loading, error } = useInteractions();

  const topRisk = interactions?.some((i) => i.riskLevel === 'HIGH')
    ? 'Moderate Interaction Detected'
    : interactions?.length
      ? 'Interaction Detected'
      : 'No Interactions';

  return (
    <Screen>
      <ScreenHeader
        title="Interaction Alert"
        showBack
        onBack={() => router.back()}
      />

      {loading && <ActivityIndicator color={colors.primary} />}
      {error && (
        <Text style={styles.errorText}>Could not load interaction details.</Text>
      )}

      <View style={styles.warningHeader}>
        <View style={styles.warningIcon}>
          <Ionicons name="warning" size={36} color={colors.danger} />
        </View>
        <Text style={styles.warningTitle}>{topRisk}</Text>
        <Text style={styles.warningSub}>
          Review the details below and take recommended precautions.
        </Text>
      </View>

      <View style={styles.tabs}>
        {['Details', 'What You Can Do'].map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'Details' ? (
        interactions && interactions.length > 0 ? (
          interactions.map((item) => (
            <Card key={item.id} variant="bordered">
              <View style={styles.cardHeader}>
                <Text style={styles.pairName}>{item.title}</Text>
                <RiskBadge level={riskLevelToLabel(item.riskLevel)} />
              </View>
              <Text style={styles.cardDesc}>{item.description}</Text>
            </Card>
          ))
        ) : (
          !loading && (
            <Card>
              <Text style={styles.cardDesc}>No active interaction alerts.</Text>
            </Card>
          )
        )
      ) : (
        <Card>
          {(interactions ?? []).map((item) =>
            item.advice ? (
              <Text key={item.id} style={styles.adviceItem}>
                • {item.advice}
              </Text>
            ) : null
          )}
          <Text style={styles.adviceItem}>
            • Contact your doctor if you experience unusual symptoms
          </Text>
        </Card>
      )}

      <GradientButton
        title="View All Interactions"
        onPress={() => router.push('/interaction-check')}
      />
      <Pressable
        style={styles.snooze}
        onPress={async () => {
          const first = interactions?.[0];
          if (first) {
            try {
              await api.snoozeInteraction(first.id);
            } catch {
              // non-blocking
            }
          }
          router.back();
        }}
      >
        <Text style={styles.snoozeText}>Snooze Alert</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorText: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.md,
  },
  warningHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  warningIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  warningTitle: {
    ...typography.h2,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  warningSub: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  pairName: { ...typography.h3, color: colors.text, flex: 1, marginRight: spacing.sm },
  cardDesc: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  adviceItem: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 28,
  },
  snooze: { alignItems: 'center', paddingVertical: spacing.md },
  snoozeText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
