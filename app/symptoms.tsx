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
import { Ionicons } from '@expo/vector-icons';
import { Field } from '@/components/ui/Field';
import { GradientButton } from '@/components/ui/GradientButton';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, spacing, typography } from '@/constants/theme';
import { useSymptoms } from '@/hooks/useApi';
import { api } from '@/lib/api';

export default function SymptomsScreen() {
  const router = useRouter();
  const { data: logs, loading, error, refetch } = useSymptoms();
  const [symptom, setSymptom] = useState('');
  const [severity, setSeverity] = useState('5');
  const [notes, setNotes] = useState('');
  const [relatedMeds, setRelatedMeds] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleAdd = async () => {
    if (!symptom.trim()) {
      Alert.alert('Symptom required', 'Describe what you felt.');
      return;
    }
    const sev = Number(severity);
    setSaving(true);
    try {
      await api.createSymptom({
        symptom: symptom.trim(),
        severity: Number.isFinite(sev) ? Math.min(10, Math.max(1, Math.round(sev))) : null,
        notes: notes.trim() || null,
        relatedMeds: relatedMeds.trim() || null,
      });
      setSymptom('');
      setNotes('');
      setRelatedMeds('');
      setSeverity('5');
      await refetch();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete symptom?', 'Remove this entry from your timeline?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await api.deleteSymptom(id);
          refetch();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScreenHeader title="Symptoms" showBack onBack={() => router.back()} />

      <Text style={styles.hint}>
        Log how you feel over time. Exports can include these notes for clinician conversations.
      </Text>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.md }} />}
      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      <Field
        label="Symptom"
        value={symptom}
        onChangeText={setSymptom}
        placeholder="Headache, nausea, dizziness…"
      />
      <Field
        label="Severity (1–10)"
        value={severity}
        onChangeText={setSeverity}
        keyboardType="numeric"
        placeholder="5"
      />
      <Field
        label="Related medicines (optional)"
        value={relatedMeds}
        onChangeText={setRelatedMeds}
        placeholder="Names from your cabinet"
      />
      <Field
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="Context, timing, food…"
      />
      <GradientButton title={saving ? 'Saving…' : 'Log symptom'} onPress={handleAdd} disabled={saving} />

      <Text style={styles.sectionTitle}>Recent</Text>
      {(logs ?? []).length === 0 ? (
        <Text style={styles.empty}>No symptoms logged yet.</Text>
      ) : (
        (logs ?? []).map((log) => (
          <Card key={log.id} style={styles.rowCard}>
            <View style={styles.rowMain}>
              <Text style={styles.rowName}>
                {log.symptom}
                {log.severity != null ? ` · ${log.severity}/10` : ''}
              </Text>
              <Text style={styles.rowMeta}>
                {new Date(log.occurredAt).toLocaleString()}
                {log.relatedMeds ? ` · ${log.relatedMeds}` : ''}
              </Text>
              {log.notes ? <Text style={styles.rowNotes}>{log.notes}</Text> : null}
            </View>
            <Pressable onPress={() => handleDelete(log.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </Card>
        ))
      )}
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
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  empty: { ...typography.caption, color: colors.textMuted },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  rowMain: { flex: 1 },
  rowName: { ...typography.body, color: colors.text, fontWeight: '600' },
  rowMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  rowNotes: { ...typography.caption, color: colors.text, marginTop: spacing.xs },
});
