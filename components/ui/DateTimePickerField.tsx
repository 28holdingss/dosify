import DateTimePicker, {
  DateTimePickerEvent,
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
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
import { formatIntakeDateTime } from '@/lib/format';

type PickerMode = 'date' | 'time';

type DateTimePickerFieldProps = {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  style?: ViewStyle;
};

const QUICK_OPTIONS = [
  { label: 'Now', offsetMs: 0 },
  { label: '30m ago', offsetMs: 30 * 60 * 1000 },
  { label: '1h ago', offsetMs: 60 * 60 * 1000 },
  { label: '3h ago', offsetMs: 3 * 60 * 60 * 1000 },
] as const;

function clampDate(date: Date, min?: Date, max?: Date) {
  const time = date.getTime();
  if (max && time > max.getTime()) return new Date(max);
  if (min && time < min.getTime()) return new Date(min);
  return date;
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInputValue(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function DateTimePickerField({
  label = 'When did you take it?',
  value,
  onChange,
  maximumDate = new Date(),
  minimumDate,
  style,
}: DateTimePickerFieldProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [mode, setMode] = useState<PickerMode>('date');

  useEffect(() => {
    if (!open) setDraft(value);
  }, [open, value]);

  const applyDraft = () => {
    onChange(clampDate(draft, minimumDate, maximumDate));
    setOpen(false);
  };

  const openAndroidPicker = async () => {
    const base = clampDate(value, minimumDate, maximumDate);

    const dateResult = await new Promise<Date | null>((resolve) => {
      DateTimePickerAndroid.open({
        value: base,
        mode: 'date',
        maximumDate,
        minimumDate,
        onChange: (event, selectedDate) => {
          if (event.type === 'dismissed') resolve(null);
          else resolve(selectedDate ?? base);
        },
      });
    });

    if (!dateResult) return;

    const timeResult = await new Promise<Date | null>((resolve) => {
      DateTimePickerAndroid.open({
        value: dateResult,
        mode: 'time',
        is24Hour: false,
        onChange: (event, selectedDate) => {
          if (event.type === 'dismissed') resolve(null);
          else resolve(selectedDate ?? dateResult);
        },
      });
    });

    if (timeResult) onChange(clampDate(timeResult, minimumDate, maximumDate));
  };

  const handleOpen = () => {
    if (Platform.OS === 'android') {
      void openAndroidPicker();
      return;
    }
    setDraft(clampDate(value, minimumDate, maximumDate));
    setMode('date');
    setOpen(true);
  };

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed' || !selectedDate) return;
    setDraft(clampDate(selectedDate, minimumDate, maximumDate));
  };

  const setQuickTime = (offsetMs: number) => {
    const next = clampDate(new Date(Date.now() - offsetMs), minimumDate, maximumDate);
    onChange(next);
    if (open) setDraft(next);
  };

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable style={styles.field} onPress={handleOpen}>
        <View style={styles.fieldIcon}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.fieldCopy}>
          <Text style={styles.fieldValue}>{formatIntakeDateTime(value)}</Text>
          <Text style={styles.fieldHint}>Tap to change date & time</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <View style={styles.quickRow}>
        {QUICK_OPTIONS.map((option) => (
          <Pressable
            key={option.label}
            style={styles.quickChip}
            onPress={() => setQuickTime(option.offsetMs)}
          >
            <Text style={styles.quickChipText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>

      {Platform.OS !== 'web' && Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
            <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
              <View style={styles.handle} />

              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Date & time</Text>
                <Pressable onPress={applyDraft} hitSlop={8}>
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </View>

              <Text style={styles.preview}>{formatIntakeDateTime(draft)}</Text>

              <View style={styles.segmented}>
                {(['date', 'time'] as PickerMode[]).map((segment) => (
                  <Pressable
                    key={segment}
                    style={[styles.segment, mode === segment && styles.segmentActive]}
                    onPress={() => setMode(segment)}
                  >
                    <Text style={[styles.segmentText, mode === segment && styles.segmentTextActive]}>
                      {segment === 'date' ? 'Date' : 'Time'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.pickerWrap}>
                <DateTimePicker
                  value={draft}
                  mode={mode}
                  display={mode === 'date' ? 'inline' : 'spinner'}
                  themeVariant="dark"
                  maximumDate={mode === 'date' ? maximumDate : undefined}
                  minimumDate={mode === 'date' ? minimumDate : undefined}
                  onChange={handlePickerChange}
                  style={styles.picker}
                />
              </View>

              <View style={styles.sheetQuickRow}>
                {QUICK_OPTIONS.map((option) => (
                  <Pressable
                    key={`sheet-${option.label}`}
                    style={styles.sheetQuickChip}
                    onPress={() => setQuickTime(option.offsetMs)}
                  >
                    <Text style={styles.sheetQuickText}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === 'web' && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
            <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
              <View style={styles.handle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Date & time</Text>
                <Pressable onPress={applyDraft} hitSlop={8}>
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </View>
              <TextInput
                value={toLocalInputValue(draft)}
                onChangeText={(text) => {
                  const parsed = fromLocalInputValue(text);
                  if (parsed) setDraft(clampDate(parsed, minimumDate, maximumDate));
                }}
                // @ts-expect-error web datetime-local
                type="datetime-local"
                max={toLocalInputValue(maximumDate)}
                min={minimumDate ? toLocalInputValue(minimumDate) : undefined}
                style={styles.webInput}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99,102,241,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldCopy: { flex: 1 },
  fieldValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  fieldHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipText: {
    ...typography.caption,
    color: colors.textSecondary,
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
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
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
  },
  doneText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  preview: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: spacing.sm,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.text,
  },
  pickerWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  picker: {
    width: '100%',
  },
  sheetQuickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sheetQuickChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetQuickText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  webInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
});
