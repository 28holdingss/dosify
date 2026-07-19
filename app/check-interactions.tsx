import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '@/components/ui/GradientButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useIntakes, useProfile } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { setLastInteractionCheck } from '@/lib/last-interaction-check';

type SelectableIntake = {
  id: string;
  substanceId: string;
  name: string;
  dose: string;
  selected: boolean;
};

export default function CheckInteractionsScreen() {
  const router = useRouter();
  const { data: intakes, loading } = useIntakes(20);
  const { data: profile } = useProfile();
  const [items, setItems] = useState<SelectableIntake[]>([]);
  const [tab, setTab] = useState('My Current Intakes');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (intakes) {
      const unique = new Map<string, SelectableIntake>();
      for (const i of intakes) {
        if (!unique.has(i.substance.id)) {
          unique.set(i.substance.id, {
            id: i.id,
            substanceId: i.substance.id,
            name: i.substance.name,
            dose: `${i.dose} ${i.unit}`,
            selected: true,
          });
        }
      }
      setItems(Array.from(unique.values()));
    }
  }, [intakes]);

  const toggle = (substanceId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.substanceId === substanceId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleCheck = async () => {
    const selectedIds = items.filter((i) => i.selected).map((i) => i.substanceId);
    if (selectedIds.length < 2) {
      router.push('/check-before-taking' as never);
      return;
    }
    setChecking(true);
    try {
      const result = await api.checkInteractions(selectedIds);
      setLastInteractionCheck({
        interactions: result.interactions,
        count: result.count,
        riskScore: result.riskScore,
      });
      router.push({ pathname: '/interaction-check' as never, params: { fromCheck: '1' } });
    } catch {
      router.push('/interaction-check' as never);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader
        title="Check Interactions"
        showBack
        onBack={() => router.back()}
        rightAction={
          <Pressable
            onPress={() => router.push('/check-before-taking' as never)}
            accessibilityLabel="Check before taking"
            style={styles.headerLink}
          >
            <Text style={styles.headerLinkText}>Before taking</Text>
          </Pressable>
        }
      />

      <View style={styles.tabs}>
        {['My Current Intakes', 'Conditions'].map((t) => (
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

      {tab === 'My Current Intakes' ? (
        items.length > 0 ? (
          items.map((item) => (
            <Pressable
              key={item.substanceId}
              style={styles.itemRow}
              onPress={() => toggle(item.substanceId)}
            >
              <View style={[styles.checkbox, item.selected && styles.checkboxActive]}>
                {item.selected && (
                  <Ionicons name="checkmark" size={14} color={colors.text} />
                )}
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDose}>{item.dose}</Text>
              </View>
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent intakes to check.</Text>
        )
      ) : (
        <View style={styles.conditions}>
          <Text style={styles.conditionItem}>
            • {profile?.healthProfile?.medicalConditions ?? 'No known conditions'}
          </Text>
          <Text style={styles.conditionItem}>
            • Allergies: {profile?.healthProfile?.allergies ?? 'None'}
          </Text>
          <Text style={styles.conditionHint}>
            Update your profile for personalized interaction checks.
          </Text>
        </View>
      )}

      <GradientButton
        title={checking ? 'Checking...' : 'Check Interactions'}
        subtitle="AI will check for potential risks"
        onPress={handleCheck}
        style={{ marginTop: spacing.xl }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerLink: { paddingHorizontal: spacing.xs },
  headerLinkText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemInfo: { flex: 1 },
  itemName: { ...typography.body, color: colors.text, fontWeight: '600' },
  itemDose: { ...typography.caption, color: colors.textMuted },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  conditions: { padding: spacing.lg },
  conditionItem: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  conditionHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
