import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Field } from '@/components/ui/Field';
import { GradientButton } from '@/components/ui/GradientButton';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, spacing, typography } from '@/constants/theme';
import { useEmergencyContacts } from '@/hooks/useApi';
import { api } from '@/lib/api';

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const { data: contacts, loading, error, refetch } = useEmergencyContacts();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Enter the contact’s name.');
      return;
    }
    setSaving(true);
    try {
      await api.createEmergencyContact({
        name: name.trim(),
        relationship: relationship.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        isPrimary,
      });
      setName('');
      setRelationship('');
      setPhone('');
      setEmail('');
      setIsPrimary(false);
      await refetch();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, label: string) => {
    Alert.alert('Remove contact?', `Remove ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await api.deleteEmergencyContact(id);
          refetch();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScreenHeader title="Emergency Contacts" showBack onBack={() => router.back()} />

      {loading && <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.md }} />}
      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      {(contacts ?? []).map((ct) => (
        <Card key={ct.id} style={styles.rowCard}>
          <View style={styles.rowMain}>
            <Text style={styles.rowName}>
              {ct.name}
              {ct.isPrimary ? ' · Primary' : ''}
            </Text>
            <Text style={styles.rowMeta}>
              {[ct.relationship, ct.phone, ct.email].filter(Boolean).join(' · ') || 'No details'}
            </Text>
          </View>
          <Pressable onPress={() => handleDelete(ct.id, ct.name)} hitSlop={8}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </Card>
      ))}

      <Text style={styles.sectionTitle}>Add contact</Text>
      <Field label="Name" value={name} onChangeText={setName} placeholder="Full name" />
      <Field
        label="Relationship"
        value={relationship}
        onChangeText={setRelationship}
        placeholder="Spouse, parent, doctor…"
      />
      <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="+1…" />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="optional"
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Primary contact</Text>
        <Switch value={isPrimary} onValueChange={setIsPrimary} />
      </View>
      <GradientButton title={saving ? 'Saving…' : 'Add contact'} onPress={handleAdd} disabled={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorCard: {
    borderColor: colors.warning,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.caption, color: colors.warning },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  rowMain: { flex: 1 },
  rowName: { ...typography.body, color: colors.text, fontWeight: '600' },
  rowMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  switchLabel: { ...typography.body, color: colors.text },
});
