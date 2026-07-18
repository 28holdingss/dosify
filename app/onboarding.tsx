import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Platform, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '@/components/ui/GradientButton';
import { colors, layout, spacing, typography, radius } from '@/constants/theme';

const floatingIcons = [
  { name: 'medical' as const, color: colors.blue, top: 60, left: 40 },
  { name: 'wine' as const, color: colors.purple, top: 30, right: 50 },
  { name: 'leaf' as const, color: colors.green, top: 100, right: 30 },
  { name: 'cafe' as const, color: colors.orange, top: 140, left: 60 },
  { name: 'flask' as const, color: colors.pink, top: 80, left: 120 },
];

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroArea}>
          <LinearGradient
            colors={['#1a0a3e', '#2d1b69', '#0B0E14']}
            style={styles.nebula}
          >
            {floatingIcons.map((icon, i) => (
              <View
                key={i}
                style={[
                  styles.floatingIcon,
                  { top: icon.top, left: icon.left, right: icon.right },
                ]}
              >
                <Ionicons name={icon.name} size={28} color={icon.color} />
              </View>
            ))}
            <View style={styles.glow} />
          </LinearGradient>
        </View>

        <View style={styles.textArea}>
          <Text style={styles.title}>
            Know your body.{'\n'}Make{' '}
            <Text style={styles.gradient}>safer choices</Text>.
          </Text>
          <Text style={styles.subtitle}>
            AI-powered insights on any substance, medicine, or alcohol — all in
            one place.
          </Text>
        </View>

        <View style={styles.actions}>
          <GradientButton
            title="Get Started"
            onPress={() => router.push('/sign-up')}
          />
          <Pressable onPress={() => router.push('/sign-in')}>
            <Text style={styles.login}>
              Already have an account?{' '}
              <Text style={styles.loginLink}>Log in</Text>
            </Text>
          </Pressable>
        </View>

        <View style={styles.features}>
          {[
            { icon: 'sparkles' as const, title: 'AI-Powered Insights', desc: 'Advanced risk analysis' },
            { icon: 'lock-closed' as const, title: 'Private & Secure', desc: 'Encrypted data' },
            { icon: 'book' as const, title: 'Evidence-Based', desc: 'Medical sources' },
            { icon: 'chatbubble' as const, title: 'Always Here', desc: 'Support resources' },
          ].map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <Ionicons name={f.icon} size={18} color={colors.primary} />
              <View>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    ...(Platform.OS === 'web'
      ? {
          width: '100%' as const,
          maxWidth: layout.maxContentWidth,
          alignSelf: 'center' as const,
        }
      : {}),
  },
  heroArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nebula: {
    width: 280,
    height: 280,
    borderRadius: 140,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
  },
  floatingIcon: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 10,
  },
  textArea: {
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    color: colors.text,
    lineHeight: 40,
    marginBottom: spacing.md,
  },
  gradient: {
    color: colors.purple,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.md,
  },
  login: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loginLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '48%',
  },
  featureTitle: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
  },
  featureDesc: {
    ...typography.small,
    color: colors.textMuted,
    fontSize: 10,
  },
});
