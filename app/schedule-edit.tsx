import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Field } from '@/components/ui/Field';
import { FilterChips } from '@/components/ui/FilterChips';
import { GradientButton } from '@/components/ui/GradientButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useCabinetItem, useSchedules } from '@/hooks/useApi';
import { api } from '@/lib/api';
import {
  cabinetItemLabel,
  deviceTimezone,
  parseOptionalNumber,
  toDateInputValue,
} from '@/lib/format';
import type { ScheduleRecurrence } from '@/types/api';

const RECURRENCE_OPTIONS = ['Daily', 'Weekdays', 'Weekly', 'Interval'] as const;
const RECURRENCE_MAP: Record<(typeof RECURRENCE_OPTIONS)[number], ScheduleRecurrence> = {
  Daily: 'DAILY',
  Weekdays: 'WEEKDAYS',
  Weekly: 'WEEKLY',
  Interval: 'INTERVAL',
};
const RECURRENCE_LABEL: Record<ScheduleRecurrence, (typeof RECURRENCE_OPTIONS)[number]> = {
  DAILY: 'Daily',
  WEEKDAYS: 'Weekdays',
  WEEKLY: 'Weekly',
  INTERVAL: 'Interval',
};

const WEEKDAY_LABELS = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
] as const;

function todayDateInput() {
  return toDateInputValue(new Date().toISOString());
}

