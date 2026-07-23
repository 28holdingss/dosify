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
        {user?.isPremium ? (
          <Pressable style={styles.badge} onPress={() => router.push('/pricing' as never)}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={styles.badgeText}>Dosify Pro</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.upgradeBadge} onPress={() => router.push('/pricing' as never)}>
            <Ionicons name="diamond-outline" size={12} color={colors.text} />
            <Text style={styles.upgradeBadgeText}>Upgrade to Pro</Text>
          </Pressable>
        )}
      </View>

      {!user?.isPremium && (
        <Pressable onPress={() => router.push('/pricing' as never)}>
          <Card style={styles.proPromo}>
            <View style={styles.proPromoIcon}>
              <Ionicons name="diamond" size={20} color={colors.text} />
            </View>
            <View style={styles.proPromoCopy}>
              <Text style={styles.proPromoTitle}>Dosify Pro</Text>
              <Text style={styles.proPromoSub}>
                Unlimited meds, AI, recovery timelines & wearables
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Card>
        </Pressable>
      )}

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
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Apple Watch Sync</Text>
          <Text style={styles.watchSub}>
            Health data + Watch companion for today{"'"}s doses
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Pressable
        style={styles.emergencyCard}
        onPress={() => router.push('/emergency-info')}
      >
        <View style={styles.emergencyIcon}>
          <Ionicons name="medkit" size={22} color={colors.danger} />
        </View>
        <View style={styles.emergencyCopy}>
          <Text style={styles.emergencyTitle}>Emergency info</Text>
          <Text style={styles.emergencySub}>
            Allergies, medications, and contacts for responders
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.danger} />
      </Pressable>

      <Pressable onPress={() => router.push('/ai' as never)}>
        <Card style={styles.libraryLink}>
          <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
          <Text style={styles.libraryText}>Dosify AI</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/health-cabinet' as never)}>
        <Card style={styles.libraryLink}>
          <Ionicons name="medkit-outline" size={20} color={colors.primary} />
          <Text style={styles.libraryText}>Health Cabinet</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/check-before-taking' as never)}>
        <Card style={styles.libraryLink}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <Text style={styles.libraryText}>Check before taking</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/todays-doses' as never)}>
        <Card style={styles.libraryLink}>
          <Ionicons name="alarm-outline" size={20} color={colors.primary} />
          <Text style={styles.libraryText}>Today&apos;s Doses</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/symptoms' as never)}>
        <Card style={styles.libraryLink}>
          <Ionicons name="pulse-outline" size={20} color={colors.primary} />
          <Text style={styles.libraryText}>Symptoms</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/health-reports' as never)}>
        <Card style={styles.libraryLink}>
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
          <Text style={styles.libraryText}>Health Reports</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/family' as never)}>
        <Card style={styles.libraryLink}>
          <Ionicons name="people-outline" size={20} color={colors.primary} />
          <Text style={styles.libraryText}>Family & Care</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/observational-insights' as never)}>
        <Card style={styles.libraryLink}>
          <Ionicons name="analytics-outline" size={20} color={colors.primary} />
          <Text style={styles.libraryText}>Wearable Insights</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/substance-library')}>
        <Card style={styles.libraryLink}>
          <Ionicons name="library" size={20} color={colors.primary} />
          <Text style={styles.libraryText}>Substance Library</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/support' as never)}>
        <Card style={styles.libraryLink}>
          <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.libraryText}>Support</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/privacy' as never)}>
        <Card style={styles.libraryLink}>
          <Ionicons name="shield-outline" size={20} color={colors.primary} />
          <Text style={styles.libraryText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/terms' as never)}>
        <Card style={styles.libraryLink}>
          <Ionicons name="document-outline" size={20} color={colors.primary} />
          <Text style={styles.libraryText}>Terms of Use</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </Pressable>

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
  upgradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  upgradeBadgeText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  proPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.35)',
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  proPromoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99,102,241,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proPromoCopy: { flex: 1 },
  proPromoTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  proPromoSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
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
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.danger}66`,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  emergencyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239,68,68,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  emergencyTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  emergencySub: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  libraryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  libraryText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  signOutText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
