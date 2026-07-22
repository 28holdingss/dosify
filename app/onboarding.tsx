import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '@/components/ui/GradientButton';
import { SPLASH_BG } from '@/components/SplashBrand';
import { colors, layout, spacing, typography, radius } from '@/constants/theme';

const features = [
  { icon: 'sparkles' as const, title: 'AI Insights', desc: 'Risk analysis' },
  { icon: 'lock-closed' as const, title: 'Private', desc: 'Encrypted' },
  { icon: 'book' as const, title: 'Evidence', desc: 'Trusted sources' },
  { icon: 'chatbubble' as const, title: 'Support', desc: 'Always here' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('@/assets/images/dosifybg.jpeg')}
        style={styles.bg}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(11,14,20,0.25)', 'rgba(11,14,20,0.35)', 'rgba(11,14,20,0.92)']}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFill}
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: Math.max(insets.top, spacing.md) + spacing.lg,
              paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xl,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <View style={styles.logoBadge}>
              <Image
                source={require('@/assets/images/dosify.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.spacer} />

          <View style={styles.copy}>
            <Text style={styles.title}>
              Know your body.{'\n'}Make{' '}
              <Text style={styles.titleAccent}>safer choices</Text>.
            </Text>
            <Text style={styles.subtitle}>
              AI-powered insights on any substance, medicine, or alcohol — all in one place.
            </Text>
          </View>

          <View style={styles.actions}>
            <GradientButton title="Get Started" onPress={() => router.push('/sign-up')} />
            <Pressable onPress={() => router.push('/sign-in')}>
              <Text style={styles.login}>
                Already have an account? <Text style={styles.loginLink}>Log in</Text>
              </Text>
            </Pressable>
          </View>

          <View style={styles.features}>
            {features.map((f) => (
              <View key={f.title} style={styles.featureCard}>
                <Ionicons name={f.icon} size={16} color={colors.primary} />
                <View style={styles.featureCopy}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.legalRow}>
            <Pressable onPress={() => router.push('/privacy' as never)}>
              <Text style={styles.legalLink}>Privacy</Text>
            </Pressable>
            <Text style={styles.legalSep}>·</Text>
            <Pressable onPress={() => router.push('/terms' as never)}>
              <Text style={styles.legalLink}>Terms</Text>
            </Pressable>
            <Text style={styles.legalSep}>·</Text>
            <Pressable onPress={() => router.push('/support' as never)}>
              <Text style={styles.legalLink}>Support</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SPLASH_BG,
  },
  bg: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    ...(Platform.OS === 'web'
      ? {
          width: '100%' as const,
          maxWidth: layout.maxContentWidth,
          alignSelf: 'center' as const,
        }
      : {}),
  },
  logoWrap: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  logo: {
    width: 84,
    height: 84,
  },
  spacer: {
    flexGrow: 1,
    minHeight: spacing.xxxl,
  },
  copy: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    color: colors.text,
    lineHeight: 40,
    marginBottom: spacing.md,
  },
  titleAccent: {
    color: '#A5B4FC',
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 22,
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  login: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  loginLink: {
    color: '#C7D2FE',
    fontWeight: '700',
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(20,24,36,0.72)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: spacing.md,
    width: '48%',
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
  },
  featureDesc: {
    ...typography.small,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  legalLink: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.65)',
  },
  legalSep: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.35)',
  },
});
