import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';
import { useSession } from '@/lib/auth-client';

export default function Index() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/onboarding" />;

  const user = session.user as typeof session.user & {
    onboardingCompleted?: boolean;
  };
  return <Redirect href={user.onboardingCompleted ? '/(tabs)' : '/setup-profile'} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
