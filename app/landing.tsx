import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '@/constants/theme';

const APP_STORE_URL = 'https://apps.apple.com/app/id6793530607';

const fontDisplay = Platform.select({ web: 'Syne, system-ui, sans-serif', default: undefined });
const fontBody = Platform.select({ web: '"DM Sans", system-ui, sans-serif', default: undefined });

const pillars = [
  {
    title: 'Health Cabinet',
    body: 'Track medicines and supplements with doses, refills, and schedules in one place.',
    icon: 'medkit-outline' as const,
    tint: 'rgba(59,130,246,0.18)',
    accent: '#60A5FA',
  },
  {
    title: 'Check before taking',
    body: 'See interaction context against your cabinet and profile — never an unqualified “safe.”',
    icon: 'shield-checkmark-outline' as const,
    tint: 'rgba(34,197,94,0.16)',
    accent: '#4ADE80',
  },
  {
    title: 'Daily adherence',
    body: 'Reminders, today’s doses, symptoms, and clinician-ready exports when you need them.',
    icon: 'alarm-outline' as const,
    tint: 'rgba(249,115,22,0.16)',
    accent: '#FB923C',
  },
  {
    title: 'AI insights',
    body: 'Pattern detection and clearer risk language so you can act with more confidence.',
    icon: 'sparkles-outline' as const,
    tint: 'rgba(168,85,247,0.16)',
    accent: '#C084FC',
  },
  {
    title: 'Recovery timelines',
    body: 'See how your body recovers over time with wearable context when you sync Health.',
    icon: 'pulse-outline' as const,
    tint: 'rgba(6,182,212,0.16)',
    accent: '#22D3EE',
  },
  {
    title: 'Family & care',
    body: 'Share what matters with caregivers — without handing over your whole health history.',
    icon: 'people-outline' as const,
    tint: 'rgba(244,114,182,0.16)',
    accent: '#F472B6',
  },
];

const HERO_IMAGE_ASPECT = 736 / 1104; // natural asset ratio — shows full photo, no crop

