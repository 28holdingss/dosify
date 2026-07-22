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
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '@/constants/theme';

const APP_STORE_URL = 'https://apps.apple.com/app/id6793530607';

/** Natural photo size — frame must match or the face gets cropped. */
const HERO_W = 736;
const HERO_H = 1104;
const HERO_ASPECT = HERO_W / HERO_H; // ~0.667 portrait (width/height)

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

export default function LandingScreen() {
  const router = useRouter();
  const { width: measuredWidth } = useWindowDimensions();
  // SSR / static export often reports 0 — never size from that (was baking width:-32px).
  const windowWidth = measuredWidth > 0 ? measuredWidth : 1200;

  // Pixel sizes for native + client hydration. Web also forced by #dosify-* CSS in +html.tsx.
  const wide = windowWidth >= 900;
  const pad = wide ? 64 : spacing.lg;
  const gridWidth = Math.min(windowWidth - pad * 2, 1100);
  const cols = gridWidth >= 900 ? 3 : gridWidth >= 560 ? 2 : 1;
  const gap = 16;
  const cardWidth =
    cols === 1 ? gridWidth : (gridWidth - gap * (cols - 1)) / cols;

  // Portrait image sits beside copy on desktop; stacks under on mobile.
  const heroMediaWidth = Math.min(
    wide ? 380 : windowWidth >= 640 ? 340 : Math.min(gridWidth, 320),
    Math.max(gridWidth * (wide ? 0.42 : 1), 260),
  );
  const heroMediaHeight = heroMediaWidth / HERO_ASPECT;

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
        <View style={[styles.heroOuter, { paddingHorizontal: pad, width: gridWidth + pad * 2, maxWidth: '100%' }]}>
          <View style={[styles.topBar, { width: gridWidth }]}>
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
              >
                <Text style={styles.topLinkText}>Pricing</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/sign-in')}
                style={({ pressed }) => [styles.topLinkStrong, pressed && styles.pressed]}
              >
                <Text style={styles.topLinkStrongText}>Log in</Text>
              </Pressable>
            </View>
          </View>

          {/* Split hero: copy + CTAs left, portrait image right (stacks on narrow) */}
          <View
            nativeID="dosify-hero-split"
            style={[
              styles.heroSplit,
              {
                width: gridWidth,
                flexDirection: wide ? 'row' : 'column',
                alignItems: wide ? 'center' : 'stretch',
                gap: wide ? 48 : 32,
              },
            ]}
          >
            <View style={[styles.heroCopy, wide && styles.heroCopyWide]}>
              <Text style={styles.heroEyebrow}>Daily medication companion</Text>
              <Text style={[styles.headline, wide && styles.headlineWide]}>
                Know your body.{'\n'}Make safer choices.
              </Text>
              <Text style={[styles.lede, wide && styles.ledeWide]}>
                Cabinet, schedules, and interaction checks with clear, evidence-aware language —
                so you can act with more confidence.
              </Text>
              <View style={styles.ctaRow}>
                <Pressable
                  style={({ pressed }) => [styles.ctaPrimary, pressed && styles.pressed]}
                  onPress={() => router.push('/sign-up')}
                >
                  <Text style={styles.ctaPrimaryText}>Get started free</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.ctaGhost, pressed && styles.pressed]}
                  onPress={() => Linking.openURL(APP_STORE_URL)}
                >
                  <Ionicons name="logo-apple" size={18} color="#fff" />
                  <Text style={styles.ctaGhostText}>App Store</Text>
                </Pressable>
              </View>
            </View>

            <View
              nativeID="dosify-hero-frame"
              style={[
                styles.heroFrame,
                {
                  width: heroMediaWidth,
                  height: heroMediaHeight,
                  maxWidth: '100%',
                  alignSelf: wide ? 'flex-end' : 'center',
                },
              ]}
            >
              <Image
                source={require('@/assets/images/dosifybg.jpeg')}
                style={styles.heroImage}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            </View>
          </View>
        </View>

        <View style={[styles.section, { paddingHorizontal: pad }]}>
          <View style={{ width: gridWidth, alignSelf: 'center' }}>
            <Text style={styles.sectionEyebrow}>Built for everyday care</Text>
            <Text style={styles.sectionTitle}>
              Medicine tracking that stays out of the way — until you need clarity.
            </Text>

            <View
              nativeID="dosify-feature-grid"
              style={[styles.featureGrid, { width: gridWidth, gap }]}
            >
              {pillars.map((item) => (
                <View key={item.title} style={{ width: cardWidth }}>
                  <FeatureCard
                    title={item.title}
                    body={item.body}
                    icon={item.icon}
                    tint={item.tint}
                    accent={item.accent}
                    onPress={() => router.push('/sign-up')}
                  />
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.closeCta, { paddingHorizontal: pad }]}>
          <View
            nativeID="dosify-close-split"
            style={[
              styles.closeSplit,
              {
                width: gridWidth,
                flexDirection: wide ? 'row' : 'column',
                alignItems: wide ? 'center' : 'stretch',
                gap: wide ? 56 : 36,
              },
            ]}
          >
            <View style={[styles.closeCopy, wide && styles.closeCopyWide]}>
              <Text style={styles.closeEyebrow}>Ready when you are</Text>
              <Text style={[styles.closeTitle, wide && styles.closeTitleWide]}>
                Start free.{'\n'}Upgrade when you need Pro.
              </Text>
              <Text style={styles.closeLede}>
                Keep the essentials free forever. Unlock unlimited meds, AI insights, recovery
                timelines, and wearables when you are ready.
              </Text>
              <View style={styles.ctaRow}>
                <Pressable
                  style={({ pressed }) => [styles.ctaPrimaryDark, pressed && styles.pressed]}
                  onPress={() => router.push('/sign-up')}
                >
                  <Text style={styles.ctaPrimaryDarkText}>Create account</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.ctaGhost, pressed && styles.pressed]}
                  onPress={() => router.push('/pricing' as never)}
                >
                  <Text style={styles.ctaGhostText}>See pricing</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </Pressable>
              </View>
            </View>

            <View style={[styles.closePanel, wide && styles.closePanelWide]}>
              <Text style={styles.closePanelLabel}>Dosify Pro includes</Text>
              {(
                [
                  { icon: 'infinite-outline' as const, label: 'Unlimited meds & history' },
                  { icon: 'sparkles-outline' as const, label: 'Unlimited AI conversations' },
                  { icon: 'pulse-outline' as const, label: 'Recovery timelines & wearables' },
                  { icon: 'people-outline' as const, label: 'Family & caregiver sharing' },
                ] as const
              ).map((item) => (
                <View key={item.label} style={styles.closePerk}>
                  <View style={styles.closePerkIcon}>
                    <Ionicons name={item.icon} size={18} color="#7DD3FC" />
                  </View>
                  <Text style={styles.closePerkText}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.footer, { paddingHorizontal: pad }]}>
          <View style={[styles.footerInner, { width: gridWidth }]}>
            <View
              style={[
                styles.footerTop,
                {
                  flexDirection: wide ? 'row' : 'column',
                  alignItems: wide ? 'center' : 'flex-start',
                  gap: wide ? 24 : 20,
                },
              ]}
            >
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
                <Pressable onPress={() => router.push('/support' as never)}>
                  <Text style={styles.footerLink}>Support</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/privacy' as never)}>
                  <Text style={styles.footerLink}>Privacy</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/terms' as never)}>
                  <Text style={styles.footerLink}>Terms</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.disclaimer}>
              Dosify provides informational support only and is not a substitute for professional
              medical advice.
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
          <Ionicons
            name="arrow-up"
            size={14}
            color="rgba(255,255,255,0.55)"
            style={styles.featureArrowIcon}
          />
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
  scrollContent: { flexGrow: 1 },
  heroOuter: {
    paddingTop: Platform.OS === 'web' ? 24 : 48,
    paddingBottom: 56,
    gap: 40,
    alignSelf: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: { width: 40, height: 40, borderRadius: 11 },
  brand: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
    fontFamily: fontDisplay,
  },
  topLinks: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topLink: { paddingVertical: 10, paddingHorizontal: 12 },
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
  heroSplit: {
    justifyContent: 'space-between',
  },
  heroCopy: {
    flexShrink: 1,
    minWidth: 0,
  },
  heroCopyWide: {
    flex: 1,
    paddingRight: 12,
    maxWidth: 520,
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#7DD3FC',
    marginBottom: 16,
    fontFamily: fontBody,
  },
  heroFrame: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#152033',
    position: 'relative',
    flexShrink: 0,
    ...Platform.select({
      web: {
        boxShadow: '0 28px 64px rgba(0,0,0,0.45)',
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
  headline: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: 16,
    fontFamily: fontDisplay,
  },
  headlineWide: {
    fontSize: 48,
    lineHeight: 54,
    letterSpacing: -1.4,
  },
  lede: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 28,
    fontFamily: fontBody,
  },
  ledeWide: {
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 440,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  ctaPrimary: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 24,
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
    borderColor: 'rgba(255,255,255,0.35)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  ctaGhostText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: fontBody,
  },
  pressed: { opacity: 0.88 },
  section: {
    paddingVertical: 64,
    backgroundColor: '#0B0E14',
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: '#7DD3FC',
    marginBottom: 14,
    fontFamily: fontBody,
  },
  sectionTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.6,
    marginBottom: 36,
    maxWidth: 560,
    fontFamily: fontDisplay,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureCard: {
    backgroundColor: '#151A24',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 260,
    width: '100%',
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
  featureArrowIcon: { transform: [{ rotate: '45deg' }] },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    fontFamily: fontDisplay,
  },
  featureBody: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.58)',
    marginBottom: 20,
    flexGrow: 1,
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
    paddingTop: 72,
    paddingBottom: 80,
    backgroundColor: '#0B0E14',
  },
  closeSplit: {
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  closeCopy: {
    flexShrink: 1,
    minWidth: 0,
  },
  closeCopyWide: {
    flex: 1,
    maxWidth: 520,
    paddingRight: 8,
  },
  closeEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#7DD3FC',
    marginBottom: 14,
    fontFamily: fontBody,
  },
  closeTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.8,
    marginBottom: 14,
    fontFamily: fontDisplay,
  },
  closeTitleWide: {
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -1.2,
  },
  closeLede: {
    fontSize: 16,
    lineHeight: 25,
    color: 'rgba(255,255,255,0.62)',
    marginBottom: 28,
    maxWidth: 440,
    fontFamily: fontBody,
  },
  closePanel: {
    backgroundColor: '#121722',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 28,
    paddingHorizontal: 26,
    gap: 18,
  },
  closePanelWide: {
    width: 380,
    flexShrink: 0,
  },
  closePanelLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.3,
    marginBottom: 4,
    fontFamily: fontBody,
  },
  closePerk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  closePerkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(125,211,252,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePerkText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
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
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerInner: {
    alignSelf: 'center',
    gap: 20,
  },
  footerTop: {
    width: '100%',
    justifyContent: 'space-between',
  },
  footerBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerLogo: { width: 28, height: 28, borderRadius: 8 },
  footerName: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: fontDisplay },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
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
    maxWidth: 560,
    fontFamily: fontBody,
  },
});
