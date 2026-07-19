import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Field } from '@/components/ui/Field';
import { GradientButton } from '@/components/ui/GradientButton';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useHouseholds } from '@/hooks/useApi';
import { api } from '@/lib/api';

export default function FamilyScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useHouseholds();
  const [householdName, setHouseholdName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'CAREGIVER' | 'DEPENDENT'>('CAREGIVER');
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const primaryHousehold = data?.owned?.[0];

  const createHousehold = async () => {
    if (!householdName.trim()) {
      Alert.alert('Name required', 'Give your household a name.');
      return;
    }
    setBusy(true);
    try {
      await api.createHousehold({ name: householdName.trim() });
      setHouseholdName('');
      await refetch();
    } catch (e) {
      Alert.alert('Could not create', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  const sendInvite = async () => {
    if (!primaryHousehold) {
      Alert.alert('Create a household first');
      return;
    }
    if (!inviteEmail.trim()) {
      Alert.alert('Email required');
      return;
    }
    setBusy(true);
    try {
      await api.inviteToHousehold(primaryHousehold.id, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        scopes: ['EMERGENCY_VIEW', 'REPORTS_VIEW'],
      });
      setInviteEmail('');
      Alert.alert('Invite sent', 'They can accept it from Family once signed in.');
      await refetch();
    } catch (e) {
      Alert.alert('Invite failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Family & Care" showBack onBack={() => router.back()} />

      <Text style={styles.hint}>
        Invite caregivers or dependents. Access is grant-scoped, revocable, and audited. Shared
        views currently cover emergency cards and health reports.
      </Text>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.md }} />}
      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      {(data?.pendingInvites ?? []).length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Pending invites</Text>
          {data!.pendingInvites.map((inv) => (
            <Card key={inv.id} style={styles.inviteCard}>
              <Text style={styles.rowName}>{inv.household.name}</Text>
              <Text style={styles.rowMeta}>Role: {inv.role}</Text>
              <View style={styles.inviteActions}>
                <Pressable
                  style={styles.acceptBtn}
                  onPress={async () => {
                    await api.acceptHouseholdInvite(inv.id);
                    refetch();
                  }}
                >
                  <Text style={styles.acceptText}>Accept</Text>
                </Pressable>
                <Pressable
                  style={styles.declineBtn}
                  onPress={async () => {
                    await api.declineHouseholdInvite(inv.id);
                    refetch();
                  }}
                >
                  <Text style={styles.declineText}>Decline</Text>
                </Pressable>
              </View>
            </Card>
          ))}
        </>
      ) : null}

      {(data?.grantsReceived ?? []).length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>People you can support</Text>
          {data!.grantsReceived.map((g) => (
            <Card key={g.id} style={styles.rowCard}>
              <Text style={styles.rowName}>{g.owner?.name ?? 'Member'}</Text>
              <Text style={styles.rowMeta}>
                {g.scope.replace(/_/g, ' ')} · {g.owner?.email}
              </Text>
              <View style={styles.linkRow}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/emergency-info' as never,
                      params: { forUserId: g.ownerUserId },
                    })
                  }
                >
                  <Text style={styles.link}>Emergency card</Text>
                </Pressable>
                {(g.scope === 'REPORTS_VIEW' || g.scope === 'FULL_READ') && (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/health-reports' as never,
                        params: { forUserId: g.ownerUserId },
                      })
                    }
                  >
                    <Text style={styles.link}>Reports</Text>
                  </Pressable>
                )}
              </View>
            </Card>
          ))}
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Your household</Text>
      {primaryHousehold ? (
        <Card style={styles.rowCard}>
          <Text style={styles.rowName}>{primaryHousehold.name}</Text>
          <Text style={styles.rowMeta}>
            {(primaryHousehold.members ?? []).length} member(s) ·{' '}
            {(primaryHousehold.grants ?? []).filter((g) => g.active).length} active grant(s)
          </Text>
          {(primaryHousehold.members ?? [])
            .filter((m) => m.role !== 'OWNER')
            .map((m) => (
              <Text key={m.id} style={styles.memberLine}>
                • {m.user?.name ?? m.inviteEmail ?? 'Invite'} — {m.role} ({m.status})
              </Text>
            ))}
          {(primaryHousehold.grants ?? [])
            .filter((g) => g.active)
            .map((g) => (
              <View key={g.id} style={styles.grantRow}>
                <Text style={styles.memberLine}>
                  Grant: {g.caregiver?.email ?? g.caregiverUserId} · {g.scope}
                </Text>
                <Pressable
                  onPress={async () => {
                    await api.revokeCareGrant(g.id);
                    refetch();
                  }}
                >
                  <Text style={styles.revoke}>Revoke</Text>
                </Pressable>
              </View>
            ))}
        </Card>
      ) : (
        <>
          <Field
            label="Household name"
            value={householdName}
            onChangeText={setHouseholdName}
            placeholder="e.g. Garcia family"
          />
          <GradientButton
            title={busy ? 'Creating…' : 'Create household'}
            onPress={createHousehold}
            disabled={busy}
          />
        </>
      )}

      {primaryHousehold ? (
        <>
          <Text style={styles.sectionTitle}>Invite someone</Text>
          <Field
            label="Email"
            value={inviteEmail}
            onChangeText={setInviteEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="caregiver@example.com"
          />
          <View style={styles.roleRow}>
            {(['CAREGIVER', 'DEPENDENT'] as const).map((role) => (
              <Pressable
                key={role}
                style={[styles.roleChip, inviteRole === role && styles.roleChipOn]}
                onPress={() => setInviteRole(role)}
              >
                <Text style={[styles.roleText, inviteRole === role && styles.roleTextOn]}>
                  {role === 'CAREGIVER' ? 'Caregiver' : 'Dependent'}
                </Text>
              </Pressable>
            ))}
          </View>
          <GradientButton
            title={busy ? 'Sending…' : 'Send invite'}
            onPress={sendInvite}
            disabled={busy}
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  errorCard: {
    borderColor: colors.warning,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.caption, color: colors.warning },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  inviteCard: { marginBottom: spacing.sm },
  rowCard: { marginBottom: spacing.sm },
  rowName: { ...typography.body, color: colors.text, fontWeight: '600' },
  rowMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  memberLine: { ...typography.caption, color: colors.text, marginTop: spacing.xs },
  grantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  revoke: { ...typography.caption, color: colors.danger, fontWeight: '600' },
  inviteActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  acceptBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  acceptText: { ...typography.caption, color: '#fff', fontWeight: '700' },
  declineBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  declineText: { ...typography.caption, color: colors.textSecondary },
  linkRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  link: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  roleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleChipOn: { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: colors.primary },
  roleText: { ...typography.caption, color: colors.textSecondary },
  roleTextOn: { color: colors.primary, fontWeight: '700' },
});
