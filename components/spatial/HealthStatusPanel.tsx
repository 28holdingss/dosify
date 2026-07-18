import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { CircularGauge } from '@/components/ui/CircularGauge';
import { getRiskColor, getRiskLabel, radius, spacing, typography } from '@/constants/theme';

type HealthStatusPanelProps = {
  score: number;
  intakeCount?: number;
  hasLogs?: boolean;
  variant?: 'light' | 'dark';
  onLogIntake?: () => void;
};

export function HealthStatusPanel({
  score,
  intakeCount,
  hasLogs = true,
  variant = 'dark',
  onLogIntake,
}: HealthStatusPanelProps) {
  const theme = useSpatialTheme();
  const riskLabel = getRiskLabel(score);
  const riskColor = getRiskColor(score);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.lg,
          gap: spacing.xl,
        },
        accent: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: riskColor,
          opacity: 0.65,
        },
        gaugeWrap: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        info: {
          flex: 1,
          justifyContent: 'center',
          gap: spacing.xs,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          flexWrap: 'wrap',
        },
        badge: {
          paddingHorizontal: spacing.sm,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: `${riskColor}22`,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: `${riskColor}55`,
        },
        badgeText: {
          fontSize: 10,
          fontWeight: '700',
          color: riskColor,
          letterSpacing: 0.5,
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
        footerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          marginTop: spacing.sm,
          flexWrap: 'wrap',
        },
        cta: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          paddingHorizontal: spacing.md,
          paddingVertical: 7,
          borderRadius: radius.full,
          backgroundColor: `${theme.accent}1F`,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: `${theme.accent}55`,
        },
        ctaPressed: {
          opacity: 0.75,
        },
        ctaText: {
          fontSize: 12,
          fontWeight: '600',
          color: theme.accent,
        },
        meta: {
          ...typography.small,
          color: theme.textMuted,
        },
        metaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
      }),
    [theme, riskColor],
  );

  const summary = !hasLogs
    ? 'Log your first intake to get a personalized health score.'
    : intakeCount === 0
      ? 'Nothing logged today — your score reflects recent activity.'
      : `${intakeCount} intake${intakeCount === 1 ? '' : 's'} logged today.`;

  const showCta = onLogIntake && (!hasLogs || intakeCount === 0);

  return (
    <View style={styles.row}>
      <View style={styles.accent} />
      <View style={styles.gaugeWrap}>
        <CircularGauge
          value={score}
          label="/100"
          showRisk={false}
          riskRing
          variant={variant}
          size={118}
        />
      </View>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Overall Health</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{riskLabel.toUpperCase()} RISK</Text>
          </View>
        </View>
        <Text style={styles.desc}>{summary}</Text>
        <View style={styles.footerRow}>
          {showCta ? (
            <Pressable
              onPress={onLogIntake}
              style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
              accessibilityRole="button"
              accessibilityLabel="Log an intake"
            >
              <Ionicons name="add" size={14} color={theme.accent} />
              <Text style={styles.ctaText}>Log an intake</Text>
            </Pressable>
          ) : null}
          <View style={styles.metaRow}>
            <Ionicons name="sync-outline" size={11} color={theme.textMuted} />
            <Text style={styles.meta}>Updated from your latest logs</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
