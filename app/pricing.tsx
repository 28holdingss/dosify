import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import { GradientButton } from '@/components/ui/GradientButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useProfile } from '@/hooks/useApi';
import { ApiError, api } from '@/lib/api';
import type { BillingPeriod } from '@/types/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

WebBrowser.maybeCompleteAuthSession();

type FeatureValue = string | boolean;

type ComparisonRow = {
  feature: string;
  free: FeatureValue;
  pro: FeatureValue;
  highlight?: boolean;
};

const COMPARISON: ComparisonRow[] = [
  { feature: 'Medications & substances', free: '10 max', pro: 'Unlimited', highlight: true },
  { feature: 'History', free: '7 days', pro: 'Unlimited', highlight: true },
  { feature: 'Medication reminders', free: 'Basic', pro: 'Advanced & smart' },
  { feature: 'Interaction checker', free: 'Basic lookup', pro: 'AI-powered analysis' },
  { feature: 'AI Assistant', free: '2 questions/day', pro: 'Unlimited', highlight: true },
  { feature: 'Recovery timelines', free: false, pro: true },
  { feature: 'Schedule optimization', free: false, pro: true },
  { feature: 'Unlimited logging', free: false, pro: true },
  { feature: 'Unlimited interaction checks', free: false, pro: true },
  { feature: 'AI health insights & patterns', free: false, pro: true },
  { feature: 'Health reports (PDF export)', free: false, pro: true },
  { feature: 'Wearable integration', free: false, pro: true },
  { feature: 'Family sharing', free: false, pro: true },
  { feature: 'Priority support', free: false, pro: true },
];

const PRO_HIGHLIGHTS = [
  { icon: 'infinite-outline' as const, label: 'Unlimited meds & history' },
  { icon: 'sparkles-outline' as const, label: 'Unlimited AI conversations' },
  { icon: 'analytics-outline' as const, label: 'Health insights & reports' },
  { icon: 'watch-outline' as const, label: 'Apple Health & wearables' },
];

function CellValue({ value, emphasized }: { value: FeatureValue; emphasized?: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
    ) : (
      <Ionicons name="close-circle" size={20} color={colors.textMuted} />
    );
  }

  return (
    <Text
      style={[
        styles.cellText,
        emphasized && styles.cellTextPro,
        !emphasized && styles.cellTextFree,
      ]}
    >
      {value}
    </Text>
  );
}

function platformForCheckout(): 'web' | 'native' {
  return Platform.OS === 'web' ? 'web' : 'native';
}