export default function LandingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const mid = width >= 640;

  // Features grid: pixel widths so RN web always gets 3 columns on desktop
  const sectionPad = wide ? 64 : spacing.xxl;
  const gridMax = 1100;
  const gridWidth = Math.min(width - sectionPad * 2, gridMax);
  const featureCols = gridWidth >= 860 ? 3 : gridWidth >= 560 ? 2 : 1;
  const featureGap = 16;
  const featureCardWidth =
    featureCols === 1
      ? gridWidth
      : (gridWidth - featureGap * (featureCols - 1)) / featureCols;

  // Narrow portrait hero so the full image height is visible
  const heroMaxWidth = wide ? 440 : mid ? 400 : Math.min(width - 32, 380);
  const heroHeight = heroMaxWidth / HERO_IMAGE_ASPECT;

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Dosify — Know your body. Make safer choices.';
    }
  }, []);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* —— Hero: narrow portrait frame, full image —— */}
        <View style={[styles.heroOuter, wide && styles.heroOuterWide]}>
          <Animated.View entering={FadeIn.duration(500)} style={styles.topBar}>
            <View style={styles.brandRow}>
              <Image
                source={require('@/assets/images/dosify.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.brand}>Dosify</Text>
            </View>
            <View style={styles.topLinks}>
              <Pressable
                onPress={() => router.push('/pricing' as never)}
                style={({ pressed }) => [styles.topLink, pressed && styles.pressed]}
                accessibilityRole="link"
              >
                <Text style={styles.topLinkText}>Pricing</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/sign-in')}
                style={({ pressed }) => [styles.topLinkStrong, pressed && styles.pressed]}
                accessibilityRole="link"
              >
                <Text style={styles.topLinkStrongText}>Log in</Text>
              </Pressable>
            </View>
          </Animated.View>

          <View style={[styles.heroStage, wide && styles.heroStageWide]}>
            <Animated.View
              entering={FadeInDown.delay(60).duration(500).springify()}
              style={[
                styles.heroFrame,
                {
                  width: heroMaxWidth,
                  height: heroHeight,
                },
              ]}
            >
              <Image
                source={require('@/assets/images/dosifybg.jpeg')}
                style={styles.heroImage}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />

              <LinearGradient
                colors={[
                  'rgba(11,14,20,0.05)',
                  'rgba(11,14,20,0.2)',
                  'rgba(11,14,20,0.75)',
                  'rgba(11,14,20,0.96)',
                ]}
                locations={[0, 0.45, 0.72, 1]}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.heroCopy}>
                <Text style={styles.headline}>
                  Know your body.{'\n'}Make safer choices.
                </Text>
                <Text style={styles.lede}>
                  Your daily medication companion — cabinet, schedules, and interaction checks with
                  clear, evidence-aware language.
                </Text>

                <View style={styles.ctaRow}>
                  <Pressable
                    style={({ pressed }) => [styles.ctaPrimary, pressed && styles.pressed]}
                    onPress={() => router.push('/sign-up')}
                    accessibilityRole="button"
                  >
                    <Text style={styles.ctaPrimaryText}>Get started free</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.ctaGhost, pressed && styles.pressed]}
                    onPress={() => Linking.openURL(APP_STORE_URL)}
                    accessibilityRole="link"
                    accessibilityLabel="Download on the App Store"
                  >
                    <Ionicons name="logo-apple" size={18} color="#fff" />
                    <Text style={styles.ctaGhostText}>App Store</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* —— Features —— */}
        <View style={[styles.section, { paddingHorizontal: sectionPad }, wide && styles.sectionWide]}>
          <Animated.View entering={FadeInUp.delay(60).duration(450)} style={{ width: gridWidth }}>
            <Text style={styles.sectionEyebrow}>Built for everyday care</Text>
            <Text style={[styles.sectionTitle, wide && styles.sectionTitleWide]}>
              Medicine tracking that stays out of the way — until you need clarity.
            </Text>
          </Animated.View>

          <View style={[styles.featureGrid, { gap: featureGap, width: gridWidth }]}>
            {pillars.map((item, i) => (
              <Animated.View
                key={item.title}
                entering={FadeInUp.delay(100 + i * 50).duration(420)}
                style={{ width: featureCardWidth }}
              >
                <FeatureCard
                  title={item.title}
                  body={item.body}
                  icon={item.icon}
                  tint={item.tint}
                  accent={item.accent}
                  onPress={() => router.push('/sign-up')}
                />
              </Animated.View>
            ))}
          </View>
        </View>

        {/* —— Closing CTA —— */}
        <View style={[styles.closeCta, wide && styles.sectionWide]}>
          <Text style={[styles.closeTitle, wide && styles.closeTitleWide]}>
            Start free. Upgrade when you need Pro.
          </Text>
          <Text style={styles.closeLede}>
            Unlimited meds, AI insights, recovery timelines, and wearables with Dosify Pro.
          </Text>
          <View style={styles.ctaRow}>
            <Pressable
              style={({ pressed }) => [styles.ctaPrimaryDark, pressed && styles.pressed]}
              onPress={() => router.push('/sign-up')}
            >
              <Text style={styles.ctaPrimaryDarkText}>Create account</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.ctaTextLink, pressed && styles.pressed]}
              onPress={() => router.push('/pricing' as never)}
            >
              <Text style={styles.ctaTextLinkLabel}>See pricing</Text>
              <Ionicons name="arrow-forward" size={16} color="#7DD3FC" />
            </Pressable>
          </View>
        </View>

        {/* —— Footer —— */}
        <View style={styles.footer}>
          <View style={[styles.footerInner, wide && styles.sectionWide]}>
            <View style={styles.footerBrand}>
              <Image
                source={require('@/assets/images/dosify.png')}
                style={styles.footerLogo}
                resizeMode="contain"
              />
              <Text style={styles.footerName}>Dosify</Text>
            </View>
            <View style={styles.footerLinks}>
              <Pressable onPress={() => router.push('/pricing' as never)}>
                <Text style={styles.footerLink}>Pricing</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/privacy' as never)}>
                <Text style={styles.footerLink}>Privacy</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/terms' as never)}>
                <Text style={styles.footerLink}>Terms</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/support' as never)}>
                <Text style={styles.footerLink}>Support</Text>
              </Pressable>
            </View>
            <Text style={styles.disclaimer}>
              Dosify is informational only and is not a substitute for professional medical advice.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function FeatureCard({
  title,
  body,
  icon,
  tint,
  accent,
  onPress,
}: {
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.featureCard, pressed && styles.featureCardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. Learn more`}
    >
      <View style={styles.featureCardTop}>
        <View style={[styles.featureIcon, { backgroundColor: tint }]}>
          <Ionicons name={icon} size={22} color={accent} />
        </View>
        <View style={styles.featureArrow}>
          <Ionicons name="arrow-up" size={14} color="rgba(255,255,255,0.55)" style={styles.featureArrowIcon} />
        </View>
      </View>

      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureBody}>{body}</Text>

      <View style={styles.featureCta}>
        <Text style={styles.featureCtaText}>Learn more</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0E14',
  },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
  heroOuter: {
    paddingTop: Platform.OS === 'web' ? 20 : 48,
    paddingHorizontal: spacing.lg,
    paddingBottom: 36,
    gap: 24,
    backgroundColor: '#0B0E14',
  },
  heroOuterWide: {
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 48,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    gap: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 4,
    width: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 11,
  },
  brand: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
    fontFamily: fontDisplay,
  },
  topLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topLink: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  topLinkText: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: fontBody,
  },
  topLinkStrong: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  topLinkStrongText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: fontBody,
  },
  heroStage: {
    width: '100%',
    alignItems: 'center',
  },
  heroStageWide: {
    paddingTop: 4,
  },
  heroFrame: {
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#152033',
    position: 'relative',
    justifyContent: 'flex-end',
    ...Platform.select({
      web: {
        boxShadow: '0 28px 64px rgba(0,0,0,0.5)',
      } as object,
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 14 },
        elevation: 10,
      },
    }),
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroCopy: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 40,
    zIndex: 1,
  },
  headline: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.9,
    marginBottom: 12,
    fontFamily: fontDisplay,
  },
  lede: {
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 22,
    fontFamily: fontBody,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  ctaPrimary: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  ctaPrimaryText: {
    color: '#0B0E14',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: fontBody,
  },
  ctaGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  ctaGhostText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: fontBody,
  },
  pressed: {
    opacity: 0.88,
  },
  section: {
    paddingTop: 72,
    paddingBottom: 56,
    backgroundColor: '#0B0E14',
    alignItems: 'center',
  },
  sectionWide: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: '#7DD3FC',
    marginBottom: 14,
    fontFamily: fontBody,
    alignSelf: 'flex-start',
    width: '100%',
  },
  sectionTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.6,
    marginBottom: 40,
    maxWidth: 540,
    fontFamily: fontDisplay,
    alignSelf: 'flex-start',
    width: '100%',
  },
  sectionTitleWide: {
    fontSize: 38,
    lineHeight: 44,
    maxWidth: 640,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
  },
  featureCard: {
    backgroundColor: '#151A24',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 280,
    flex: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 40px rgba(0,0,0,0.28)',
      } as object,
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
      },
    }),
  },
  featureCardPressed: {
    borderColor: 'rgba(125,211,252,0.35)',
    backgroundColor: '#181E2A',
  },
  featureCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureArrowIcon: {
    transform: [{ rotate: '45deg' }],
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    letterSpacing: -0.3,
    fontFamily: fontDisplay,
  },
  featureBody: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.58)',
    marginBottom: 20,
    flex: 1,
    fontFamily: fontBody,
  },
  featureCta: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  featureCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.82)',
    fontFamily: fontBody,
  },
  closeCta: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: 72,
    backgroundColor: '#0B0E14',
  },
  closeTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 12,
    maxWidth: 480,
    fontFamily: fontDisplay,
  },
  closeTitleWide: {
    fontSize: 36,
    lineHeight: 42,
  },
  closeLede: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.62)',
    marginBottom: 24,
    maxWidth: 440,
    fontFamily: fontBody,
  },
  ctaPrimaryDark: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  ctaPrimaryDarkText: {
    color: '#0B0E14',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: fontBody,
  },
  ctaTextLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  ctaTextLinkLabel: {
    color: '#7DD3FC',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: fontBody,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0B0E14',
    paddingVertical: 36,
  },
  footerInner: {
    paddingHorizontal: spacing.xxl,
    gap: 16,
    alignItems: 'flex-start',
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  footerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    fontFamily: fontDisplay,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
  footerLink: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
    fontFamily: fontBody,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.35)',
    maxWidth: 480,
    textAlign: 'left',
    fontFamily: fontBody,
  },
});
