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
import { Ionicons } from '@expo/vector-icons';
import { SPLASH_BG } from '@/components/SplashBrand';
import { colors, spacing } from '@/constants/theme';

const APP_STORE_URL = 'https://apps.apple.com/app/id6793530607';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.dhafee.dosify';

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
  const { width } = useWindowDimensions();
  const wide = width >= 900;

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
        {/* —— Hero: one composition —— */}
        <ImageBackground
          source={require('@/assets/images/dosifybg.jpeg')}
          style={[styles.hero, wide && styles.heroWide]}
          resizeMode="cover"
        >
          <LinearGradient
            colors={
              wide
                ? ['rgba(11,14,20,0.55)', 'rgba(11,14,20,0.25)', 'rgba(11,14,20,0.82)']
                : ['rgba(11,14,20,0.35)', 'rgba(11,14,20,0.2)', 'rgba(11,14,20,0.88)']
            }
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.heroInner, wide && styles.heroInnerWide]}>
            <View style={styles.brandRow}>
              <Image
                source={require('@/assets/images/dosify.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.brand}>Dosify</Text>
            </View>

            <Text style={[styles.headline, wide && styles.headlineWide]}>
              Know your body.{'\n'}Make safer choices.
            </Text>
            <Text style={[styles.lede, wide && styles.ledeWide]}>
              Your daily medication companion — cabinet, schedules, and interaction checks with
              clear, evidence-aware language.
            </Text>

            <View style={[styles.ctaRow, wide && styles.ctaRowWide]}>
              <Pressable
                style={({ pressed }) => [styles.ctaPrimary, pressed && styles.pressed]}
                onPress={() => router.push('/sign-up')}
              >
                <Text style={styles.ctaPrimaryText}>Get started free</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.ctaGhost, pressed && styles.pressed]}
                onPress={() => router.push('/sign-in')}
              >
                <Text style={styles.ctaGhostText}>Log in</Text>
              </Pressable>
            </View>

            <View style={[styles.storeRow, wide && styles.storeRowWide]}>
              <StoreBadge
                platform="ios"
                label="Download on the"
                store="App Store"
                onPress={() => Linking.openURL(APP_STORE_URL)}
              />
              <StoreBadge
                platform="android"
                label="Get it on"
                store="Google Play"
                onPress={() => Linking.openURL(PLAY_STORE_URL)}
              />
            </View>
          </View>
        </ImageBackground>

        {/* —— One job: what it is —— */}
        <View style={[styles.section, wide && styles.sectionWide]}>
          <Text style={styles.sectionEyebrow}>Built for everyday care</Text>
          <Text style={[styles.sectionTitle, wide && styles.sectionTitleWide]}>
            Medicine tracking that stays out of the way — until you need clarity.
          </Text>

          <View style={[styles.pillarList, wide && styles.pillarListWide]}>
            {pillars.map((item, i) => (
              <View
                key={item.title}
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
              </View>
            ))}
          </View>
        </View>

        {/* —— Platforms —— */}
        <View style={[styles.platforms, wide && styles.sectionWide]}>
          <Text style={styles.sectionEyebrow}>iOS & Android</Text>
          <Text style={[styles.sectionTitle, wide && styles.sectionTitleWide]}>
            Same Dosify on your phone and on the web.
          </Text>
          <Text style={styles.platformsLede}>
            Use the full web app in the browser, or install the native apps for reminders, Health
            sync on iPhone, and on-the-go logging.
          </Text>

          <View style={styles.platformCards}>
            <View style={styles.platformCard}>
              <Ionicons name="logo-apple" size={28} color={colors.text} />
              <Text style={styles.platformName}>iPhone</Text>
              <Text style={styles.platformMeta}>App Store · HealthKit optional</Text>
            </View>
            <View style={styles.platformCard}>
              <Ionicons name="logo-android" size={28} color={colors.text} />
              <Text style={styles.platformName}>Android</Text>
              <Text style={styles.platformMeta}>Google Play</Text>
            </View>
            <View style={styles.platformCard}>
              <Ionicons name="globe-outline" size={28} color={colors.text} />
              <Text style={styles.platformName}>Web</Text>
              <Text style={styles.platformMeta}>mydosify.com</Text>
            </View>
          </View>
        </View>

        {/* —— Footer —— */}
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <Image
              source={require('@/assets/images/dosify.png')}
              style={styles.footerLogo}
              resizeMode="contain"
            />
            <Text style={styles.footerName}>Dosify</Text>
          </View>
          <View style={styles.footerLinks}>
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
      </ScrollView>
    </View>
  );
}

