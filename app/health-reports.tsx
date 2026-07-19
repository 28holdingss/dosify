import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { GradientButton } from '@/components/ui/GradientButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useReports } from '@/hooks/useApi';
import { api } from '@/lib/api';
import type { HealthReportKind } from '@/types/api';

const KINDS: Array<{ kind: HealthReportKind; label: string; hint: string }> = [
  { kind: 'CLINICIAN_SUMMARY', label: 'Clinician summary', hint: 'Readable overview for visits' },
  { kind: 'CABINET_CSV', label: 'Cabinet CSV', hint: 'Active and past medicines' },
  { kind: 'DOSES_CSV', label: 'Doses CSV', hint: 'Adherence for the last 30 days' },
  { kind: 'SYMPTOMS_CSV', label: 'Symptoms CSV', hint: 'Logged symptoms in range' },
];

export default function HealthReportsScreen() {
  const router = useRouter();
  const { forUserId } = useLocalSearchParams<{ forUserId?: string }>();
  const { data: reports, loading, error, refetch } = useReports(forUserId);
  const [busyKind, setBusyKind] = useState<HealthReportKind | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const generate = async (kind: HealthReportKind) => {
    setBusyKind(kind);
    try {
      const report = await api.generateReport({
        kind,
        forUserId: forUserId || undefined,
      });
      setPreview(report.content);
      await refetch();
      await Share.share({
        message: report.content.slice(0, 8000),
        title: report.title,
      });
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusyKind(null);
    }
  };

  const openReport = async (id: string) => {
    try {
      const report = await api.getReport(id);
      setPreview(report.content);
      await Share.share({ message: report.content.slice(0, 8000), title: report.title });
    } catch (e) {
      Alert.alert('Could not open', e instanceof Error ? e.message : 'Try again.');
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Health Reports" showBack onBack={() => router.back()} />

      <Text style={styles.hint}>
        Exports include date range and provenance. They are for personal or clinician discussion —
        not a diagnosis.
      </Text>

      {KINDS.map((item) => (
        <Pressable
          key={item.kind}
          style={styles.kindBtn}
          onPress={() => generate(item.kind)}
          disabled={busyKind != null}
        >
          <View style={styles.kindCopy}>
            <Text style={styles.kindLabel}>{item.label}</Text>
            <Text style={styles.kindHint}>{item.hint}</Text>
          </View>
          {busyKind === item.kind ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Ionicons name="download-outline" size={22} color={colors.primary} />
          )}
        </Pressable>
      ))}

      <Text style={styles.sectionTitle}>Recent exports</Text>
      {loading && <ActivityIndicator color={colors.primary} />}
      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}
      {(reports ?? []).length === 0 ? (
        <Text style={styles.empty}>No exports yet.</Text>
      ) : (
        (reports ?? []).map((r) => (
          <Pressable key={r.id} onPress={() => openReport(r.id)}>
            <Card style={styles.rowCard}>
              <Text style={styles.rowName}>{r.title}</Text>
              <Text style={styles.rowMeta}>
                {r.kind} · {new Date(r.createdAt).toLocaleString()}
              </Text>
            </Card>
          </Pressable>
        ))
      )}

      {preview ? (
        <View style={styles.previewWrap}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <Card>
            <Text style={styles.preview} selectable>
              {preview.slice(0, 4000)}
              {preview.length > 4000 ? '\n…' : ''}
            </Text>
          </Card>
          <GradientButton title="Clear preview" onPress={() => setPreview(null)} />
        </View>
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
  kindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  kindCopy: { flex: 1 },
  kindLabel: { ...typography.body, color: colors.text, fontWeight: '600' },
  kindHint: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  errorCard: {
    borderColor: colors.warning,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.caption, color: colors.warning },
  empty: { ...typography.caption, color: colors.textMuted },
  rowCard: { marginBottom: spacing.sm },
  rowName: { ...typography.body, color: colors.text, fontWeight: '600' },
  rowMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  previewWrap: { marginTop: spacing.md, marginBottom: spacing.xl },
  preview: { ...typography.caption, color: colors.text, lineHeight: 18 },
});
