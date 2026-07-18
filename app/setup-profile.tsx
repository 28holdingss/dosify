import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Field } from '@/components/ui/Field';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import type { UpdateHealthProfileInput } from '@/types/api';

const STEPS = [
  {
    icon: 'sparkles' as const,
    eyebrow: 'Welcome to Dosify',
    title: 'Let’s make Dosify yours',
    body: 'A few details help us make your health scores, recovery estimates, and safety insights more useful.',
  },
  {
    icon: 'body-outline' as const,
    eyebrow: 'Your baseline',
    title: 'Tell us about your body',
    body: 'These details improve dose context and recovery estimates. You can change them anytime.',
  },
  {
    icon: 'flag-outline' as const,
    eyebrow: 'Your priorities',
    title: 'What would you like to improve?',
    body: 'Choose as many as you like. We’ll use these to highlight the insights that matter most.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    eyebrow: 'Safety profile',
    title: 'Anything we should watch for?',
    body: 'This is optional, but it helps Dosify surface more relevant cautions and interaction alerts.',
  },
] as const;

const GOALS = [
  'Improve sleep',
  'Reduce caffeine',
  'Track medication',
  'Avoid interactions',
  'Understand effects',
  'Support recovery',
] as const;

const GENDERS: Array<{
  label: string;
  value: UpdateHealthProfileInput['gender'];
}> = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
  { label: 'Prefer not to say', value: 'PREFER_NOT_TO_SAY' },
];

function optionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function SetupProfileScreen() {
  const router = useRouter();
  const theme = useSpatialTheme();
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] =
    useState<UpdateHealthProfileInput['gender']>('PREFER_NOT_TO_SAY');
  const [goals, setGoals] = useState<string[]>([]);
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = STEPS[step];
  const firstName = session?.user.name?.trim().split(/\s+/)[0] || 'there';
  const progress = (step + 1) / STEPS.length;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: theme.background },
        keyboard: { flex: 1 },
        scroll: { flex: 1 },
        scrollContent: { paddingBottom: spacing.lg },
        shell: {
          flex: 1,
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xxl,
          paddingBottom: spacing.xxl,
        },
        topRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.xl,
        },
        brand: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        brandMark: {
          width: 30,
          height: 30,
          borderRadius: 10,
          backgroundColor: theme.accent,
          alignItems: 'center',
          justifyContent: 'center',
        },
        brandText: { ...typography.body, color: theme.text, fontWeight: '700' },
        stepText: { ...typography.caption, color: theme.textMuted },
        progressTrack: {
          height: 4,
          borderRadius: radius.full,
          overflow: 'hidden',
          backgroundColor: theme.separator,
          marginBottom: spacing.xxxl,
        },
        progressFill: {
          height: '100%',
          borderRadius: radius.full,
          backgroundColor: theme.accent,
        },
        content: { flex: 1 },
        icon: {
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: `${theme.accent}1F`,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: `${theme.accent}55`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xl,
        },
        eyebrow: {
          ...typography.small,
          color: theme.accent,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginBottom: spacing.sm,
        },
        title: {
          fontSize: 34,
          lineHeight: 41,
          fontWeight: '700',
          color: theme.text,
          maxWidth: 560,
        },
        body: {
          ...typography.body,
          color: theme.textSecondary,
          lineHeight: 23,
          marginTop: spacing.md,
          marginBottom: spacing.xxl,
          maxWidth: 570,
        },
        welcomeCard: {
          backgroundColor: theme.glass,
          borderColor: theme.separator,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: radius.xl,
          padding: spacing.xl,
          gap: spacing.lg,
        },
        benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
        benefitIcon: {
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: `${theme.accent}1A`,
          alignItems: 'center',
          justifyContent: 'center',
        },
        benefitCopy: { flex: 1 },
        benefitTitle: { ...typography.body, color: theme.text, fontWeight: '600' },
        benefitBody: {
          ...typography.caption,
          color: theme.textSecondary,
          marginTop: 2,
        },
        fieldRow: { flexDirection: 'row', gap: spacing.md },
        half: { flex: 1 },
        label: {
          ...typography.caption,
          color: theme.textMuted,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginBottom: spacing.sm,
        },
        chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: spacing.md,
          paddingVertical: 10,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: theme.separator,
          backgroundColor: theme.glass,
        },
        chipSelected: {
          borderColor: theme.accent,
          backgroundColor: `${theme.accent}1A`,
        },
        chipText: { ...typography.caption, color: theme.textSecondary },
        chipTextSelected: { color: theme.accent, fontWeight: '600' },
        privacy: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.md,
          padding: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: `${colors.success}12`,
          marginTop: spacing.sm,
        },
        privacyText: {
          ...typography.caption,
          color: theme.textSecondary,
          flex: 1,
          lineHeight: 19,
        },
        error: {
          ...typography.caption,
          color: colors.danger,
          marginTop: spacing.md,
        },
        footer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
          paddingTop: spacing.md,
        },
        back: { paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
        backText: { ...typography.body, color: theme.textSecondary },
        next: {
          minWidth: 148,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingVertical: 14,
          paddingHorizontal: spacing.xl,
          borderRadius: radius.lg,
          backgroundColor: theme.accent,
        },
        nextPressed: { opacity: 0.8 },
        nextText: { ...typography.body, color: '#FFFFFF', fontWeight: '700' },
      }),
    [theme],
  );

  const toggleGoal = (goal: string) => {
    setGoals((currentGoals) =>
      currentGoals.includes(goal)
        ? currentGoals.filter((item) => item !== goal)
        : [...currentGoals, goal],
    );
  };

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.updateHealthProfile({
        age: optionalNumber(age),
        weightKg: optionalNumber(weight),
        heightCm: optionalNumber(height),
        gender,
        medicalConditions: conditions.trim() || null,
        allergies: allergies.trim() || null,
      });
      await api.updateHealthGoals(goals);
      await api.completeOnboarding();
      router.replace('/(tabs)');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save your setup.');
      setSaving(false);
    }
  };

  const next = () => {
    setError(null);
    if (step < STEPS.length - 1) setStep((value) => value + 1);
    else void finish();
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.shell}>
          <View style={styles.topRow}>
            <View style={styles.brand}>
              <View style={styles.brandMark}>
                <Ionicons name="pulse" size={17} color="#FFFFFF" />
              </View>
              <Text style={styles.brandText}>Dosify</Text>
            </View>
            <Text style={styles.stepText}>
              {step + 1} of {STEPS.length}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.icon}>
                <Ionicons name={current.icon} size={27} color={theme.accent} />
              </View>
              <Text style={styles.eyebrow}>{current.eyebrow}</Text>
              <Text style={styles.title}>
                {step === 0 ? `Hi ${firstName}, let’s make Dosify yours` : current.title}
              </Text>
              <Text style={styles.body}>{current.body}</Text>

              {step === 0 && (
                <View style={styles.welcomeCard}>
                  {[
                    {
                      icon: 'analytics-outline' as const,
                      title: 'Personalized scores',
                      description: 'Health context based on your profile and logs.',
                    },
                    {
                      icon: 'shield-checkmark-outline' as const,
                      title: 'Safer choices',
                      description: 'Interaction alerts and clearer risk signals.',
                    },
                    {
                      icon: 'trending-up-outline' as const,
                      title: 'Useful patterns',
                      description: 'See how habits affect sleep, recovery, and focus.',
                    },
                  ].map((benefit) => (
                    <View key={benefit.title} style={styles.benefit}>
                      <View style={styles.benefitIcon}>
                        <Ionicons name={benefit.icon} size={17} color={theme.accent} />
                      </View>
                      <View style={styles.benefitCopy}>
                        <Text style={styles.benefitTitle}>{benefit.title}</Text>
                        <Text style={styles.benefitBody}>{benefit.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {step === 1 && (
                <>
                  <View style={styles.fieldRow}>
                    <Field
                      label="Age"
                      value={age}
                      onChangeText={setAge}
                      placeholder="32"
                      keyboardType="numeric"
                      style={styles.half}
                    />
                    <Field
                      label="Weight (kg)"
                      value={weight}
                      onChangeText={setWeight}
                      placeholder="75"
                      keyboardType="numeric"
                      style={styles.half}
                    />
                  </View>
                  <Field
                    label="Height (cm)"
                    value={height}
                    onChangeText={setHeight}
                    placeholder="178"
                    keyboardType="numeric"
                  />
                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.chips}>
                    {GENDERS.map((option) => {
                      const selected = gender === option.value;
                      return (
                        <Pressable
                          key={option.label}
                          onPress={() => setGender(option.value)}
                          style={[styles.chip, selected && styles.chipSelected]}
                        >
                          {selected && (
                            <Ionicons name="checkmark" size={14} color={theme.accent} />
                          )}
                          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              {step === 2 && (
                <View style={styles.chips}>
                  {GOALS.map((goal) => {
                    const selected = goals.includes(goal);
                    return (
                      <Pressable
                        key={goal}
                        onPress={() => toggleGoal(goal)}
                        style={[styles.chip, selected && styles.chipSelected]}
                      >
                        {selected && (
                          <Ionicons name="checkmark" size={14} color={theme.accent} />
                        )}
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                          {goal}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {step === 3 && (
                <>
                  <Field
                    label="Medical conditions"
                    value={conditions}
                    onChangeText={setConditions}
                    placeholder="e.g. Hypertension, asthma"
                    multiline
                  />
                  <Field
                    label="Allergies"
                    value={allergies}
                    onChangeText={setAllergies}
                    placeholder="e.g. Penicillin, peanuts"
                    multiline
                  />
                  <View style={styles.privacy}>
                    <Ionicons name="lock-closed" size={18} color={colors.success} />
                    <Text style={styles.privacyText}>
                      Your health information is private and is only used to personalize your
                      Dosify experience.
                    </Text>
                  </View>
                </>
              )}

              {error && <Text style={styles.error}>{error}</Text>}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {step > 0 ? (
              <Pressable onPress={() => setStep((value) => value - 1)} style={styles.back}>
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <Pressable
              onPress={next}
              disabled={saving}
              style={({ pressed }) => [styles.next, pressed && styles.nextPressed]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.nextText}>
                    {step === STEPS.length - 1 ? 'Finish setup' : 'Continue'}
                  </Text>
                  <Ionicons
                    name={step === STEPS.length - 1 ? 'checkmark' : 'arrow-forward'}
                    size={17}
                    color="#FFFFFF"
                  />
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
