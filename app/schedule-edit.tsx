import { DatePickerField } from "@/components/ui/DatePickerField";
import { DoseTimesField } from "@/components/ui/DoseTimesField";
import { Field } from "@/components/ui/Field";
import { FilterChips } from "@/components/ui/FilterChips";
import { GradientButton } from "@/components/ui/GradientButton";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useCabinetItem, useSchedules } from "@/hooks/useApi";
import { api } from "@/lib/api";
import {
  cabinetItemLabel,
  deviceTimezone,
  formatTimezoneLabel,
  localDayBounds,
  parseOptionalNumber,
  toDateInputValue,
} from "@/lib/format";
import { syncLocalDoseReminders } from "@/lib/reminders";
import type { ScheduleRecurrence } from "@/types/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

const RECURRENCE_OPTIONS = ["Daily", "Weekdays", "Weekly", "Interval"] as const;
const RECURRENCE_MAP: Record<
  (typeof RECURRENCE_OPTIONS)[number],
  ScheduleRecurrence
> = {
  Daily: "DAILY",
  Weekdays: "WEEKDAYS",
  Weekly: "WEEKLY",
  Interval: "INTERVAL",
};
const RECURRENCE_LABEL: Record<
  ScheduleRecurrence,
  (typeof RECURRENCE_OPTIONS)[number]
> = {
  DAILY: "Daily",
  WEEKDAYS: "Weekdays",
  WEEKLY: "Weekly",
  INTERVAL: "Interval",
};

const LOCAL_TIMEZONE = deviceTimezone();

const TIMEZONE_CHOICES = Array.from(
  new Set([
    LOCAL_TIMEZONE,
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Toronto",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Africa/Lagos",
    "Africa/Johannesburg",
    "Africa/Nairobi",
    "Africa/Accra",
  ]),
);

const WEEKDAY_LABELS = [
  { label: "S", value: 0 },
  { label: "M", value: 1 },
  { label: "T", value: 2 },
  { label: "W", value: 3 },
  { label: "T", value: 4 },
  { label: "F", value: 5 },
  { label: "S", value: 6 },
] as const;

