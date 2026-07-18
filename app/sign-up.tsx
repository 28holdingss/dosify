import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Field } from '@/components/ui/Field';
import { GradientButton } from '@/components/ui/GradientButton';
import { colors, spacing, typography } from '@/constants/theme';
import { signUp } from '@/lib/auth-client';

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Fill in your name, email, and password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error: authError } = await signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (authError) {
      setError(authError.message ?? 'Could not create your account.');
      return;
    }
    router.replace('/setup-profile');
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScreenHeader title="Create account" showBack onBack={() => router.back()} />
        <Text style={styles.subtitle}>
          Track substances, spot interactions, and understand your body.
        </Text>

        <Field
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
        />
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
          placeholder="At least 8 characters"
          secureTextEntry
          autoCapitalize="none"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        {submitting ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : (
          <GradientButton title="Create Account" onPress={handleSignUp} />
        )}

        <Pressable onPress={() => router.replace('/sign-in')}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchLink}>Sign in</Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
