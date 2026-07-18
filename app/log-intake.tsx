import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Field } from '@/components/ui/Field';
import { DateTimePickerField } from '@/components/ui/DateTimePickerField';
import { GradientButton } from '@/components/ui/GradientButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useSubstance } from '@/hooks/useApi';
import { api } from '@/lib/api';

const methods = ['ORAL', 'TOPICAL', 'INJECTION', 'OTHER'] as const;
const methodLabels: Record<string, string> = {
  ORAL: 'Oral',
  TOPICAL: 'Topical',
  INJECTION: 'Injection',
  OTHER: 'Other',
};

function parsePositiveNumber(text: string): number | null {
  const cleaned = text.trim().replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function defaultRange(substance: { minDose: number | null; maxDose: number | null; defaultUnit: string }) {
  const min = substance.minDose ?? (substance.defaultUnit === 'IU' ? 100 : 1);
  const max = substance.maxDose ?? (substance.defaultUnit === 'IU' ? 5000 : 1000);
  return min <= max ? { min, max } : { min: max, max: min };
}

function defaultDose(min: number, max: number, unit: string) {
  if (unit === 'IU') return clamp(1000, min, max);
  if (min === max) return min;
  return Math.round((min + max) / 2);
}

function doseStep(min: number, max: number) {
  const span = max - min;
  if (span <= 10) return 0.5;
  if (span <= 50) return 1;
  if (span <= 200) return 5;
  if (span <= 1000) return 10;
  return Math.max(25, Math.round(span / 20));
}

function formatDose(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default function LogIntakeScreen() {
  const router = useRouter();
  const { substanceId } = useLocalSearchParams<{ substanceId?: string }>();
  const { data: substance, loading, error } = useSubstance(substanceId);

  const [minRange, setMinRange] = useState('1');
  const [maxRange, setMaxRange] = useState('1000');
  const [doseInput, setDoseInput] = useState('');
  const [method, setMethod] = useState<(typeof methods)[number]>('ORAL');
  const [submitting, setSubmitting] = useState(false);
  const [takenAt, setTakenAt] = useState(new Date());
  const [trackWidth, setTrackWidth] = useState(0);

  const maxTakenAt = useMemo(() => new Date(), []);
  const minTakenAt = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, []);

  useEffect(() => {
    if (!substance) return;
    const { min, max } = defaultRange(substance);
    const unit = substance.defaultUnit ?? 'mg';
    const start = defaultDose(min, max, unit);
    setMinRange(formatDose(min));
    setMaxRange(formatDose(max));
    setDoseInput(formatDose(start));
  }, [substance]);

  const unit = substance?.defaultUnit ?? 'mg';
  const minDose = parsePositiveNumber(minRange) ?? 1;
  const maxDose = Math.max(minDose, parsePositiveNumber(maxRange) ?? minDose);
  const dose = clamp(parsePositiveNumber(doseInput) ?? minDose, minDose, maxDose);
  const step = doseStep(minDose, maxDose);
  const range = maxDose - minDose || 1;

  const dosePresets = useMemo(() => {
    const values = [
      minDose,
      minDose + range * 0.25,
      minDose + range * 0.5,
      minDose + range * 0.75,
      maxDose,
    ].map((value) => {
      const rounded = step < 1 ? Math.round(value * 2) / 2 : Math.round(value / step) * step;
      return clamp(rounded, minDose, maxDose);
    });

    return [...new Set(values.map(formatDose))].slice(0, 5);
  }, [minDose, maxDose, range, step]);

  const setDoseValue = (value: number) => {
    setDoseInput(formatDose(clamp(value, minDose, maxDose)));
  };

  const applyRangeBounds = () => {
    const min = parsePositiveNumber(minRange) ?? minDose;
    const max = Math.max(min, parsePositiveNumber(maxRange) ?? maxDose);
    setMinRange(formatDose(min));
    setMaxRange(formatDose(max));
    setDoseValue(clamp(parsePositiveNumber(doseInput) ?? min, min, max));
  };

  const handleTrackPress = (locationX: number) => {
    if (trackWidth <= 0) return;
    const pct = clamp(locationX / trackWidth, 0, 1);
    const raw = minDose + pct * range;
    const snapped = step < 1 ? Math.round(raw * 2) / 2 : Math.round(raw / step) * step;
    setDoseValue(snapped);
  };

  const handleAnalyze = async () => {
    if (!substance) return;

    const min = parsePositiveNumber(minRange);
    const max = parsePositiveNumber(maxRange);
    const amount = parsePositiveNumber(doseInput);

    if (min == null || max == null || amount == null) {
      Alert.alert('Invalid dose', 'Enter a valid custom range and dose amount.');
      return;
    }
    if (max < min) {
      Alert.alert('Invalid range', 'Maximum dose must be greater than or equal to minimum.');
      return;
    }
    if (amount < min || amount > max) {
      Alert.alert('Dose out of range', `Enter a dose between ${formatDose(min)} and ${formatDose(max)} ${unit}.`);
      return;
    }

    setSubmitting(true);
    try {
      const intake = await api.createIntake({
        substanceId: substance.id,
        dose: amount,
        unit,
        takenAt: takenAt.toISOString(),
        method,
        status: 'LOGGED',
      });
      await api.analyzeIntake(intake.id);
      router.push({
        pathname: '/analysis',
        params: { intakeId: intake.id },
      });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to log intake');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Screen scroll={false} style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </Screen>
    );
  }

  if (error || !substance) {
    return (
      <Screen>
        <Text style={styles.errorText}>
          Could not load substance. Go back and select one from the library.
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>← Go back</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Log Intake</Text>
        <Pressable onPress={() => router.push('/log-search')}>
          <Text style={styles.draft}>Change</Text>
        </Pressable>
      </View>

      <View style={styles.substanceRow}>
        <View>
          <Text style={styles.substanceName}>{substance.name}</Text>
          <Text style={styles.substanceDose}>
            {formatDose(dose)} {unit}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Custom range</Text>
      <View style={styles.rangeRow}>
        <Field
          label={`Min (${unit})`}
          value={minRange}
          onChangeText={setMinRange}
          keyboardType="numeric"
          placeholder="Min"
          style={styles.rangeField}
        />
        <Field
          label={`Max (${unit})`}
          value={maxRange}
          onChangeText={setMaxRange}
          keyboardType="numeric"
          placeholder="Max"
          style={styles.rangeField}
        />
      </View>
      <Pressable style={styles.applyRangeBtn} onPress={applyRangeBounds}>
        <Text style={styles.applyRangeText}>Apply range</Text>
      </Pressable>

      <Field
        label={`Dose (${unit})`}
        value={doseInput}
        onChangeText={setDoseInput}
        onBlur={applyRangeBounds}
        keyboardType="numeric"
        placeholder={`${formatDose(minDose)} – ${formatDose(maxDose)}`}
      />

      <View style={styles.stepperRow}>
        <Pressable
          style={styles.stepperBtn}
          onPress={() => setDoseValue(dose - step)}
        >
          <Ionicons name="remove" size={18} color={colors.text} />
        </Pressable>
        <Pressable
          style={styles.trackPressable}
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          onPress={(event) => handleTrackPress(event.nativeEvent.locationX)}
        >
          <View style={styles.sliderTrack}>
            <View
              style={[styles.sliderFill, { width: `${((dose - minDose) / range) * 100}%` }]}
            />
            <View
              style={[styles.sliderThumb, { left: `${((dose - minDose) / range) * 100}%` }]}
            />
          </View>
        </Pressable>
        <Pressable
          style={styles.stepperBtn}
          onPress={() => setDoseValue(dose + step)}
        >
          <Ionicons name="add" size={18} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>
          {formatDose(minDose)} {unit}
        </Text>
        <Text style={styles.sliderValue}>
          {formatDose(dose)} {unit}
        </Text>
        <Text style={styles.sliderLabel}>
          {formatDose(maxDose)} {unit}
        </Text>
      </View>

      <View style={styles.doseButtons}>
        {dosePresets.map((preset) => (
          <Pressable
            key={preset}
            style={[styles.doseBtn, doseInput === preset && styles.doseBtnActive]}
            onPress={() => setDoseInput(preset)}
          >
            <Text style={[styles.doseBtnText, doseInput === preset && styles.doseBtnTextActive]}>
              {preset}
            </Text>
          </Pressable>
        ))}
      </View>

      <DateTimePickerField
        value={takenAt}
        onChange={setTakenAt}
        minimumDate={minTakenAt}
        maximumDate={maxTakenAt}
      />

      <Text style={styles.label}>How did you take it?</Text>
      <View style={styles.segmented}>
        {methods.map((m) => (
          <Pressable
            key={m}
            style={[styles.segment, method === m && styles.segmentActive]}
            onPress={() => setMethod(m)}
          >
            <Text style={[styles.segmentText, method === m && styles.segmentTextActive]}>
              {methodLabels[m]}
            </Text>
          </Pressable>
        ))}
      </View>

      <GradientButton
        title={submitting ? 'Analyzing...' : 'Analyze Now'}
        onPress={handleAnalyze}
        style={{ marginTop: spacing.xl }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { ...typography.body, color: colors.warning, marginBottom: spacing.md },
  backLink: { ...typography.body, color: colors.primary },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  cancel: { ...typography.body, color: colors.textSecondary },
  title: { ...typography.h3, color: colors.text },
  draft: { ...typography.body, color: colors.primary },
  substanceRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  substanceName: { ...typography.h3, color: colors.text },
  substanceDose: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  sectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rangeField: {
    flex: 1,
    marginBottom: spacing.sm,
  },
  applyRangeBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  applyRangeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackPressable: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.text,
    marginLeft: -10,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sliderLabel: { ...typography.small, color: colors.textMuted },
  sliderValue: { ...typography.body, color: colors.text, fontWeight: '600' },
  doseButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  doseBtn: {
    minWidth: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  doseBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  doseBtnText: { ...typography.caption, color: colors.textSecondary },
  doseBtnTextActive: { color: colors.text, fontWeight: '600' },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: spacing.lg,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { ...typography.caption, color: colors.textSecondary },
  segmentTextActive: { color: colors.text, fontWeight: '600' },
});