function todayDateInput() {
  return toDateInputValue(new Date().toISOString());
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
    Boolean(cabinetParam) || Boolean(id),
  );
  const existing = useMemo(
    () => (id ? (schedules?.find((s) => s.id === id) ?? null) : null),
    [id, schedules],
  );

  const cabinetItemId = cabinetParam ?? existing?.cabinetItemId;
  const { data: cabinetItem } = useCabinetItem(cabinetItemId);

  const [timezone, setTimezone] = useState(LOCAL_TIMEZONE);
  const [showTimezonePicker, setShowTimezonePicker] = useState(false);
  const [recurrenceLabel, setRecurrenceLabel] =
    useState<(typeof RECURRENCE_OPTIONS)[number]>("Daily");
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [intervalHours, setIntervalHours] = useState("8");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startDate, setStartDate] = useState(todayDateInput());
  const [endDate, setEndDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadedExisting, setLoadedExisting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    if (!existing || loadedExisting) return;
    setTimezone(existing.timezone || LOCAL_TIMEZONE);
    setShowTimezonePicker(
      Boolean(existing.timezone && existing.timezone !== LOCAL_TIMEZONE),
    );
    setRecurrenceLabel(RECURRENCE_LABEL[existing.recurrence] ?? "Daily");
    setTimes(
      (existing.times ?? []).length
        ? [...(existing.times as string[])]
        : ["08:00"],
    );
    setIntervalHours(
      existing.intervalHours != null ? String(existing.intervalHours) : "8",
    );
    setDaysOfWeek(existing.daysOfWeek?.length ? existing.daysOfWeek : [1]);
    setStartDate(toDateInputValue(existing.startDate) || todayDateInput());
    setEndDate(toDateInputValue(existing.endDate));
    setInstructions(existing.instructions ?? "");
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
      setTimezone(found.timezone || LOCAL_TIMEZONE);
      setShowTimezonePicker(
        Boolean(found.timezone && found.timezone !== LOCAL_TIMEZONE),
      );
      setRecurrenceLabel(RECURRENCE_LABEL[found.recurrence] ?? "Daily");
      setTimes(
        (found.times ?? []).length ? [...(found.times as string[])] : ["08:00"],
      );
      setIntervalHours(
        found.intervalHours != null ? String(found.intervalHours) : "8",
      );
      setDaysOfWeek(found.daysOfWeek?.length ? found.daysOfWeek : [1]);
      setStartDate(toDateInputValue(found.startDate) || todayDateInput());
      setEndDate(toDateInputValue(found.endDate));
      setInstructions(found.instructions ?? "");
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
      : "Medication";

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => a - b),
    );
  };

  const handleSave = async () => {
    if (!cabinetItemId) {
      Alert.alert("Missing item", "Open this screen from a cabinet item.");
      return;
    }

    if (recurrence !== "INTERVAL" && times.length === 0) {
      Alert.alert(
        "Add a time",
        "Add at least one dose time for this schedule.",
      );
      return;
    }

    if (recurrence === "WEEKLY" && daysOfWeek.length === 0) {
      Alert.alert(
        "Pick days",
        "Select at least one weekday for a weekly schedule.",
      );
      return;
    }

    if (recurrence === "INTERVAL") {
      const hours = parseOptionalNumber(intervalHours);
      if (hours == null || hours <= 0) {
        Alert.alert(
          "Interval required",
          "Enter interval hours greater than zero.",
        );
        return;
      }
    }

    if (!startDate.trim()) {
      Alert.alert("Start date", "Enter a start date (YYYY-MM-DD).");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        cabinetItemId,
        timezone: timezone.trim() || LOCAL_TIMEZONE,
        recurrence,
        times: recurrence === "INTERVAL" ? times : times,
        intervalHours:
          recurrence === "INTERVAL" ? parseOptionalNumber(intervalHours) : null,
        daysOfWeek: recurrence === "WEEKLY" ? daysOfWeek : null,
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

      if (Platform.OS !== "web" && payload.active) {
        try {
          const bounds = localDayBounds();
          const doses = await api.getDoses({ from: bounds.from, to: bounds.to });
          const result = await syncLocalDoseReminders(doses);
          if (!result.permissionGranted) {
            Alert.alert(
              "Notifications off",
              "Turn on notifications for Dosify in iPhone Settings so dose reminders can appear.",
            );
          } else if (result.scheduled === 0) {
            Alert.alert(
              "Schedule saved",
              "No upcoming dose times were found to remind you about yet. Open Today's doses after the next dose time is created.",
            );
          } else {
            Alert.alert(
              "Reminders set",
              `${result.scheduled} reminder${result.scheduled === 1 ? "" : "s"} scheduled on this device.`,
            );
          }
        } catch {
          // Schedule saved; reminder sync is best-effort.
        }
      }

      router.back();
    } catch (e) {
      Alert.alert(
        "Could not save",
        e instanceof Error ? e.message : "Something went wrong",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      "Delete schedule?",
      "This removes the schedule. Past dose history is kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              await api.deleteSchedule(id);
              router.back();
            } catch (e) {
              Alert.alert(
                "Could not delete",
                e instanceof Error ? e.message : "Something went wrong",
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
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
        title={isEdit ? "Edit schedule" : "New schedule"}
        showBack
        onBack={() => router.back()}
      />

      <Text style={styles.forItem}>For {itemName}</Text>

      <Text style={styles.label}>Recurrence</Text>
      <FilterChips
        options={[...RECURRENCE_OPTIONS]}
        selected={recurrenceLabel}
        onSelect={(v) =>
          setRecurrenceLabel(v as (typeof RECURRENCE_OPTIONS)[number])
        }
      />

      {recurrence === "WEEKLY" && (
        <View style={styles.daysRow}>
          {WEEKDAY_LABELS.map((day) => {
            const on = daysOfWeek.includes(day.value);
            return (
              <Pressable
                key={`${day.label}-${day.value}`}
                onPress={() => toggleDay(day.value)}
                style={[styles.dayChip, on && styles.dayChipOn]}
              >
                <Text style={[styles.dayText, on && styles.dayTextOn]}>
                  {day.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {recurrence === "INTERVAL" ? (
        <Field
          label="Interval (hours)"
          value={intervalHours}
          onChangeText={setIntervalHours}
          keyboardType="numeric"
          placeholder="8"
        />
      ) : null}

      <DoseTimesField
        label={recurrence === "INTERVAL" ? "Anchor times" : "Dose times"}
        value={times}
        onChange={setTimes}
        optional={recurrence === "INTERVAL"}
      />

      <View style={styles.timezoneCard}>
        <View style={styles.timezoneCopy}>
          <Text style={styles.timezoneLabel}>Timezone</Text>
          <Text style={styles.timezoneValue}>
            {timezone === LOCAL_TIMEZONE
              ? `Your local time · ${formatTimezoneLabel(timezone)}`
              : formatTimezoneLabel(timezone)}
          </Text>
          <Text style={styles.timezoneHint}></Text>
        </View>
        <Pressable
          onPress={() => setShowTimezonePicker((open) => !open)}
          hitSlop={8}
        >
          <Text style={styles.timezoneAction}>
            {showTimezonePicker ? "Done" : "Adjust"}
          </Text>
        </Pressable>
      </View>

      {showTimezonePicker && (
        <View style={styles.timezoneList}>
          <Pressable
            style={[
              styles.timezoneOption,
              timezone === LOCAL_TIMEZONE && styles.timezoneOptionOn,
            ]}
            onPress={() => setTimezone(LOCAL_TIMEZONE)}
          >
            <Text
              style={[
                styles.timezoneOptionText,
                timezone === LOCAL_TIMEZONE && styles.timezoneOptionTextOn,
              ]}
            >
              Use my local time · {formatTimezoneLabel(LOCAL_TIMEZONE)}
            </Text>
          </Pressable>
          {TIMEZONE_CHOICES.filter((zone) => zone !== LOCAL_TIMEZONE).map(
            (zone) => {
              const selected = timezone === zone;
              return (
                <Pressable
                  key={zone}
                  style={[
                    styles.timezoneOption,
                    selected && styles.timezoneOptionOn,
                  ]}
                  onPress={() => setTimezone(zone)}
                >
                  <Text
                    style={[
                      styles.timezoneOptionText,
                      selected && styles.timezoneOptionTextOn,
                    ]}
                  >
                    {formatTimezoneLabel(zone)}
                  </Text>
                </Pressable>
              );
            },
          )}
        </View>
      )}

      <DatePickerField
        label="Start date"
        value={startDate}
        onChange={setStartDate}
        placeholder="When does this schedule start?"
        allowClear={false}
      />
      <DatePickerField
        label="End date (optional)"
        value={endDate}
        onChange={setEndDate}
        placeholder="Leave blank for ongoing"
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
        title={
          saving ? "Saving…" : isEdit ? "Save schedule" : "Create schedule"
        }
        onPress={handleSave}
        disabled={saving}
      />

      {isEdit && (
        <GradientButton
          title="Delete schedule"
          variant="danger"
          onPress={handleDelete}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  forItem: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  daysRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  dayChip: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: "700",
  },
  dayTextOn: { color: colors.text },
  timezoneCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  timezoneCopy: {
    flex: 1,
    gap: 4,
  },
  timezoneLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  timezoneValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  timezoneHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  timezoneAction: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  timezoneList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  timezoneOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  timezoneOptionOn: {
    backgroundColor: `${colors.primary}18`,
  },
  timezoneOptionText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  timezoneOptionTextOn: {
    color: colors.primary,
    fontWeight: "700",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  switchLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
});
