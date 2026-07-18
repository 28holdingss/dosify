import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { GradientButton } from '@/components/ui/GradientButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useIntakeCalendar } from '@/hooks/useApi';
import { monthKey, monthLabel } from '@/lib/format';
import type { IntakeLog } from '@/types/api';

function getDayDots(intakes: IntakeLog[]) {
  const dots: string[] = [];
  const hasHighRisk = intakes.some((i) => (i.analysis?.overallScore ?? 0) >= 70);
  const hasModerate = intakes.some(
    (i) => (i.analysis?.overallScore ?? 0) >= 40 && (i.analysis?.overallScore ?? 0) < 70
  );
  const hasMedicine = intakes.some((i) =>
    ['prescription', 'otc', 'vitamins'].includes(i.substance.category?.slug ?? '')
  );
  const hasAlcohol = intakes.some((i) => i.substance.category?.slug === 'alcohol');

  if (hasHighRisk) dots.push(colors.danger);
  else if (hasModerate) dots.push(colors.warning);
  else if (intakes.length > 0) dots.push(colors.success);
  if (hasMedicine) dots.push(colors.blue);
  if (hasAlcohol) dots.push(colors.purple);

  return dots.length > 0 ? dots.slice(0, 3) : [];
}

function summarizeDay(intakes: IntakeLog[]) {
  const substances = intakes.filter(
    (i) => !['prescription', 'otc', 'vitamins'].includes(i.substance.category?.slug ?? '')
  ).length;
  const medicines = intakes.filter((i) =>
    ['prescription', 'otc', 'vitamins'].includes(i.substance.category?.slug ?? '')
  ).length;
  const alcohol = intakes.filter((i) => i.substance.category?.slug === 'alcohol').length;

  const parts: string[] = [];
  if (substances > 0) parts.push(`${substances} substance${substances === 1 ? '' : 's'}`);
  if (medicines > 0) parts.push(`${medicines} medicine${medicines === 1 ? '' : 's'}`);
  if (alcohol > 0) parts.push(`${alcohol} alcohol`);

  return parts.length > 0 ? parts.join(' · ') : 'No intakes logged';
}

export default function SubstanceCalendarScreen() {
  const router = useRouter();
  const [monthDate, setMonthDate] = useState(new Date());
  const [selected, setSelected] = useState(new Date().getDate());

  const month = monthKey(monthDate);
  const { data: intakes, loading, error } = useIntakeCalendar(month);

  const intakesByDay = useMemo(() => {
    const map = new Map<number, IntakeLog[]>();
    for (const intake of intakes ?? []) {
      const day = new Date(intake.takenAt).getDate();
      const list = map.get(day) ?? [];
      list.push(intake);
      map.set(day, list);
    }
    return map;
  }, [intakes]);

  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedIntakes = intakesByDay.get(selected) ?? [];

  const shiftMonth = (delta: number) => {
    const next = new Date(monthDate);
    next.setMonth(next.getMonth() + delta);
    setMonthDate(next);
    setSelected(1);
  };

  return (
    <Screen>
      <ScreenHeader
        title="Substance Calendar"
        showBack
        onBack={() => router.back()}
      />

      {loading && <ActivityIndicator color={colors.primary} />}
      {error && (
        <Text style={styles.errorText}>Could not load calendar data.</Text>
      )}

      <Card>
        <View style={styles.monthHeader}>
          <Pressable onPress={() => shiftMonth(-1)}>
            <Text style={styles.navArrow}>‹</Text>
          </Pressable>
          <Text style={styles.monthTitle}>{monthLabel(monthDate)}</Text>
          <Pressable onPress={() => shiftMonth(1)}>
            <Text style={styles.navArrow}>›</Text>
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {weekDays.map((d) => (
            <Text key={d} style={styles.weekDay}>{d}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((day, i) => {
            const dayIntakes = day ? intakesByDay.get(day) ?? [] : [];
            const dots = day ? getDayDots(dayIntakes) : [];
            return (
              <Pressable
                key={i}
                style={[styles.dayCell, day === selected && styles.daySelected]}
                onPress={() => day && setSelected(day)}
              >
                {day && (
                  <>
                    <Text
                      style={[styles.dayNum, day === selected && styles.dayNumSelected]}
                    >
                      {day}
                    </Text>
                    <View style={styles.dots}>
                      {dots.map((c, j) => (
                        <View key={j} style={[styles.dot, { backgroundColor: c }]} />
                      ))}
                    </View>
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={styles.dayTitle}>
          {monthLabel(monthDate).split(' ')[0]} {selected}, {monthDate.getFullYear()}
        </Text>
        <Text style={styles.daySummary}>{summarizeDay(selectedIntakes)}</Text>
        {selectedIntakes.length > 0 && (
          <GradientButton title="View Day Summary" onPress={() => router.push('/(tabs)/log')} />
        )}
      </Card>

      <View style={styles.legend}>
        {[
          { color: colors.success, label: 'Low risk' },
          { color: colors.warning, label: 'Moderate' },
          { color: colors.danger, label: 'High risk' },
          { color: colors.blue, label: 'Medicine' },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorText: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.md,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  navArrow: { fontSize: 24, color: colors.text, paddingHorizontal: spacing.md },
  monthTitle: { ...typography.h3, color: colors.text },
  weekRow: { flexDirection: 'row', marginBottom: spacing.sm },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    ...typography.small,
    color: colors.textMuted,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  daySelected: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  dayNum: { ...typography.caption, color: colors.text },
  dayNumSelected: { color: colors.text, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  dayTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  daySummary: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
    justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.small, color: colors.textMuted },
});
