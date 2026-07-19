import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
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

  return (
    <Screen>
      <ScreenHeader
        title="Emergency Info"
        showBack
        onBack={() => router.back()}
        rightAction={
          <Pressable
            onPress={() => router.push('/emergency-contacts' as never)}
            style={styles.editBtn}
          >
            <Text style={styles.editText}>Contacts</Text>
          </Pressable>
        }
      />

      {loading && (
        <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.lg }} />
      )}
      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="medkit" size={28} color={colors.danger} />
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardName}>{card?.subject.name ?? '—'}</Text>
            <Text style={styles.cardMeta}>
              {[profile?.age && `${profile.age} yrs`, formatGender(profile?.gender)]
                .filter((v) => v && v !== '—')
                .join(' · ') || 'Health profile incomplete'}
            </Text>
          </View>
        </View>

        {allergies ? (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Allergies</Text>
            <Text style={styles.blockValue}>{allergies}</Text>
          </View>
        ) : null}

        {conditions ? (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Medical conditions</Text>
            <Text style={styles.blockValue}>{conditions}</Text>
          </View>
        ) : null}

        <View style={styles.block}>
          <Text style={styles.blockLabel}>Current medications / supplements</Text>
          {activeMeds.length > 0 ? (
            activeMeds.map((item) => (
              <Text key={item.id} style={styles.blockValue}>
                • {cabinetItemLabel(item)}
                {item.doseValue != null
                  ? ` (${item.doseValue}${item.doseUnit ? ` ${item.doseUnit}` : ''})`
                  : ''}
              </Text>
            ))
          ) : (
            <Text style={styles.blockValue}>
              None listed in Health Cabinet. Add items so responders can see what you take.
            </Text>
          )}
        </View>

        <View style={styles.block}>
          <Text style={styles.blockLabel}>Emergency contacts</Text>
          {contacts.length > 0 ? (
            contacts.map((ct) => (
              <Text key={ct.id} style={styles.blockValue}>
                • {ct.name}
                {ct.relationship ? ` (${ct.relationship})` : ''}
                {ct.phone ? ` — ${ct.phone}` : ''}
                {ct.isPrimary ? ' · primary' : ''}
              </Text>
            ))
          ) : (
            <Text style={styles.blockValue}>
              No structured contacts yet. Tap Contacts to add one.
            </Text>
          )}
        </View>

        <View style={styles.block}>
          <Text style={styles.blockLabel}>Emergency details</Text>
          <Text style={styles.blockValue}>
            {emergencyText ||
              'No free-text emergency notes. Edit your health profile to add blood type or other notes.'}
          </Text>
        </View>
      </Card>

      <View style={styles.callout}>
        <Text style={styles.calloutText}>
          {card?.disclaimer ??
            'In a medical emergency, call your local emergency number immediately.'}
        </Text>
        <Pressable
          style={styles.callBtn}
          onPress={() => Alert.alert('Emergency', 'Call your local emergency number now.')}
        >
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
  errorCard: {
    borderColor: colors.warning,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.warning,
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
