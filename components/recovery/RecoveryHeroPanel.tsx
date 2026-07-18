import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { CircularGauge } from '@/components/ui/CircularGauge';
import { getRecoveryColor, getRecoveryLabel, radius, spacing, typography } from '@/constants/theme';
import { formatRecoveryTime, hoursUntil, recoveryCountdownProgress } from '@/lib/format';

type RecoveryHeroPanelProps = {
  score: number;
  estimatedRecoveryAt: string | null | undefined;
  variant?: 'light' | 'dark';
};

export function RecoveryHeroPanel({
  score,
  estimatedRecoveryAt,
  variant = 'dark',
}: RecoveryHeroPanelProps) {
  const theme = useSpatialTheme();
  const statusLabel = getRecoveryLabel(score);
  const statusColor = getRecoveryColor(score);
  const countdownPct = recoveryCountdownProgress(estimatedRecoveryAt);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        panel: {
          backgroundColor: theme.card,
          borderRadius: radius.xl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.separator,
          padding: spacing.lg,
          marginBottom: spacing.lg,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.14,
          shadowRadius: 14,
          elevation: 5,
        },
        topRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.lg,
        },
        gaugeWrap: {
          alignItems: 'center',
        },
        info: {
          flex: 1,
          gap: spacing.sm,
        },
        badge: {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: spacing.md,
          paddingVertical: 5,
          borderRadius: radius.full,
          backgroundColor: `${statusColor}22`,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: `${statusColor}55`,
        },
        badgeText: {
          ...typography.small,
          fontWeight: '700',
          color: statusColor,
          letterSpacing: 0.3,
        },
        title: {
          ...typography.h3,
          color: theme.text,
          fontWeight: '700',
        },
        desc: {
          ...typography.caption,
          color: theme.textSecondary,
          lineHeight: 20,
        },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: theme.separator,
          marginVertical: spacing.lg,
        },
        etaRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.md,
        },
        etaIcon: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: `${theme.accent}18`,
          alignItems: 'center',
          justifyContent: 'center',
        },
        etaCopy: {
          flex: 1,
          gap: 4,
        },
        etaLabel: {
          ...typography.small,
          color: theme.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        },
        etaValue: {
          fontSize: 20,
          fontWeight: '700',
          color: theme.text,
        },
        etaSub: {
          ...typography.caption,
          color: theme.textSecondary,
        },
        progressTrack: {
          height: 4,
          backgroundColor: theme.pressed,
          borderRadius: radius.full,
          overflow: 'hidden',
          marginTop: spacing.md,
        },
        progressFill: {
          height: '100%',
          borderRadius: radius.full,
          backgroundColor: statusColor,
        },
      }),
    [theme, statusColor],
  );

  return (
    <View style={styles.panel}>
      <View style={styles.topRow}>
        <View style={styles.gaugeWrap}>
          <CircularGauge
            value={score}
            suffix="%"
            label="Recovered"
            showRisk={false}
            mode="recovery"
            riskRing
            variant={variant}
            size={128}
          />
        </View>
        <View style={styles.info}>
          <View style={styles.badge}>
            <Ionicons name="pulse" size={12} color={statusColor} />
            <Text style={styles.badgeText}>{statusLabel.toUpperCase()}</Text>
          </View>
          <Text style={styles.title}>Recovery Score</Text>
          <Text style={styles.desc}>
            Based on recent intakes, substance half-lives, and wearable data when synced.
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.etaRow}>
        <View style={styles.etaIcon}>
          <Ionicons name="time-outline" size={18} color={theme.accent} />
        </View>
        <View style={styles.etaCopy}>
          <Text style={styles.etaLabel}>Full recovery estimated</Text>
          <Text style={styles.etaValue}>{formatRecoveryTime(estimatedRecoveryAt)}</Text>
          <Text style={styles.etaSub}>{hoursUntil(estimatedRecoveryAt)}</Text>
        </View>
      </View>

      {estimatedRecoveryAt && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${countdownPct}%` }]} />
        </View>
      )}
    </View>
  );
}
