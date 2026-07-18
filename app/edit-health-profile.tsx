import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Field } from '@/components/ui/Field';
import { FilterChips } from '@/components/ui/FilterChips';
import { GradientButton } from '@/components/ui/GradientButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, spacing, typography } from '@/constants/theme';
import { useProfile } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { formatGender } from '@/lib/format';
import type { UpdateHealthProfileInput } from '@/types/api';

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;
const GENDER_MAP: Record<(typeof GENDER_OPTIONS)[number], UpdateHealthProfileInput['gender']> = {
  Male: 'MALE',
  Female: 'FEMALE',
  Other: 'OTHER',
  'Prefer not to say': 'PREFER_NOT_TO_SAY',
};

function genderLabelFromEnum(value: string | null | undefined): (typeof GENDER_OPTIONS)[number] {
  if (!value) return 'Prefer not to say';
  const label = formatGender(value);
  return (GENDER_OPTIONS.find((o) => o === label) ?? 'Prefer not to say') as (typeof GENDER_OPTIONS)[number];
}

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalFloat(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}

export default function EditHealthProfileScreen() {
  const router = useRouter();
  const { data: user, loading, error } = useProfile();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [gender, setGender] = useState<(typeof GENDER_OPTIONS)[number]>('Prefer not to say');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [emergencyInfo, setEmergencyInfo] = useState('');
  const [goalsText, setGoalsText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const profile = user.healthProfile;
    setName(user.name ?? '');
    setAge(profile?.age?.toString() ?? '');
    setWeightKg(profile?.weightKg?.toString() ?? '');
    setHeightCm(profile?.heightCm?.toString() ?? '');
    setGender(genderLabelFromEnum(profile?.gender));
    setMedicalConditions(profile?.medicalConditions ?? '');
    setAllergies(profile?.allergies ?? '');
    setEmergencyInfo(profile?.emergencyInfo ?? '');
    setGoalsText((user.healthGoals ?? []).map((g) => g.goal).join('\n'));
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter your display name.');
      return;
    }

    setSaving(true);
    try {
      const goals = goalsText
        .split('\n')
        .map((g) => g.trim())
        .filter(Boolean);

      await api.updateMe({ name: name.trim() });
      await api.updateHealthProfile({
        age: parseOptionalInt(age),
        weightKg: parseOptionalFloat(weightKg),
        heightCm: parseOptionalFloat(heightCm),
        gender: GENDER_MAP[gender],
        medicalConditions: medicalConditions.trim() || null,
        allergies: allergies.trim() || null,
        emergencyInfo: emergencyInfo.trim() || null,
      });
      await api.updateHealthGoals(goals);
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !user) {
    return (
      <Screen scroll={false} style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Edit Profile" showBack onBack={() => router.back()} />

      {error && (
        <Text style={styles.errorText}>
          Could not load profile. You can still edit and save when the API is back.
        </Text>
      )}

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Basic Info</Text>
        <Field label="Display name" value={name} onChangeText={setName} placeholder="Your name" />

        <Text style={styles.sectionTitle}>Health Profile</Text>
        <View style={styles.row}>
          <Field
            label="Age"
            value={age}
            onChangeText={setAge}
            placeholder="32"
            keyboardType="numeric"
            style={styles.halfField}
          />
          <Field
            label="Weight (kg)"
            value={weightKg}
            onChangeText={setWeightKg}
            placeholder="75"
            keyboardType="numeric"
            style={styles.halfField}
          />
        </View>
        <Field
          label="Height (cm)"
          value={heightCm}
          onChangeText={setHeightCm}
          placeholder="178"
          keyboardType="numeric"
        />

        <Text style={styles.fieldLabel}>Gender</Text>
        <FilterChips
          options={[...GENDER_OPTIONS]}
          selected={gender}
          onSelect={(o) => setGender(o as (typeof GENDER_OPTIONS)[number])}
        />

        <Field
          label="Medical conditions"
          value={medicalConditions}
          onChangeText={setMedicalConditions}
          placeholder="e.g. Hypertension, Asthma"
          multiline
        />
        <Field
          label="Allergies"
          value={allergies}
          onChangeText={setAllergies}
          placeholder="e.g. Penicillin, Peanuts"
          multiline
        />

        <Text style={styles.sectionTitle}>Health Goals</Text>
        <Text style={styles.hint}>One goal per line</Text>
        <Field
          label="Goals"
          value={goalsText}
          onChangeText={setGoalsText}
          placeholder={'Reduce caffeine\nImprove sleep quality'}
          multiline
        />

        <Text style={styles.sectionTitle}>Emergency Info</Text>
        <Text style={styles.hint}>Blood type, contacts, medications — shown on your emergency card</Text>
        <Field
          label="Emergency details"
          value={emergencyInfo}
          onChangeText={setEmergencyInfo}
          placeholder="Blood type O+, emergency contact Jane (555-0100)..."
          multiline
        />

        <GradientButton
          title={saving ? 'Saving…' : 'Save Profile'}
          onPress={saving ? undefined : handleSave}
        />
        <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
  cancelText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
