import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Field } from '@/components/ui/Field';
import { GradientButton } from '@/components/ui/GradientButton';
import { colors, spacing, typography } from '@/constants/theme';
import { signIn } from '@/lib/auth-client';

const DEMO_EMAIL = 'alex@bioos.app';
const DEMO_PASSWORD = 'Demo1234!';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError(null);
    setSubmitting(true);
    const { data, error: authError } = await signIn.email({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (authError) {
      setError(authError.message ?? 'Could not sign in. Check your credentials.');
      return;
    }
    const user = data?.user as { onboardingCompleted?: boolean } | undefined;
    router.replace(user?.onboardingCompleted ? '/(tabs)' : '/setup-profile');
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title="Welcome back" showBack onBack={() => router.back()} />
          <Text style={styles.subtitle}>
            Sign in to keep tracking your intakes and health insights.
          </Text>

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          {submitting ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : (
            <GradientButton title="Sign In" onPress={handleSignIn} />
          )}

          <Pressable onPress={fillDemo} style={styles.demoBtn} hitSlop={8}>
            <Text style={styles.demoTitle}>Use demo account</Text>
            <Text style={styles.demoMeta}>
              {DEMO_EMAIL} · {DEMO_PASSWORD}
            </Text>
          </Pressable>

          <Pressable onPress={() => router.replace('/sign-up')}>
            <Text style={styles.switchText}>
              New to Dosify? <Text style={styles.switchLink}>Create an account</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  loading: {
    marginVertical: spacing.lg,
  },
  demoBtn: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: 4,
  },
  demoTitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  demoMeta: {
    ...typography.small,
    color: colors.textMuted,
  },
  switchText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  switchLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
