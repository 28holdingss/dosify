import DateTimePicker, {
  DateTimePickerEvent,
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/constants/theme';

type DoseTimesFieldProps = {
  label?: string;
  value: string[]; // HH:mm
  onChange: (times: string[]) => void;
  optional?: boolean;
  style?: ViewStyle;
};

const PRESETS = [
  { label: 'Morning', time: '08:00' },
  { label: 'Noon', time: '12:00' },
  { label: 'Evening', time: '20:00' },
  { label: 'Night', time: '22:00' },
] as const;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function toHm(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromHm(value: string): Date {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  const now = new Date();
  if (!match) {
    now.setHours(8, 0, 0, 0);
    return now;
  }
  now.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return now;
}

export function formatHmDisplay(value: string): string {
  return fromHm(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function sortTimes(times: string[]) {
  return [...times].sort((a, b) => a.localeCompare(b));
}

export function DoseTimesField({
  label = 'Dose times',
  value,
  onChange,
  optional = false,
  style,
}: DoseTimesFieldProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState(fromHm('08:00'));

  const sorted = useMemo(() => sortTimes(value), [value]);

  const openPicker = (index: number | null, seed = '08:00') => {
    const base = fromHm(index != null && value[index] ? value[index]! : seed);
    setEditingIndex(index);
    setDraft(base);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: base,
        mode: 'time',
        is24Hour: false,
        onChange: (event, selected) => {
          if (event.type === 'dismissed' || !selected) return;
          commitTime(toHm(selected), index);
        },
      });
      return;
    }

    setOpen(true);
  };

  const commitTime = (hm: string, index: number | null) => {
    if (index == null) {
      if (value.includes(hm)) {
        setOpen(false);
        return;
      }
      onChange(sortTimes([...value, hm]));
    } else {
      const next = [...value];
      next[index] = hm;
      onChange(sortTimes([...new Set(next)]));
    }
    setOpen(false);
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addPreset = (time: string) => {
    if (value.includes(time)) return;
    onChange(sortTimes([...value, time]));
  };

  const handlePickerChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) setDraft(selected);
  };

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optional ? <Text style={styles.optional}>Optional</Text> : null}
      </View>

      {sorted.length === 0 ? (
        <Text style={styles.empty}>
          {optional ? 'No anchor times yet.' : 'Add at least one dose time.'}
        </Text>
      ) : (
        <View style={styles.timesList}>
          {sorted.map((time) => {
            const index = value.indexOf(time);
            return (
              <View key={time} style={styles.timeRow}>
                <Pressable
                  style={styles.timeMain}
                  onPress={() => openPicker(index, time)}
                >
                  <View style={styles.timeIcon}>
                    <Ionicons name="time-outline" size={18} color="#FFFFFF" />
                  </View>
                  <Text style={styles.timeValue}>{formatHmDisplay(time)}</Text>
                  <Text style={styles.timeHint}>Tap to edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => removeAt(index)}
                  hitSlop={8}
                  accessibilityLabel={`Remove ${formatHmDisplay(time)}`}
                >
                  <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.presetRow}>
        {PRESETS.map((preset) => {
          const active = value.includes(preset.time);
          return (
            <Pressable
              key={preset.time}
              style={[styles.presetChip, active && styles.presetChipOn]}
              onPress={() => addPreset(preset.time)}
              disabled={active}
            >
              <Text style={[styles.presetText, active && styles.presetTextOn]}>
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
        onPress={() => openPicker(null, sorted[sorted.length - 1] ?? '08:00')}
      >
        <Ionicons name="add" size={18} color={colors.primary} />
        <Text style={styles.addText}>Add dose time</Text>
      </Pressable>

      {Platform.OS !== 'android' && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
            <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
              <View style={styles.handle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>
                  {editingIndex == null ? 'Add dose time' : 'Edit dose time'}
                </Text>
                <Pressable onPress={() => commitTime(toHm(draft), editingIndex)} hitSlop={8}>
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </View>

              <Text style={styles.preview}>{formatHmDisplay(toHm(draft))}</Text>

              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={draft}
                  mode="time"
                  display="spinner"
                  themeVariant="dark"
                  onChange={handlePickerChange}
                  style={styles.picker}
                />
              ) : (
                <TextInput
                  value={toHm(draft)}
                  onChangeText={(text) => {
                    const match = text.match(/^(\d{1,2}):(\d{2})$/);
                    if (!match) return;
                    const next = fromHm(`${pad(Number(match[1]))}:${match[2]}`);
                    setDraft(next);
                  }}
                  // @ts-expect-error web time input
                  type="time"
                  style={styles.webInput}
                />
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  optional: {
    ...typography.small,
    color: colors.textMuted,
  },
  empty: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  timesList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  timeMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99,102,241,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  timeHint: {
    ...typography.small,
    color: colors.textMuted,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipOn: {
    backgroundColor: `${colors.primary}22`,
    borderColor: colors.primary,
  },
  presetText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  presetTextOn: {
    color: colors.primary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    width: '100%',
    alignSelf: 'center',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  doneText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  preview: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  picker: {
    alignSelf: 'center',
  },
  webInput: {
    ...typography.h3,
    color: colors.text,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});