function sessionIdFromReturnUrl(url: string): string | null {
  try {
    const parsed = new URL(url.replace(/^dosify:\//, 'https://dosify.app/'));
    return parsed.searchParams.get('session_id');
  } catch {
    const match = /session_id=([^&]+)/.exec(url);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
}

export default function PricingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ checkout?: string; session_id?: string }>();
  const { data: user, refetch } = useProfile();
  const [period, setPeriod] = useState<BillingPeriod>('yearly');
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const toggleX = useSharedValue(1);
  const isPremium = Boolean(user?.isPremium);

  useEffect(() => {
    toggleX.value = withSpring(period === 'yearly' ? 1 : 0, { damping: 18, stiffness: 220 });
  }, [period, toggleX]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: toggleX.value * 108 }],
  }));

  const setBilling = (next: BillingPeriod) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPeriod(next);
  };

  const finalizeCheckout = useCallback(
    async (sessionId: string) => {
      try {
        const result = await api.confirmCheckoutSession(sessionId);
        await refetch();
        if (result.isPremium) {
          setBanner('Welcome to Dosify Pro — your subscription is active.');
        } else {
          setBanner(
            'Payment received. Pro access will unlock in a moment — pull to refresh if needed.'
          );
        }
      } catch (e) {
        const message = e instanceof ApiError ? e.message : 'Could not confirm checkout';
        setBanner(message);
      }
    },
    [refetch]
  );

  useEffect(() => {
    if (params.checkout === 'cancel') {
      setBanner('Checkout canceled. You can upgrade anytime.');
      return;
    }
    if (params.checkout === 'success' && typeof params.session_id === 'string') {
      void finalizeCheckout(params.session_id);
    }
  }, [params.checkout, params.session_id, finalizeCheckout]);

  const openBillingUrl = async (url: string) => {
    if (Platform.OS === 'web') {
      window.location.href = url;
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(url, 'dosify://pricing');
    if (result.type === 'success' && result.url) {
      if (result.url.includes('checkout=cancel')) {
        setBanner('Checkout canceled. You can upgrade anytime.');
        return;
      }
      const sessionId = sessionIdFromReturnUrl(result.url);
      if (sessionId) {
        await finalizeCheckout(sessionId);
      } else {
        await refetch();
        setBanner('Returned from Stripe — refreshing your plan…');
      }
    }
  };

  const onManage = async () => {
    if (busy) return;
    setBusy(true);
    setBanner(null);
    try {
      const { url } = await api.createPortalSession({ platform: platformForCheckout() });
      await openBillingUrl(url);
      await refetch();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Could not open the billing portal.';
      if (Platform.OS === 'web') {
        setBanner(message);
      } else {
        Alert.alert('Billing portal', message);
      }
    } finally {
      setBusy(false);
    }
  };

  const onUpgrade = async () => {
    if (busy) return;

    if (isPremium) {
      await onManage();
      return;
    }

    setBusy(true);
    setBanner(null);
    try {
      const { url } = await api.createCheckoutSession({
        period,
        platform: platformForCheckout(),
      });
      await openBillingUrl(url);
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : 'Could not start checkout. Check your connection and try again.';
      if (Platform.OS === 'web') {
        setBanner(message);
      } else {
        Alert.alert('Checkout unavailable', message);
      }
    } finally {
      setBusy(false);
    }
  };

  const priceLabel = period === 'yearly' ? '$59.99' : '$8.99';
  const priceUnit = period === 'yearly' ? '/year' : '/month';
  const priceHint =
    period === 'yearly' ? 'About $5/mo · Save 44%' : 'Billed monthly · Cancel anytime';

  return (
    <Screen>
      <ScreenHeader title="Pricing" showBack onBack={() => router.back()} />

      {banner ? (
        <Card style={styles.bannerCard}>
          <Text style={styles.bannerText}>{banner}</Text>
        </Card>
      ) : null}

      <Animated.View entering={FadeInDown.duration(420).springify()}>
        <LinearGradient
          colors={['rgba(59,130,246,0.22)', 'rgba(139,92,246,0.12)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroBadge}>
            <Ionicons name="diamond-outline" size={14} color={colors.text} />
            <Text style={styles.heroBadgeText}>Plans</Text>
          </View>
          <Text style={styles.heroTitle}>
            Choose how deeply{'\n'}Dosify works for you
          </Text>
          <Text style={styles.heroSub}>
            Start free. Upgrade to Pro when you need unlimited tracking, smarter reminders, and
            AI that grows with your health data.
          </Text>
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.toggleWrap}>
        <View style={styles.toggleTrack}>
          <Animated.View style={[styles.toggleThumb, thumbStyle]} />
          <Pressable
            style={styles.toggleOption}
            onPress={() => setBilling('monthly')}
            disabled={isPremium}
          >
            <Text style={[styles.toggleLabel, period === 'monthly' && styles.toggleLabelActive]}>
              Monthly
            </Text>
          </Pressable>
          <Pressable
            style={styles.toggleOption}
            onPress={() => setBilling('yearly')}
            disabled={isPremium}
          >
            <Text style={[styles.toggleLabel, period === 'yearly' && styles.toggleLabelActive]}>
              Yearly
            </Text>
          </Pressable>
        </View>
        {period === 'yearly' && !isPremium ? (
          <Text style={styles.saveHint}>Save 44% with annual billing</Text>
        ) : null}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(120).duration(450)} style={styles.plans}>
        <Card style={styles.freeCard} variant="bordered">
          <Text style={styles.planName}>Free</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>$0</Text>
            <Text style={styles.priceUnit}>forever</Text>
          </View>
          <Text style={styles.planDesc}>Core logging and basic safety checks.</Text>
          <View style={styles.planBullets}>
            <Bullet text="Up to 10 medications" />
            <Bullet text="7-day history" />
            <Bullet text="2 AI questions / day" />
          </View>
          <Pressable style={styles.secondaryCta} onPress={() => router.back()}>
            <Text style={styles.secondaryCtaText}>
              {isPremium ? 'Keep exploring' : 'Continue with Free'}
            </Text>
          </Pressable>
        </Card>

        <View style={styles.proShell}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.proBorder}
          >
            <View style={styles.proInner}>
              <View style={styles.proTop}>
                <Text style={styles.planName}>Dosify Pro</Text>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>{isPremium ? 'Active' : 'Most popular'}</Text>
                </View>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{priceLabel}</Text>
                <Text style={styles.priceUnit}>{priceUnit}</Text>
              </View>
              <Text style={styles.priceHint}>{priceHint}</Text>
              <Text style={styles.planDesc}>
                Unlimited everything — plus AI insights, recovery, wearables, and family sharing.
              </Text>

              <View style={styles.highlightGrid}>
                {PRO_HIGHLIGHTS.map((item) => (
                  <View key={item.label} style={styles.highlightItem}>
                    <View style={styles.highlightIcon}>
                      <Ionicons name={item.icon} size={16} color={colors.primary} />
                    </View>
                    <Text style={styles.highlightLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <GradientButton
                title={
                  busy
                    ? 'Please wait…'
                    : isPremium
                      ? 'Manage subscription'
                      : 'Upgrade to Dosify Pro'
                }
                onPress={isPremium ? onManage : onUpgrade}
                disabled={busy}
                style={styles.upgradeBtn}
              />
              {busy ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
              ) : null}
            </View>
          </LinearGradient>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(450)}>
        <Text style={styles.sectionTitle}>Compare features</Text>
        <Card style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeadCell, styles.featureCol]}>Feature</Text>
            <Text style={[styles.tableHeadCell, styles.planCol]}>Free</Text>
            <Text style={[styles.tableHeadCell, styles.planCol, styles.proHead]}>Pro</Text>
          </View>
          {COMPARISON.map((row, index) => (
            <View
              key={row.feature}
              style={[
                styles.tableRow,
                index < COMPARISON.length - 1 && styles.tableRowBorder,
                row.highlight && styles.tableRowHighlight,
              ]}
            >
              <Text style={[styles.featureLabel, styles.featureCol]}>{row.feature}</Text>
              <View style={styles.planCol}>
                <CellValue value={row.free} />
              </View>
              <View style={styles.planCol}>
                <CellValue value={row.pro} emphasized />
              </View>
            </View>
          ))}
        </Card>
      </Animated.View>

      <Text style={styles.footnote}>
        Secure checkout powered by Stripe. Prices shown in USD. Cancel anytime from Manage
        subscription. Final amount is confirmed at checkout.
      </Text>
    </Screen>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bullet}>
      <Ionicons name="checkmark" size={14} color={colors.textSecondary} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerCard: {
    borderColor: colors.success,
    borderWidth: 1,
    backgroundColor: 'rgba(34,197,94,0.1)',
    marginBottom: spacing.md,
  },
  bannerText: {
    ...typography.caption,
    color: colors.success,
    lineHeight: 18,
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
    overflow: 'hidden',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  heroBadgeText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    ...typography.h1,
    color: colors.text,
    lineHeight: 34,
    marginBottom: spacing.sm,
  },
  heroSub: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  toggleWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  toggleTrack: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    width: 232,
  },
  toggleThumb: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 108,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleOption: {
    width: 108,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    zIndex: 1,
  },
  toggleLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  toggleLabelActive: {
    color: colors.text,
  },
  saveHint: {
    ...typography.small,
    color: colors.success,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  plans: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  freeCard: {
    marginBottom: 0,
  },
  planName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  priceUnit: {
    ...typography.caption,
    color: colors.textMuted,
  },
  priceHint: {
    ...typography.small,
    color: colors.success,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  planDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  planBullets: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bulletText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  secondaryCta: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryCtaText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  proShell: {
    borderRadius: radius.xl + 2,
    overflow: 'hidden',
  },
  proBorder: {
    padding: 1.5,
    borderRadius: radius.xl + 2,
  },
  proInner: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  proTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  popularBadge: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  popularText: {
    ...typography.small,
    color: colors.accent,
    fontWeight: '700',
  },
  highlightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  highlightItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  highlightIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(99,102,241,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightLabel: {
    ...typography.small,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 14,
  },
  upgradeBtn: {
    marginVertical: 0,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  tableCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeadCell: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  proHead: {
    color: colors.primary,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  tableRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tableRowHighlight: {
    backgroundColor: 'rgba(99,102,241,0.06)',
  },
  featureCol: {
    flex: 1.4,
    paddingRight: spacing.sm,
  },
  planCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '500',
    lineHeight: 17,
  },
  cellText: {
    ...typography.caption,
    textAlign: 'center',
    fontWeight: '600',
  },
  cellTextFree: {
    color: colors.textSecondary,
  },
  cellTextPro: {
    color: colors.text,
  },
  footnote: {
    ...typography.small,
    color: colors.textMuted,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
});
