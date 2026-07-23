import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useEmergencyCard } from '@/hooks/useApi';
import { cabinetItemLabel, formatGender } from '@/lib/format';

export default function EmergencyInfoScreen() {
  const router = useRouter();
  const { forUserId } = useLocalSearchParams<{ forUserId?: string }>();
  const { data: card, loading, error, refetch } = useEmergencyCard(forUserId);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const profile = card?.subject.healthProfile;
  const emergencyText = profile?.emergencyInfo?.trim();
  const allergies =
    card?.allergies?.length
      ? card.allergies.map((a) => a.allergen).join(', ')
      : profile?.allergies?.trim() || null;
  const conditions =
    card?.conditions?.length
      ? card.conditions.map((c) => c.name).join(', ')
      : profile?.medicalConditions?.trim() || null;
  const activeMeds = card?.cabinet ?? [];
  const contacts = card?.contacts ?? [];
  const primaryContact = contacts.find((c) => c.isPrimary) ?? contacts[0] ?? null;

  const callPhone = (phone: string) => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned) return;
    void Linking.openURL(`tel:${cleaned}`);
  };

  return (
    <Screen>
      <ScreenHeader
        title="Emergency info"
        showBack
        onBack={() => router.back()}
        rightAction={
          <Pressable
            onPress={() => router.push('/edit-health-profile' as never)}
            style={styles.editBtn}
          >
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        }
      />

      <Text style={styles.lead}>
        Share this summary with responders or caregivers. Keep allergies, medications, and
        contacts up to date.
      </Text>

      {loading && (
        <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.lg }} />
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="medkit" size={26} color={colors.danger} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroName}>{card?.subject.name ?? '—'}</Text>
          <Text style={styles.heroMeta}>
            {[profile?.age && `${profile.age} yrs`, formatGender(profile?.gender)]
              .filter((v) => v && v !== '—')
              .join(' · ') || 'Add age and gender in your health profile'}
          </Text>
        </View>
      </View>

      <InfoSection
        title="Allergies"
        empty="No allergies listed"
        actionLabel="Update profile"
        onAction={() => router.push('/edit-health-profile' as never)}
      >
        {allergies ? <Text style={styles.value}>{allergies}</Text> : null}
      </InfoSection>

      <InfoSection
        title="Medical conditions"
        empty="No conditions listed"
        actionLabel="Update profile"
        onAction={() => router.push('/edit-health-profile' as never)}
      >
        {conditions ? <Text style={styles.value}>{conditions}</Text> : null}
      </InfoSection>

      <InfoSection
        title="Current medications"
        empty="No active medications in Health Cabinet"
        actionLabel="Open cabinet"
        onAction={() => router.push('/health-cabinet' as never)}
      >
        {activeMeds.length > 0 ? (
          <View style={styles.list}>
            {activeMeds.map((item) => (
              <View key={item.id} style={styles.listRow}>
                <View style={styles.bullet} />
                <Text style={styles.value}>
                  {cabinetItemLabel(item)}
                  {item.doseValue != null
                    ? ` · ${item.doseValue}${item.doseUnit ? ` ${item.doseUnit}` : ''}`
                    : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </InfoSection>

      <InfoSection
        title="Emergency contacts"
        empty="No contacts yet"
        actionLabel="Manage contacts"
        onAction={() => router.push('/emergency-contacts' as never)}
      >
        {contacts.length > 0 ? (
          <View style={styles.list}>
            {contacts.map((ct) => (
              <Pressable
                key={ct.id}
                style={styles.contactRow}
                onPress={() => (ct.phone ? callPhone(ct.phone) : undefined)}
                disabled={!ct.phone}
              >
                <View style={styles.contactCopy}>
                  <Text style={styles.contactName}>
                    {ct.name}
                    {ct.isPrimary ? ' · Primary' : ''}
                  </Text>
                  <Text style={styles.contactMeta}>
                    {[ct.relationship, ct.phone].filter(Boolean).join(' · ') || 'No phone saved'}
                  </Text>
                </View>
                {ct.phone ? (
                  <View style={styles.callChip}>
                    <Ionicons name="call-outline" size={14} color={colors.primary} />
                    <Text style={styles.callChipText}>Call</Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : null}
      </InfoSection>

      <InfoSection
        title="Notes for responders"
        empty="No emergency notes yet"
        actionLabel="Add notes"
        onAction={() => router.push('/edit-health-profile' as never)}
      >
        {emergencyText ? <Text style={styles.value}>{emergencyText}</Text> : null}
      </InfoSection>

      {primaryContact?.phone ? (
        <Pressable
          style={styles.primaryCall}
          onPress={() => callPhone(primaryContact.phone!)}
        >
          <Ionicons name="call" size={18} color="#FFFFFF" />
          <Text style={styles.primaryCallText}>
            Call {primaryContact.name}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          style={styles.secondaryCta}
          onPress={() => router.push('/emergency-contacts' as never)}
        >
          <Text style={styles.secondaryCtaText}>Add an emergency contact</Text>
        </Pressable>
      )}

      <Text style={styles.disclaimer}>
        {card?.disclaimer ??
          'Informational only. In a medical emergency, call your local emergency services immediately.'}
      </Text>
    </Screen>
  );
}

function InfoSection({
  title,
  empty,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  empty: string;
  actionLabel: string;
  onAction: () => void;
  children: ReactNode;
}) {
  const hasContent = Boolean(children);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      </View>
      {hasContent ? children : <Text style={styles.empty}>{empty}</Text>}
    </View>
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
  lead: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.md,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.danger}55`,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(239,68,68,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1, gap: 4 },
  heroName: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  heroMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionAction: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  value: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
  },
  list: {
    gap: spacing.sm,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
    marginTop: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  contactCopy: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  contactMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  callChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}18`,
  },
  callChipText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
  },
  primaryCall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  primaryCallText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryCta: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  secondaryCtaText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  disclaimer: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
});
