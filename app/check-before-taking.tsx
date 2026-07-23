import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { GradientButton } from '@/components/ui/GradientButton';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useSubstances } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { riskLevelToLabel } from '@/lib/format';
import { getSubstanceIcon } from '@/lib/substance-icons';
import type { InteractionCheck, Substance } from '@/types/api';

const EMPTY_VERDICT = 'No known major interaction found in checked sources';

function riskBannerLabel(highest: InteractionCheck['highestRisk'], score?: number | null) {
  if (!highest) return EMPTY_VERDICT;
  const label = riskLevelToLabel(highest);
  if (score != null) return `${label} risk · ${score}/100`;
  return `${label} interaction risk found`;
}

export default function CheckBeforeTakingScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Substance[]>([]);
  const [search, setSearch] = useState('');
  const [pickerOpen, setPickerOpen] = useState(true);
  const [includeCabinet, setIncludeCabinet] = useState(true);
  const [includeRecentIntakes, setIncludeRecentIntakes] = useState(true);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<InteractionCheck | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const debouncedSearch = search.trim();
  const { data: searchResults, loading: searching } = useSubstances({
    search: debouncedSearch.length >= 2 ? debouncedSearch : undefined,
    popular: !debouncedSearch && pickerOpen ? true : undefined,
  });

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  const toggleSubstance = (s: Substance) => {
    setResult(null);
    setCheckError(null);
    setSelected((prev) => {
      if (prev.some((p) => p.id === s.id)) {
        return prev.filter((p) => p.id !== s.id);
      }
      return [...prev, s];
    });
  };

  const removeSubstance = (id: string) => {
    setResult(null);
    setCheckError(null);
    setSelected((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCheck = async () => {
    if (selected.length === 0) {
      Alert.alert('Select a substance', 'Search the catalog and pick what you are considering taking.');
      return;
    }

    setChecking(true);
    setCheckError(null);
    try {
      const ids = selected.map((s) => s.id);
      const check = await api.createInteractionCheck({
        substanceId: ids[0],
        substanceIds: ids,
        includeCabinet,
        includeRecentIntakes,
      });
      setResult(check);
      setPickerOpen(false);
    } catch (e) {
      setResult(null);
      setCheckError(e instanceof Error ? e.message : 'Could not run interaction check');
    } finally {
      setChecking(false);
    }
  };

  const findings = result?.findings ?? [];
  const hasFindings = findings.length > 0;
  const highest = result?.highestRisk ?? null;

  return (
    <Screen>
      <ScreenHeader title="Check before taking" showBack onBack={() => router.back()} />

      <Text style={styles.intro}>
        Compare a substance against your Health Cabinet and recent intakes using known interaction
        sources. This is not medical advice.
      </Text>

      <Text style={styles.sectionLabel}>What are you considering?</Text>

      {selected.length > 0 && (
        <View style={styles.chips}>
          {selected.map((s) => {
            const icon = getSubstanceIcon(s.name, s.category?.slug);
            return (
              <Pressable
                key={s.id}
                style={styles.chip}
                onPress={() => removeSubstance(s.id)}
                accessibilityLabel={`Remove ${s.name}`}
              >
                <View style={[styles.chipDot, { backgroundColor: `${icon.color}44` }]}>
                  <Ionicons name={icon.icon} size={12} color={icon.color} />
                </View>
                <Text style={styles.chipText}>{s.name}</Text>
                <Ionicons name="close" size={14} color={colors.textMuted} />
              </Pressable>
            );
          })}
          {!pickerOpen && (
            <Pressable style={styles.addChip} onPress={() => setPickerOpen(true)}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addChipText}>Add</Text>
            </Pressable>
          )}
        </View>
      )}

      {pickerOpen ? (
        <View style={styles.picker}>
          <SearchBar
            placeholder="Search substance catalog…"
            value={search}
            onChangeText={setSearch}
            autoFocus={selected.length === 0}
            style={{ marginBottom: spacing.sm }}
          />
          {searching && (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} />
          )}
          {(searchResults ?? []).slice(0, 12).map((s) => {
            const icon = getSubstanceIcon(s.name, s.category?.slug);
            const isSelected = selectedIds.has(s.id);
            return (
              <Pressable key={s.id} style={styles.searchRow} onPress={() => toggleSubstance(s)}>
                <View style={[styles.iconSm, { backgroundColor: `${icon.color}22` }]}>
                  <Ionicons name={icon.icon} size={18} color={icon.color} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.substanceName}>{s.name}</Text>
                  <Text style={styles.substanceMeta}>{s.category?.name ?? s.defaultUnit}</Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color={colors.text} />}
                </View>
              </Pressable>
            );
          })}
          {selected.length > 0 && (
            <Pressable onPress={() => setPickerOpen(false)} style={styles.cancelPicker}>
              <Text style={styles.cancelPickerText}>Done selecting</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      <View style={styles.switchRow}>
        <View style={styles.switchCopy}>
          <Text style={styles.switchLabel}>Include Health Cabinet</Text>
          <Text style={styles.switchHint}>Your saved medications</Text>
        </View>
        <Switch
          value={includeCabinet}
          onValueChange={(v) => {
            setIncludeCabinet(v);
            setResult(null);
          }}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.text}
        />
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchCopy}>
          <Text style={styles.switchLabel}>Include recent intakes</Text>
          <Text style={styles.switchHint}>Substances logged recently that may still overlap</Text>
        </View>
        <Switch
          value={includeRecentIntakes}
          onValueChange={(v) => {
            setIncludeRecentIntakes(v);
            setResult(null);
          }}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.text}
        />
      </View>

      <GradientButton
        title={checking ? 'Checking…' : 'Run check'}
        subtitle="Against cabinet, intakes, and profile context"
        onPress={handleCheck}
        style={{ marginTop: spacing.md, marginBottom: spacing.lg }}
      />

      {checkError && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>
            {checkError.includes('404') || checkError.toLowerCase().includes('not found')
              ? 'Interaction check API is not available yet. Start the server with Phase 2 routes.'
              : checkError}
          </Text>
        </Card>
      )}

      {result && (
        <>
          <Card variant={hasFindings && highest === 'HIGH' ? 'alert' : 'bordered'}>
            <View style={styles.verdictRow}>
              <Ionicons
                name={hasFindings ? 'warning-outline' : 'information-circle-outline'}
                size={22}
                color={
                  highest === 'HIGH'
                    ? colors.danger
                    : highest === 'MODERATE'
                      ? colors.warning
                      : colors.info
                }
              />
              <View style={styles.verdictCopy}>
                <Text style={styles.verdictTitle}>
                  {hasFindings ? riskBannerLabel(highest, result.riskScore) : EMPTY_VERDICT}
                </Text>
                <Text style={styles.verdictSub}>
                  Checked {result.proposed.map((p) => p.name).join(', ') || 'selection'}
                  {result.context.cabinetCount > 0
                    ? ` · ${result.context.cabinetCount} cabinet`
                    : ''}
                  {result.context.recentIntakeCount > 0
                    ? ` · ${result.context.recentIntakeCount} recent`
                    : ''}
                </Text>
              </View>
            </View>
            {(result.context.allergies || result.context.conditions) && (
              <Text style={styles.contextNote}>
                Profile context
                {result.context.conditions ? `: ${result.context.conditions}` : ''}
                {result.context.allergies
                  ? `${result.context.conditions ? ' ·' : ':'} Allergies ${result.context.allergies}`
                  : ''}
              </Text>
            )}
          </Card>

          {hasFindings ? (
            findings.map((finding, index) => (
              <Card key={`${finding.title}-${index}`} variant="bordered">
                <View style={styles.findingHeader}>
                  <Text style={styles.findingTitle}>{finding.title}</Text>
                  <RiskBadge level={riskLevelToLabel(finding.riskLevel)} />
                </View>
                <Text style={styles.findingDesc}>{finding.description}</Text>
                {finding.advice ? <Text style={styles.advice}>{finding.advice}</Text> : null}
                {finding.source ? (
                  <Text style={styles.source}>Source: {finding.source}</Text>
                ) : null}
              </Card>
            ))
          ) : (
            <Card>
              <Text style={styles.emptyBody}>
                Nothing flagged for this combination in the sources we checked. Unknown or
                unlisted interactions can still exist — ask a clinician when unsure.
              </Text>
            </Card>
          )}

          <Card>
            <Text style={styles.disclaimer}>{result.disclaimer}</Text>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  chipDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  addChipText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  picker: { marginBottom: spacing.lg },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconSm: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  substanceName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  substanceMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
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
  cancelPicker: { paddingVertical: spacing.md },
  cancelPickerText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  switchCopy: { flex: 1, minWidth: 0 },
  switchLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  switchHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  errorCard: {
    borderColor: colors.warning,
    borderWidth: 1,
  },
  errorText: {
    ...typography.caption,
    color: colors.warning,
  },
  verdictRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  verdictCopy: { flex: 1, minWidth: 0 },
  verdictTitle: {
    ...typography.h3,
    color: colors.text,
  },
  verdictSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  contextNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  findingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  findingTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  findingDesc: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  advice: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  source: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