function normalizeTime(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function ScheduleEditScreen() {
  const router = useRouter();
  const { id, cabinetItemId: cabinetParam } = useLocalSearchParams<{
    id?: string;
    cabinetItemId?: string;
  }>();
  const isEdit = Boolean(id);

  const { data: schedules, loading: loadingSchedules } = useSchedules(
    id ? undefined : cabinetParam ? { cabinetItemId: cabinetParam } : undefined,
    Boolean(cabinetParam) || Boolean(id)
  );
  const existing = useMemo(
    () => (id ? schedules?.find((s) => s.id === id) ?? null : null),
    [id, schedules]
  );

  const cabinetItemId = cabinetParam ?? existing?.cabinetItemId;
  const { data: cabinetItem } = useCabinetItem(cabinetItemId);

  const [timezone, setTimezone] = useState(deviceTimezone());
  const [recurrenceLabel, setRecurrenceLabel] =
    useState<(typeof RECURRENCE_OPTIONS)[number]>('Daily');
  const [timesText, setTimesText] = useState('08:00');
  const [intervalHours, setIntervalHours] = useState('8');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startDate, setStartDate] = useState(todayDateInput());
  const [endDate, setEndDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadedExisting, setLoadedExisting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    if (!existing || loadedExisting) return;
    setTimezone(existing.timezone || deviceTimezone());
    setRecurrenceLabel(RECURRENCE_LABEL[existing.recurrence] ?? 'Daily');
    setTimesText((existing.times ?? []).join(', ') || '08:00');
    setIntervalHours(existing.intervalHours != null ? String(existing.intervalHours) : '8');
    setDaysOfWeek(existing.daysOfWeek?.length ? existing.daysOfWeek : [1]);
    setStartDate(toDateInputValue(existing.startDate) || todayDateInput());
    setEndDate(toDateInputValue(existing.endDate));
    setInstructions(existing.instructions ?? '');
    setActive(existing.active);
    setLoadedExisting(true);
  }, [existing, isEdit, loadedExisting]);

  // When editing a single schedule by id, fetch all schedules once to find it
  // if the cabinet-scoped list did not include it yet.
  useEffect(() => {
    if (!isEdit || !id || existing) return;
    let cancelled = false;
    api.getSchedules().then((all) => {
      if (cancelled) return;
      const found = all.find((s) => s.id === id);
      if (!found) return;
      setTimezone(found.timezone || deviceTimezone());
      setRecurrenceLabel(RECURRENCE_LABEL[found.recurrence] ?? 'Daily');
      setTimesText((found.times ?? []).join(', ') || '08:00');
      setIntervalHours(found.intervalHours != null ? String(found.intervalHours) : '8');
      setDaysOfWeek(found.daysOfWeek?.length ? found.daysOfWeek : [1]);
      setStartDate(toDateInputValue(found.startDate) || todayDateInput());
      setEndDate(toDateInputValue(found.endDate));
      setInstructions(found.instructions ?? '');
      setActive(found.active);
      setLoadedExisting(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isEdit, id, existing]);

  const recurrence = RECURRENCE_MAP[recurrenceLabel];
  const itemName = cabinetItem
    ? cabinetItemLabel(cabinetItem)
    : existing?.cabinetItem
      ? cabinetItemLabel(existing.cabinetItem)
      : 'Medication';

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSave = async () => {
    if (!cabinetItemId) {
      Alert.alert('Missing item', 'Open this screen from a cabinet item.');
      return;
    }

    const times = timesText
      .split(/[,;\s]+/)
      .map((t) => normalizeTime(t))
      .filter((t): t is string => Boolean(t));

    if (recurrence !== 'INTERVAL' && times.length === 0) {
      Alert.alert('Add a time', 'Enter at least one time as HH:mm (e.g. 08:00, 20:00).');
      return;
    }

    if (recurrence === 'WEEKLY' && daysOfWeek.length === 0) {
      Alert.alert('Pick days', 'Select at least one weekday for a weekly schedule.');
      return;
    }

    if (recurrence === 'INTERVAL') {
      const hours = parseOptionalNumber(intervalHours);
      if (hours == null || hours <= 0) {
        Alert.alert('Interval required', 'Enter interval hours greater than zero.');
        return;
      }
    }

    if (!startDate.trim()) {
      Alert.alert('Start date', 'Enter a start date (YYYY-MM-DD).');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        cabinetItemId,
        timezone: timezone.trim() || deviceTimezone(),
        recurrence,
        times: recurrence === 'INTERVAL' ? times : times,
        intervalHours:
          recurrence === 'INTERVAL' ? parseOptionalNumber(intervalHours) : null,
        daysOfWeek: recurrence === 'WEEKLY' ? daysOfWeek : null,
        startDate: startDate.trim(),
        endDate: endDate.trim() || null,
        instructions: instructions.trim() || null,
        active,
      };

      if (isEdit && id) {
        await api.updateSchedule(id, {
          timezone: payload.timezone,
          recurrence: payload.recurrence,
          times: payload.times,
          intervalHours: payload.intervalHours,
          daysOfWeek: payload.daysOfWeek,
          startDate: payload.startDate,
          endDate: payload.endDate,
          instructions: payload.instructions,
          active: payload.active,
        });
      } else {
        await api.createSchedule(payload);
      }
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete schedule?', 'This removes the schedule. Past dose history is kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await api.deleteSchedule(id);
            router.back();
          } catch (e) {
            Alert.alert('Could not delete', e instanceof Error ? e.message : 'Something went wrong');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (isEdit && loadingSchedules && !loadedExisting && !existing) {
    return (
      <Screen scroll={false} style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title={isEdit ? 'Edit schedule' : 'New schedule'}
        showBack
        onBack={() => router.back()}
      />

      <Text style={styles.forItem}>For {itemName}</Text>

      <Text style={styles.label}>Recurrence</Text>
      <FilterChips
        options={[...RECURRENCE_OPTIONS]}
        selected={recurrenceLabel}
        onSelect={(v) => setRecurrenceLabel(v as (typeof RECURRENCE_OPTIONS)[number])}
      />

      {recurrence === 'WEEKLY' && (
        <View style={styles.daysRow}>
          {WEEKDAY_LABELS.map((day) => {
            const on = daysOfWeek.includes(day.value);
            return (
              <Pressable
                key={`${day.label}-${day.value}`}
                onPress={() => toggleDay(day.value)}
                style={[styles.dayChip, on && styles.dayChipOn]}
              >
                <Text style={[styles.dayText, on && styles.dayTextOn]}>{day.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {recurrence === 'INTERVAL' ? (
        <Field
          label="Interval (hours)"
          value={intervalHours}
          onChangeText={setIntervalHours}
          keyboardType="numeric"
          placeholder="8"
        />
      ) : null}

      <Field
        label={recurrence === 'INTERVAL' ? 'Anchor times (optional, HH:mm)' : 'Times (HH:mm)'}
        value={timesText}
        onChangeText={setTimesText}
        placeholder="08:00, 20:00"
        autoCapitalize="none"
      />

      <Field
        label="Timezone"
        value={timezone}
        onChangeText={setTimezone}
        placeholder={deviceTimezone()}
        autoCapitalize="none"
      />

      <Field
        label="Start date (YYYY-MM-DD)"
        value={startDate}
        onChangeText={setStartDate}
        autoCapitalize="none"
      />
      <Field
        label="End date (optional)"
        value={endDate}
        onChangeText={setEndDate}
        placeholder="Leave blank for ongoing"
        autoCapitalize="none"
      />
      <Field
        label="Instructions"
        value={instructions}
        onChangeText={setInstructions}
        placeholder="Optional notes for this schedule"
        multiline
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Schedule active</Text>
        <Switch
          value={active}
          onValueChange={setActive}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>

      <GradientButton
        title={saving ? 'Saving…' : isEdit ? 'Save schedule' : 'Create schedule'}
        onPress={handleSave}
        disabled={saving}
      />

      {isEdit && (
        <GradientButton title="Delete schedule" variant="danger" onPress={handleDelete} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  forItem: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  daysRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  dayChip: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  dayTextOn: { color: colors.text },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  switchLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});
