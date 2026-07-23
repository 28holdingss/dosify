import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/constants/theme';

type DatePickerFieldProps = {
  label: string;
  value: string; // YYYY-MM-DD or ''
  onChange: (value: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  allowClear?: boolean;
  style?: ViewStyle;
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function toYmd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseYmd(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDisplay(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function buildMonthCells(month: Date): Array<Date | null> {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isDisabled(date: Date, min?: Date, max?: Date) {
  const t = startOfDay(date).getTime();
  if (min && t < startOfDay(min).getTime()) return true;
  if (max && t > startOfDay(max).getTime()) return true;
  return false;
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Tap to choose a date',
  minimumDate,
  maximumDate,
  allowClear = true,
  style,
}: DatePickerFieldProps) {
  const insets = useSafeAreaInsets();
  const selected = parseYmd(value);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    () => selected ?? startOfDay(new Date())
  );
  const [draft, setDraft] = useState<Date | null>(selected);

  useEffect(() => {
    if (!open) return;
    const next = selected ?? startOfDay(new Date());
    setDraft(selected);
    setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  }, [open, selected]);

  const cells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth]);
  const today = startOfDay(new Date());

  const shiftMonth = (delta: number) => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + delta, 1)
    );
  };

  const apply = () => {
    if (draft) onChange(toYmd(draft));
    setOpen(false);
  };

  const clear = () => {
    onChange('');
    setDraft(null);
    setOpen(false);
  };

  const quickOptions = useMemo(() => {
    const base = startOfDay(new Date());
    return [
      { label: 'Today', date: base },
      {
        label: '+30 days',
        date: new Date(base.getFullYear(), base.getMonth(), base.getDate() + 30),
      },
      {
        label: '+90 days',
        date: new Date(base.getFullYear(), base.getMonth(), base.getDate() + 90),
      },
      {
        label: '+1 year',
        date: new Date(base.getFullYear() + 1, base.getMonth(), base.getDate()),
      },
    ].filter((option) => !isDisabled(option.date, minimumDate, maximumDate));
  }, [minimumDate, maximumDate]);

  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.fieldIcon}>
          <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.fieldCopy}>
          <Text style={[styles.fieldValue, !selected && styles.fieldPlaceholder]}>
            {selected ? formatDisplay(selected) : placeholder}
          </Text>
          <Text style={styles.fieldHint}>
            {selected ? 'Tap to change' : 'Open calendar'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
            <View style={styles.handle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={apply} hitSlop={8} disabled={!draft && !allowClear}>
                <Text style={[styles.doneText, !draft && !value && styles.doneDisabled]}>
                  Done
                </Text>
              </Pressable>
            </View>

            <Text style={styles.preview}>
              {draft ? formatDisplay(draft) : 'No date selected'}
            </Text>

            <View style={styles.monthNav}>
              <Pressable
                onPress={() => shiftMonth(-1)}
                style={styles.monthBtn}
                accessibilityLabel="Previous month"
              >
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </Pressable>
              <Text style={styles.monthLabel}>{monthLabel(visibleMonth)}</Text>
              <Pressable
                onPress={() => shiftMonth(1)}
                style={styles.monthBtn}
                accessibilityLabel="Next month"
              >
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((day) => (
                <Text key={day} style={styles.weekday}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }
                const disabled = isDisabled(date, minimumDate, maximumDate);
                const selectedDay = draft ? sameDay(date, draft) : false;
                const isToday = sameDay(date, today);
                return (
                  <Pressable
                    key={toYmd(date)}
                    disabled={disabled}
                    onPress={() => setDraft(date)}
                    style={[
                      styles.dayCell,
                      selectedDay && styles.daySelected,
                      isToday && !selectedDay && styles.dayToday,
                      disabled && styles.dayDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selectedDay && styles.dayTextSelected,
                        disabled && styles.dayTextDisabled,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.quickRow}>
              {quickOptions.map((option) => (
                <Pressable
                  key={option.label}
                  style={styles.quickChip}
                  onPress={() => {
                    setDraft(option.date);
                    setVisibleMonth(
                      new Date(option.date.getFullYear(), option.date.getMonth(), 1)
                    );
                  }}
                >
                  <Text style={styles.quickChipText}>{option.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.footerRow}>
              {allowClear ? (
                <Pressable onPress={clear} hitSlop={8}>
                  <Text style={styles.clearText}>Clear date</Text>
                </Pressable>
              ) : (
                <View />
              )}
              <Pressable
                style={[styles.confirmBtn, !draft && styles.confirmBtnDisabled]}
                onPress={apply}
                disabled={!draft}
              >
                <Text style={styles.confirmText}>Use date</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
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
  fieldPressed: {
    opacity: 0.9,
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
  fieldPlaceholder: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  fieldHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
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
  doneDisabled: {
    opacity: 0.4,
  },
  preview: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dayDisabled: {
    opacity: 0.35,
  },
  dayText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: colors.textMuted,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  clearText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
