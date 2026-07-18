import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useProfile } from '@/hooks/useApi';
import { formatGender } from '@/lib/format';

export default function EmergencyInfoScreen() {
  const router = useRouter();
  const { data: user, loading } = useProfile();

  const profile = user?.healthProfile;
  const emergencyText = profile?.emergencyInfo?.trim();

  return (
    <Screen>
      <ScreenHeader
        title="Emergency Info"
        showBack
        onBack={() => router.back()}
        rightAction={
          <Pressable onPress={() => router.push('/edit-health-profile')} style={styles.editBtn}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        }
      />

      {loading && <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.lg }} />}

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="medkit" size={28} color={colors.danger} />
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardName}>{user?.name ?? '—'}</Text>
            <Text style={styles.cardMeta}>
              {[profile?.age && `${profile.age} yrs`, formatGender(profile?.gender)]
                .filter((v) => v && v !== '—')
                .join(' · ') || 'Health profile incomplete'}
            </Text>
          </View>
        </View>

        {profile?.allergies ? (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Allergies</Text>
            <Text style={styles.blockValue}>{profile.allergies}</Text>
          </View>
        ) : null}

        {profile?.medicalConditions ? (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Medical conditions</Text>
            <Text style={styles.blockValue}>{profile.medicalConditions}</Text>
          </View>
        ) : null}

        <View style={styles.block}>
          <Text style={styles.blockLabel}>Emergency details</Text>
          <Text style={styles.blockValue}>
            {emergencyText || 'No emergency info saved. Tap Edit to add blood type, contacts, and medications.'}
          </Text>
        </View>
      </Card>

      <View style={styles.callout}>
        <Text style={styles.calloutText}>
          In a medical emergency, call your local emergency number immediately.
        </Text>
        <Pressable style={styles.callBtn}>
          <Text style={styles.callNumber}>911</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  editBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  editText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  card: {
    borderColor: colors.danger,
    borderWidth: 1,
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardName: {
    ...typography.h2,
    color: colors.text,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  block: {
    marginBottom: spacing.lg,
  },
  blockLabel: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  blockValue: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  callout: {
    marginTop: spacing.xl,
    backgroundColor: 'rgba(220,38,38,0.12)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  calloutText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  callBtn: {
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  callNumber: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
});
