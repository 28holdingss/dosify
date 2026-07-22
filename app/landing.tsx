import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  Image,
  ImageBackground,
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
import { SPLASH_BG } from '@/components/SplashBrand';
import { spacing } from '@/constants/theme';

const APP_STORE_URL = 'https://apps.apple.com/app/id6793530607';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.dhafee.dosify';

const fontDisplay = Platform.select({ web: 'Syne, system-ui, sans-serif', default: undefined });
const fontBody = Platform.select({ web: '"DM Sans", system-ui, sans-serif', default: undefined });

const pillars = [
  {
    title: 'Health Cabinet',
    body: 'Track medicines and supplements with doses, refills, and schedules in one place.',
  },
  {
    title: 'Check before taking',
    body: 'See interaction context against your cabinet and profile — never an unqualified “safe.”',
  },
  {
    title: 'Daily adherence',
    body: 'Reminders, today’s doses, symptoms, and clinician-ready exports when you need them.',
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const wide = width >= 900;
  const heroMin = Math.max(height * 0.92, wide ? 700 : 600);

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
        {/* —— Full-bleed hero —— */}
        <View style={styles.heroShell}>
          <ImageBackground
            source={require('@/assets/images/dosifybg.jpeg')}
            style={[styles.heroBg, { minHeight: heroMin }]}
            resizeMode="cover"
            imageStyle={
              Platform.OS === 'web'
                ? ({ objectPosition: '28% center' } as object)
                : undefined
            }
          >
            {/* Left readability + right atmosphere (kills empty blue panel) */}
            <LinearGradient
              colors={['rgba(11,14,20,0.55)', 'rgba(11,14,20,0.15)', 'rgba(11,14,20,0.72)']}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(11,14,20,0.15)', 'rgba(11,14,20,0.35)', 'rgba(11,14,20,0.96)']}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />

            <View style={[styles.heroPad, wide && styles.heroPadWide, { minHeight: heroMin }]}>
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

              <Animated.View
                entering={FadeInDown.delay(80).duration(520).springify()}
                style={[styles.heroCopy, wide && styles.heroCopyWide]}
              >
                <Text style={[styles.headline, wide && styles.headlineWide]}>
                  Know your body.{'\n'}Make safer choices.
                </Text>
                <Text style={[styles.lede, wide && styles.ledeWide]}>
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
              </Animated.View>
            </View>
          </ImageBackground>
        </View>

        {/* —— Features —— */}
        <View style={[styles.section, wide && styles.sectionWide]}>
          <Animated.View entering={FadeInUp.delay(60).duration(450)}>
            <Text style={styles.sectionEyebrow}>Built for everyday care</Text>
            <Text style={[styles.sectionTitle, wide && styles.sectionTitleWide]}>
              Medicine tracking that stays out of the way — until you need clarity.
            </Text>
          </Animated.View>

          <View style={[styles.pillarList, wide && styles.pillarListWide]}>
            {pillars.map((item, i) => (
              <Animated.View
                key={item.title}
                entering={FadeInUp.delay(120 + i * 70).duration(450)}
                style={[
                  styles.pillar,
                  wide && styles.pillarWide,
                  i > 0 && (wide ? styles.pillarBorderWide : styles.pillarBorder),
                ]}
              >
                <Text style={styles.pillarIndex}>{String(i + 1).padStart(2, '0')}</Text>
                <View style={styles.pillarCopy}>
                  <Text style={styles.pillarTitle}>{item.title}</Text>
                  <Text style={styles.pillarBody}>{item.body}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* —— Platforms (interactive) —— */}
        <View style={[styles.platforms, wide && styles.sectionWide]}>
          <Text style={styles.sectionEyebrow}>Wherever you are</Text>
          <Text style={[styles.sectionTitle, wide && styles.sectionTitleWide]}>
            Same Dosify on your phone and on the web.
          </Text>
          <Text style={styles.platformsLede}>
            Use the full web app in the browser, or install the native apps for reminders, Health
            sync on iPhone, and on-the-go logging.
          </Text>

          <View style={[styles.platformList, wide && styles.platformListWide]}>
            <PlatformRow
              icon="logo-apple"
              title="iPhone"
              meta="App Store · HealthKit optional"
              onPress={() => Linking.openURL(APP_STORE_URL)}
            />
            <PlatformRow
              icon="logo-android"
              title="Android"
              meta="Google Play"
              onPress={() => Linking.openURL(PLAY_STORE_URL)}
            />
            <PlatformRow
              icon="globe-outline"
              title="Web"
              meta="Continue in browser"
              onPress={() => router.push('/sign-up')}
            />
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

function PlatformRow({
  icon,
  title,
  meta,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  meta: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.platformRow, pressed && styles.platformRowPressed]}
      accessibilityRole="link"
      accessibilityLabel={`${title}. ${meta}`}
    >
      <View style={styles.platformIcon}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <View style={styles.platformCopy}>
        <Text style={styles.platformName}>{title}</Text>
        <Text style={styles.platformMeta}>{meta}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />
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
  heroShell: {
    backgroundColor: SPLASH_BG,
    width: '100%',
  },
  heroBg: {
    width: '100%',
  },
  heroPad: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: Platform.OS === 'web' ? 28 : 56,
    paddingBottom: 56,
  },
  heroPadWide: {
    paddingHorizontal: 64,
    paddingTop: 32,
    paddingBottom: 72,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  brand: {
    fontSize: 26,
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
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: fontBody,
  },
  topLinkStrong: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  topLinkStrongText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: fontBody,
  },
  heroCopy: {
    maxWidth: 560,
    paddingBottom: 8,
  },
  heroCopyWide: {
    maxWidth: 640,
  },
  headline: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1.2,
    marginBottom: 16,
    fontFamily: fontDisplay,
  },
  headlineWide: {
    fontSize: 58,
    lineHeight: 62,
  },
  lede: {
    fontSize: 17,
    lineHeight: 26,
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 28,
    maxWidth: 440,
    fontFamily: fontBody,
  },
  ledeWide: {
    fontSize: 19,
    lineHeight: 29,
    maxWidth: 480,
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
    borderColor: 'rgba(255,255,255,0.4)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.25)',
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
    paddingHorizontal: spacing.xxl,
    paddingTop: 72,
    paddingBottom: 56,
    backgroundColor: '#0B0E14',
  },
  sectionWide: {
    paddingHorizontal: 64,
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
  },
  sectionTitleWide: {
    fontSize: 38,
    lineHeight: 44,
    maxWidth: 640,
  },
  pillarList: {
    gap: 0,
  },
  pillarListWide: {
    flexDirection: 'row',
    gap: 0,
  },
  pillar: {
    flexDirection: 'row',
    gap: 18,
    paddingVertical: 28,
  },
  pillarWide: {
    flex: 1,
    flexDirection: 'column',
    paddingRight: 32,
    paddingVertical: 8,
  },
  pillarBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  pillarBorderWide: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.12)',
    paddingLeft: 32,
  },
  pillarIndex: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7DD3FC',
    letterSpacing: 1.2,
    marginTop: 3,
    fontFamily: fontBody,
  },
  pillarCopy: {
    flex: 1,
  },
  pillarTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    fontFamily: fontDisplay,
  },
  pillarBody: {
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.68)',
    fontFamily: fontBody,
  },
  platforms: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: 64,
    backgroundColor: '#0F131C',
  },
  platformsLede: {
    fontSize: 16,
    lineHeight: 25,
    color: 'rgba(255,255,255,0.65)',
    marginTop: -24,
    marginBottom: 28,
    maxWidth: 500,
    fontFamily: fontBody,
  },
  platformList: {
    gap: 10,
  },
  platformListWide: {
    maxWidth: 640,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  platformRowPressed: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(125,211,252,0.35)',
  },
  platformIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformCopy: {
    flex: 1,
    gap: 2,
  },
  platformName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    fontFamily: fontDisplay,
  },
  platformMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
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