function StoreBadge({
  platform,
  label,
  store,
  onPress,
}: {
  platform: 'ios' | 'android';
  label: string;
  store: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.storeBadge, pressed && styles.pressed]}
      accessibilityRole="link"
      accessibilityLabel={`${label} ${store}`}
    >
      <Ionicons
        name={platform === 'ios' ? 'logo-apple' : 'logo-google-playstore'}
        size={26}
        color="#fff"
      />
      <View>
        <Text style={styles.storeLabel}>{label}</Text>
        <Text style={styles.storeName}>{store}</Text>
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
  hero: {
    minHeight: 640,
    justifyContent: 'flex-end',
    backgroundColor: SPLASH_BG,
  },
  heroWide: {
    minHeight: 720,
  },
  heroInner: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: 48,
    paddingTop: 80,
    maxWidth: 720,
  },
  heroInnerWide: {
    paddingHorizontal: 64,
    paddingBottom: 72,
    maxWidth: 680,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.6,
    fontFamily: Platform.select({ web: 'Syne, system-ui, sans-serif', default: undefined }),
  },
  headline: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1.2,
    marginBottom: 16,
    fontFamily: Platform.select({ web: 'Syne, system-ui, sans-serif', default: undefined }),
  },
  headlineWide: {
    fontSize: 56,
    lineHeight: 60,
  },
  lede: {
    fontSize: 17,
    lineHeight: 26,
    color: 'rgba(255,255,255,0.82)',
    marginBottom: 28,
    maxWidth: 420,
    fontFamily: Platform.select({ web: '"DM Sans", system-ui, sans-serif', default: undefined }),
  },
  ledeWide: {
    fontSize: 18,
    lineHeight: 28,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  ctaRowWide: {
    marginBottom: 24,
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
    fontFamily: Platform.select({ web: '"DM Sans", system-ui, sans-serif', default: undefined }),
  },
  ctaGhost: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  ctaGhostText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: Platform.select({ web: '"DM Sans", system-ui, sans-serif', default: undefined }),
  },
  storeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  storeRowWide: {
    marginTop: 4,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  storeLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  pressed: {
    opacity: 0.85,
  },
  section: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: 64,
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
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#7DD3FC',
    marginBottom: 12,
    fontFamily: Platform.select({ web: '"DM Sans", system-ui, sans-serif', default: undefined }),
  },
  sectionTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.6,
    marginBottom: 36,
    maxWidth: 520,
    fontFamily: Platform.select({ web: 'Syne, system-ui, sans-serif', default: undefined }),
  },
  sectionTitleWide: {
    fontSize: 36,
    lineHeight: 42,
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
    gap: 16,
    paddingVertical: 24,
  },
  pillarWide: {
    flex: 1,
    flexDirection: 'column',
    paddingRight: 28,
    paddingVertical: 0,
  },
  pillarBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  pillarBorderWide: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.12)',
    paddingLeft: 28,
  },
  pillarIndex: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1,
    marginTop: 4,
  },
  pillarCopy: {
    flex: 1,
  },
  pillarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    fontFamily: Platform.select({ web: 'Syne, system-ui, sans-serif', default: undefined }),
  },
  pillarBody: {
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.65)',
    fontFamily: Platform.select({ web: '"DM Sans", system-ui, sans-serif', default: undefined }),
  },
  platforms: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: 64,
    backgroundColor: '#11151F',
  },
  platformsLede: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.65)',
    marginTop: -20,
    marginBottom: 32,
    maxWidth: 480,
    fontFamily: Platform.select({ web: '"DM Sans", system-ui, sans-serif', default: undefined }),
  },
  platformCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformCard: {
    minWidth: 140,
    flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  platformName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    fontFamily: Platform.select({ web: 'Syne, system-ui, sans-serif', default: undefined }),
  },
  platformMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: 40,
    backgroundColor: '#0B0E14',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    gap: 16,
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
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 20,
  },
  footerLink: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    maxWidth: 420,
  },
});
