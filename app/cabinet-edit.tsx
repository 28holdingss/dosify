import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Field } from '@/components/ui/Field';
import { GradientButton } from '@/components/ui/GradientButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useCabinetItem, useSchedules, useSubstances } from '@/hooks/useApi';
import { api } from '@/lib/api';
import {
  cabinetItemLabel,
  formatRecurrenceLabel,
  parseOptionalNumber,
  toDateInputValue,
} from '@/lib/format';
import { getSubstanceIcon } from '@/lib/substance-icons';
import type { Substance } from '@/types/api';

export default function CabinetEditScreen() {
  const router = useRouter();
  const { id, substanceId: substanceIdParam, displayName: displayNameParam } = useLocalSearchParams<{
    id?: string;
    substanceId?: string;
    displayName?: string;
  }>();
  const isEdit = Boolean(id);

  const { data: existing, loading: loadingItem, error: itemError, refetch } = useCabinetItem(
    isEdit ? id : undefined
  );
  const { data: schedules, refetch: refetchSchedules } = useSchedules(
    isEdit && id ? { cabinetItemId: id } : undefined,
    isEdit && Boolean(id)
  );

  const [substance, setSubstance] = useState<Substance | null>(null);
  const [search, setSearch] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [doseValue, setDoseValue] = useState('');
  const [doseUnit, setDoseUnit] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [refillDate, setRefillDate] = useState('');
  const [prescriber, setPrescriber] = useState('');
  const [instructions, setInstructions] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(!isEdit);

  const debouncedSearch = search.trim();
  const { data: searchResults, loading: searching } = useSubstances({
    search: debouncedSearch.length >= 2 ? debouncedSearch : undefined,
    popular: !debouncedSearch && pickerOpen ? true : undefined,
  });

  useFocusEffect(
    useCallback(() => {
      if (isEdit) {
        refetch();
        refetchSchedules();
      }
    }, [isEdit, refetch, refetchSchedules])
  );

  useEffect(() => {
    if (!existing) return;
    setSubstance(existing.substance ?? null);
    setDisplayName(existing.displayName ?? '');
    setDoseValue(existing.doseValue != null ? String(existing.doseValue) : '');
    setDoseUnit(existing.doseUnit ?? existing.substance?.defaultUnit ?? '');
    setQuantity(existing.quantity != null ? String(existing.quantity) : '');
    setExpirationDate(toDateInputValue(existing.expirationDate));
    setRefillDate(toDateInputValue(existing.refillDate));
    setPrescriber(existing.prescriber ?? '');
    setInstructions(existing.instructions ?? '');
    setActive(existing.active);
    setPickerOpen(false);
  }, [existing]);

  useEffect(() => {
    if (!substanceIdParam || isEdit) return;
    let cancelled = false;
    api.getSubstance(substanceIdParam).then((s) => {
      if (cancelled) return;
      setSubstance(s);
      setDoseUnit(s.defaultUnit ?? '');
      if (typeof displayNameParam === 'string' && displayNameParam.trim()) {
        setDisplayName(displayNameParam.trim());
      }
      setPickerOpen(false);
    });
    return () => {
      cancelled = true;
    };
  }, [substanceIdParam, displayNameParam, isEdit]);

  const selectSubstance = (s: Substance) => {
    setSubstance(s);
    if (!doseUnit) setDoseUnit(s.defaultUnit ?? '');
    setPickerOpen(false);
    setSearch('');
  };

  const title = isEdit ? 'Edit cabinet item' : 'Add to cabinet';

  const scheduleList = useMemo(() => schedules ?? existing?.schedules ?? [], [schedules, existing]);

  const handleSave = async () => {
    if (!substance?.id) {
      Alert.alert('Pick a substance', 'Search the catalog and select what you keep in your cabinet.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        substanceId: substance.id,
        displayName: displayName.trim() || null,
        doseValue: parseOptionalNumber(doseValue),
        doseUnit: doseUnit.trim() || null,
        quantity: parseOptionalNumber(quantity),
        expirationDate: expirationDate.trim() || null,
        refillDate: refillDate.trim() || null,
        prescriber: prescriber.trim() || null,
        instructions: instructions.trim() || null,
        active,
      };

      if (isEdit && id) {
        await api.updateCabinetItem(id, payload);
        router.back();
      } else {
        const created = await api.createCabinetItem(payload);
        router.replace({ pathname: '/cabinet-edit' as never, params: { id: created.id } });
      }
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    const name = cabinetItemLabel({ displayName, substance });
    Alert.alert('Remove from cabinet?', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await api.deleteCabinetItem(id);
            router.back();
          } catch (e) {
            Alert.alert('Could not remove', e instanceof Error ? e.message : 'Something went wrong');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (isEdit && loadingItem && !existing) {
    return (
      <Screen scroll={false} style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </Screen>
    );
  }

  if (isEdit && itemError && !existing) {
    return (
      <Screen>
        <ScreenHeader title={title} showBack onBack={() => router.back()} />
        <Text style={styles.errorText}>Could not load this cabinet item.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={title} showBack onBack={() => router.back()} />

      <Text style={styles.sectionLabel}>Substance</Text>
      {substance && !pickerOpen ? (
        <Pressable style={styles.substanceCard} onPress={() => setPickerOpen(true)}>
          {(() => {
            const icon = getSubstanceIcon(substance.name, substance.category?.slug);
            return (
              <>
                <View style={[styles.icon, { backgroundColor: `${icon.color}22` }]}>
                  <Ionicons name={icon.icon} size={22} color={icon.color} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.substanceName}>{substance.name}</Text>
                  <Text style={styles.substanceMeta}>
                    {substance.category?.name ?? substance.defaultUnit} · Tap to change
                  </Text>
                </View>
                <Ionicons name="swap-horizontal" size={18} color={colors.textMuted} />
              </>
            );
          })()}
        </Pressable>
      ) : (
        <View style={styles.picker}>
          <SearchBar
            placeholder="Search substance catalog…"
            value={search}
            onChangeText={setSearch}
            autoFocus={!substance}
            style={{ marginBottom: spacing.sm }}
          />
          {searching && (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} />
          )}
          {(searchResults ?? []).slice(0, 12).map((s) => {
            const icon = getSubstanceIcon(s.name, s.category?.slug);
            return (
              <Pressable key={s.id} style={styles.searchRow} onPress={() => selectSubstance(s)}>
                <View style={[styles.iconSm, { backgroundColor: `${icon.color}22` }]}>
                  <Ionicons name={icon.icon} size={18} color={icon.color} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.substanceName}>{s.name}</Text>
                  <Text style={styles.substanceMeta}>{s.category?.name ?? s.defaultUnit}</Text>
                </View>
              </Pressable>
            );
          })}
          {substance && (
            <Pressable onPress={() => setPickerOpen(false)} style={styles.cancelPicker}>
              <Text style={styles.cancelPickerText}>Keep current selection</Text>
            </Pressable>
          )}
        </View>
      )}

      <Field
        label="Display name (optional)"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder={substance?.name ?? 'e.g. Morning vitamin D'}
      />
      <View style={styles.row2}>
        <Field
          label="Dose / strength"
          value={doseValue}
          onChangeText={setDoseValue}
          placeholder="500"
          keyboardType="numeric"
          style={styles.flex}
        />
        <Field
          label="Unit"
          value={doseUnit}
          onChangeText={setDoseUnit}
          placeholder="mg"
          style={styles.flex}
        />
      </View>
      <Field
        label="Quantity on hand"
        value={quantity}
        onChangeText={setQuantity}
        placeholder="30"
        keyboardType="numeric"
      />
      <Field
        label="Expiration (YYYY-MM-DD)"
        value={expirationDate}
        onChangeText={setExpirationDate}
        placeholder="2027-01-15"
        autoCapitalize="none"
      />
      <Field
        label="Refill date (YYYY-MM-DD)"
        value={refillDate}
        onChangeText={setRefillDate}
        placeholder="2026-08-01"
        autoCapitalize="none"
      />
      <Field
        label="Prescriber"
        value={prescriber}
        onChangeText={setPrescriber}
        placeholder="Optional"
      />
      <Field
        label="Instructions"
        value={instructions}
        onChangeText={setInstructions}
        placeholder="Take with food"
        multiline
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Active in cabinet</Text>
        <Switch
          value={active}
          onValueChange={setActive}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>

      <GradientButton
        title={saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add to cabinet'}
        onPress={handleSave}
        disabled={saving}
      />

      {isEdit && id && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Schedules</Text>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/schedule-edit' as never, params: { cabinetItemId: id } })
              }
            >
              <Text style={styles.link}>Add</Text>
            </Pressable>
          </View>
          {scheduleList.length === 0 ? (
            <Text style={styles.emptySchedules}>No schedules yet. Add times to track doses.</Text>
          ) : (
            scheduleList.map((sched) => (
              <Pressable
                key={sched.id}
                style={styles.scheduleRow}
                onPress={() =>
                  router.push({
                    pathname: '/schedule-edit' as never,
                    params: { id: sched.id, cabinetItemId: id },
                  })
                }
              >
                <View style={styles.info}>
                  <Text style={styles.substanceName}>
                    {formatRecurrenceLabel(sched.recurrence, {
                      intervalHours: sched.intervalHours,
                      daysOfWeek: sched.daysOfWeek,
                      times: sched.times,
                    })}
                  </Text>
                  <Text style={styles.substanceMeta}>
                    {sched.timezone}
                    {!sched.active ? ' · Inactive' : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            ))
          )}

          <GradientButton title="Remove from cabinet" variant="danger" onPress={handleDelete} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: {
    ...typography.caption,
    color: colors.warning,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  substanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
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
  cancelPicker: { paddingVertical: spacing.md },
  cancelPickerText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
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
  row2: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  link: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  emptySchedules: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
});
