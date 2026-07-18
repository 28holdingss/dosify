import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useProfile } from '@/hooks/useApi';
import { signOut } from '@/lib/auth-client';
import { formatGender } from '@/lib/format';

export default function ProfileScreen() {
  const router = useRouter();
  const { data: user, loading, error, refetch } = useProfile();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const profile = user?.healthProfile;
  const goals = user?.healthGoals ?? [];

  const healthFields = profile
    ? [
        { label: 'Age', value: profile.age?.toString() ?? '—' },
        { label: 'Weight', value: profile.weightKg ? `${profile.weightKg} kg` : '—' },
        { label: 'Height', value: profile.heightCm ? `${profile.heightCm} cm` : '—' },
        { label: 'Gender', value: formatGender(profile.gender) },
        { label: 'Medical Conditions', value: profile.medicalConditions ?? 'None' },
        { label: 'Allergies', value: profile.allergies ?? 'None' },
      ]
    : [];

  return (
    <Screen>
      <ScreenHeader title="My Profile" showSettings />

      {loading && <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.lg }} />}
      {error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>Could not load profile. Is the API running?</Text>
        </Card>
      )}

      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={colors.primary} />
        </View>
        <Text style={styles.name}>{user?.name ?? 'Alex Johnson'}</Text>
        {user?.isPremium && (
          <View style={styles.badge}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={styles.badgeText}>Premium Member</Text>
          </View>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Health Profile</Text>
        <Pressable onPress={() => router.push('/edit-health-profile')} style={styles.editLink}>
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={styles.editLinkText}>Edit</Text>
        </Pressable>
      </View>
      <Card>
        {healthFields.map((item, i) => (
          <View
            key={item.label}
            style={[styles.row, i < healthFields.length - 1 && styles.rowBorder]}
          >
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{item.value}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Health Goals</Text>
        <Pressable onPress={() => router.push('/edit-health-profile')} style={styles.editLink}>
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={styles.editLinkText}>Edit</Text>
        </Pressable>
      </View>
      <Card>
        <Text style={styles.goalsText}>
          {goals.length > 0
            ? goals.map((g) => g.goal).join(' · ')
            : 'No goals set yet'}
        </Text>
      </Card>

      <Pressable style={styles.watchBtn} onPress={() => router.push('/watch-sync')}>
        <Ionicons name="watch-outline" size={20} color={colors.primary} />
        <View style={styles.watchCopy}>
          <Text style={styles.watchTitle}>Apple Watch Sync</Text>
          <Text style={styles.watchSub}>Sync sleep, heart rate, and activity</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Pressable style={styles.emergencyBtn} onPress={() => router.push('/emergency-info')}>
        <Ionicons name="medkit" size={20} color={colors.danger} />
        <Text style={styles.emergencyText}>Emergency Info Card</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.danger} />
      </Pressable>

      <Pressable onPress={() => router.push('/substance-library')}>
        <Card style={styles.libraryLink}>
          <Ionicons name="library" size={20} color={colors.primary} />
          <Text style={styles.libraryText}>Substance Library</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </Pressable>

      <View style={styles.emergencyBar}>
        <Text style={styles.emergencyLabel}>
          In an emergency? Call your local emergency number.
        </Text>
        <Pressable style={styles.emergencyCall}>
          <Text style={styles.emergencyNumber}>911</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.signOutBtn}
        onPress={async () => {
          await signOut();
          router.replace('/onboarding');
        }}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorCard: {
    borderColor: colors.warning,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.warning,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeText: {
    ...typography.small,
    color: colors.warning,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  editLinkText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  rowValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  goalsText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  watchCopy: { flex: 1 },
  watchTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  watchSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  emergencyText: {
    ...typography.body,
    color: colors.danger,
    fontWeight: '600',
    flex: 1,
  },
  libraryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  libraryText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  emergencyBar: {
    backgroundColor: 'rgba(220,38,38,0.12)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  emergencyLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emergencyCall: {
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  emergencyNumber: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  signOutText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
