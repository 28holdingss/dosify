import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ApiBanner,
  HealthStatusPanel,
  IndicatorCard,
  SpatialHeader,
  SpatialListRow,
  SpatialScreen,
  SpatialSection,
} from '@/components/spatial';
import { useSpatialColorScheme, useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  getRiskColor,
  indicatorIcons,
  radius,
  spacing,
  typography,
} from '@/constants/theme';
import { useDashboard, useDailySnapshot } from '@/hooks/useApi';
import { useIsDesktopWeb } from '@/hooks/useResponsiveLayout';
import {
  cabinetItemLabel,
  formatRelativeTime,
  formatTime,
  riskLevelToLabel,
} from '@/lib/format';
import { getSubstanceIcon } from '@/lib/substance-icons';
import type { Interaction, IntakeLog, RiskLevel } from '@/types/api';

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

function riskLevelToScore(level: RiskLevel) {
  if (level === 'HIGH') return 85;
  if (level === 'MODERATE') return 55;
  return 25;
}

function intakeRoute(intake: IntakeLog) {
  if (intake.status === 'ANALYZED' && intake.analysis) {
    return { pathname: '/analysis' as const, params: { intakeId: intake.id } };
  }
  return {
    pathname: '/log-intake' as const,
    params: { substanceId: intake.substance.id },
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const theme = useSpatialTheme();
  const colorScheme = useSpatialColorScheme();
  const isDesktop = useIsDesktopWeb();
  const { data, loading, error, refetch } = useDashboard();
  const {
    data: snapshot,
    refetch: refetchSnapshot,
  } = useDailySnapshot();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchSnapshot();
    }, [refetch, refetchSnapshot])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchSnapshot()]);
    setRefreshing(false);
  }, [refetch, refetchSnapshot]);

  const indicators = data?.indicators ?? {
    cognitiveLoad: 0,
    cardioLoad: 0,
    sleepImpact: 0,
    alcoholExposure: 0,
  };

  const metrics = useMemo(
    () => [
      {
        key: 'cognitiveLoad',
        title: 'Cognitive Load',
        description: 'Mental strain from recent intake.',
        score: indicators.cognitiveLoad,
        route: '/insights',
        ...indicatorIcons.cognitiveLoad,
      },
      {
        key: 'cardioLoad',
        title: 'Cardio Load',
        description: 'Heart strain and recovery status.',
        score: indicators.cardioLoad,
        route: '/recovery',
        ...indicatorIcons.cardioLoad,
      },
      {
        key: 'sleepImpact',
        title: 'Sleep Impact',
        description: 'Effect on sleep quality.',
        score: indicators.sleepImpact,
        route: '/trends',
        ...indicatorIcons.sleepImpact,
      },
      {
        key: 'alcoholExposure',
        title: 'Alcohol Exposure',
        description: 'Recent alcohol load level.',
        score: indicators.alcoholExposure,
        route: '/substance-calendar',
        ...indicatorIcons.alcoholExposure,
      },
    ],
    [indicators]
  );

  const cardGap = spacing.sm;
  const indicatorRows = isDesktop
    ? [metrics]
    : [metrics.slice(0, 2), metrics.slice(2, 4)];

  const recentIntakes = data?.recentIntakes ?? [];
  const interactions = data?.interactions ?? [];
  const alertPreview = interactions.slice(0, 3);
  const hasLogs = recentIntakes.length > 0;
  const interactionRisk = data?.interactionRiskLevel ?? 'LOW';
  const alertCount = data?.interactionAlertCount ?? 0;
  const upcomingDoses = snapshot?.doses.upcoming?.slice(0, 3) ?? [];
  const dueCount =
    (snapshot?.doses.counts.due ?? 0) + (snapshot?.doses.counts.snoozed ?? 0);

  return (
    <SpatialScreen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.accent}
        />
      }
    >
      <SpatialHeader
        name={data ? firstName(data.userName) : '…'}
        showBell
        notificationCount={data?.unreadNotificationCount ?? 0}
        onBellPress={() => router.push('/notifications')}
      />

      {error && (
        <ApiBanner message="Could not load dashboard. Is the API running?" />
      )}

      {loading && !data && (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.accent} />
        </View>
      )}

      {(data || !loading) && (
        <>
          <SpatialSection title="Health Status" layout="plain">
            <HealthStatusPanel
              score={data?.healthScore ?? 0}
              intakeCount={data?.todayIntakeCount}
              hasLogs={hasLogs}
              variant={colorScheme === 'light' ? 'light' : 'dark'}
              onLogIntake={() => router.push('/log-search')}
              onPress={() => router.push('/insights')}
            />
          </SpatialSection>

          <SpatialSection
            title="Key Indicators"
            layout="plain"
            headerAction={
              <Pressable onPress={() => router.push('/insights')}>
                <Text style={[styles.seeAll, { color: theme.accent }]}>See all</Text>
              </Pressable>
            }
          >
            <View style={styles.grid}>
              {indicatorRows.map((row, rowIndex) => (
                <View
                  key={rowIndex}
                  style={[
                    styles.gridRow,
                    { gap: cardGap },
                    rowIndex > 0 && { marginTop: cardGap },
                  ]}
                >
                  {row.map((metric) => (
                    <IndicatorCard
                      key={metric.key}
                      title={metric.title}
                      description={metric.description}
                      score={metric.score}
                      icon={metric.icon}
                      iconBg={metric.bg}
                      iconColor={metric.color}
                      onPress={() => router.push(metric.route as never)}
                    />
                  ))}
                </View>
              ))}
            </View>
          </SpatialSection>

          <SpatialSection
            title="Today's Doses"
            headerAction={
              <Pressable onPress={() => router.push('/todays-doses' as never)}>
                <Text style={[styles.seeAll, { color: theme.accent }]}>
                  {dueCount > 0 ? `${dueCount} due` : 'See all'}
                </Text>
              </Pressable>
            }
          >
            {upcomingDoses.length === 0 ? (
              <SpatialListRow
                title="No upcoming doses"
                subtitle="Add a schedule in Health Cabinet"
                icon="alarm-outline"
                onPress={() => router.push('/health-cabinet' as never)}
                isLast
              />
            ) : (
              upcomingDoses.map((dose, index, list) => {
                const item = dose.cabinetItem;
                const name = item ? cabinetItemLabel(item) : 'Dose';
                const icon = getSubstanceIcon(
                  item?.substance?.name ?? name,
                  item?.substance?.category?.slug
                );
                return (
                  <SpatialListRow
                    key={dose.id}
                    title={name}
                    subtitle={`${formatTime(dose.scheduledFor)} · ${dose.status}`}
                    icon={icon.icon}
                    isLast={index === list.length - 1}
                    onPress={() => router.push('/todays-doses' as never)}
                  />
                );
              })
            )}
          </SpatialSection>

          <View style={isDesktop && styles.splitRow}>
            <View style={isDesktop && styles.splitCol}>
              <SpatialSection
                title="Recent Activity"
                headerAction={
                  recentIntakes.length > 0 ? (
                    <Pressable onPress={() => router.push('/log')}>
                      <Text style={[styles.seeAll, { color: theme.accent }]}>See all</Text>
                    </Pressable>
                  ) : undefined
                }
              >
                {recentIntakes.length === 0 ? (
                  <SpatialListRow
                    title="No intakes yet"
                    subtitle="Log a substance to start tracking"
                    icon="add-circle-outline"
                    onPress={() => router.push('/log-search')}
                    isLast
                  />
                ) : (
                  recentIntakes.slice(0, 3).map((intake, index, list) => {
                    const icon = getSubstanceIcon(
                      intake.substance.name,
                      intake.substance.category?.slug
                    );
                    const score = intake.analysis?.overallScore;
                    return (
                      <SpatialListRow
                        key={intake.id}
                        title={intake.substance.name}
                        subtitle={`${intake.dose} ${intake.unit} · ${formatRelativeTime(intake.takenAt)}`}
                        icon={icon.icon}
                        value={score !== undefined ? score : undefined}
                        valueColor={score !== undefined ? getRiskColor(score) : undefined}
                        isLast={index === list.length - 1}
                        onPress={() => router.push(intakeRoute(intake) as never)}
                      />
                    );
                  })
                )}
              </SpatialSection>
            </View>

            <View style={isDesktop && styles.splitCol}>
              <SpatialSection
                title="Alerts"
                headerAction={
                  alertCount > 0 ? (
                    <Pressable onPress={() => router.push('/interaction-check')}>
                      <Text style={[styles.seeAll, { color: theme.accent }]}>View all</Text>
                    </Pressable>
                  ) : undefined
                }
              >
                {alertCount === 0 ? (
                  <SpatialListRow
                    title="No active alerts"
                    subtitle="Your recent logs look clear"
                    icon="checkmark-circle-outline"
                    iconColor={colors.success}
                    showChevron={false}
                    isLast
                  />
                ) : (
                  <>
                    {alertPreview.map((interaction: Interaction, index) => (
                      <SpatialListRow
                        key={interaction.id}
                        title={interaction.title}
                        subtitle={`${riskLevelToLabel(interaction.riskLevel)} · ${interaction.substanceA.name} + ${interaction.substanceB.name}`}
                        icon="warning-outline"
                        iconColor={getRiskColor(riskLevelToScore(interaction.riskLevel))}
                        value={riskLevelToLabel(interaction.riskLevel)}
                        valueColor={getRiskColor(riskLevelToScore(interaction.riskLevel))}
                        isLast={index === alertPreview.length - 1 && alertCount <= 3}
                        onPress={() => router.push('/interaction-check')}
                      />
                    ))}
                    {alertCount > 3 && (
                      <SpatialListRow
                        title={`${alertCount - 3} more alert${alertCount - 3 === 1 ? '' : 's'}`}
                        subtitle={`${riskLevelToLabel(interactionRisk)} risk overall`}
                        icon="ellipsis-horizontal"
                        isLast
                        onPress={() => router.push('/interaction-check')}
                      />
                    )}
                  </>
                )}
              </SpatialSection>
            </View>
          </View>

          <SpatialSection title="Quick Actions" layout="plain">
            <View style={styles.actionsRow}>
              {[
                { label: 'Log Intake', icon: 'add-circle-outline' as const, route: '/log-search' },
                {
                  label: 'Check first',
                  icon: 'shield-checkmark-outline' as const,
                  route: '/check-before-taking',
                },
                {
                  label: 'Ask AI',
                  icon: 'sparkles-outline' as const,
                  route: '/ai',
                },
              ].map((action) => (
                <Pressable
                  key={action.label}
                  onPress={() => router.push(action.route as never)}
                  style={({ pressed }) => [
                    styles.actionTile,
                    {
                      backgroundColor:
                        colorScheme === 'light'
                          ? 'rgba(255,255,255,0.55)'
                          : 'rgba(28, 32, 44, 0.5)',
                      borderColor:
                        colorScheme === 'light'
                          ? 'rgba(255,255,255,0.9)'
                          : 'rgba(255,255,255,0.14)',
                    },
                    pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <View style={[styles.actionIcon, { backgroundColor: `${theme.accent}1A` }]}>
                    <Ionicons name={action.icon} size={18} color={theme.accent} />
                  </View>
                  <Text style={[styles.actionLabel, { color: theme.text }]} numberOfLines={1}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </SpatialSection>
        </>
      )}
    </SpatialScreen>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  seeAll: {
    ...typography.caption,
    fontWeight: '600',
  },
  grid: {
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    width: '100%',
  },
  splitRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  splitCol: {
    flex: 1,
    minWidth: 0,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionTile: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 140,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...typography.caption,
    fontWeight: '600',
    flexShrink: 1,
  },
});
