import { Redirect } from 'expo-router';
import { Platform, View } from 'react-native';
import { SplashBrand, SPLASH_BG } from '@/components/SplashBrand';
import { useSession } from '@/lib/auth-client';

export default function Index() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    if (Platform.OS === 'web') {
      return <View style={{ flex: 1, backgroundColor: SPLASH_BG }} />;
    }
    return <SplashBrand />;
  }

  if (!session) {
    return <Redirect href={Platform.OS === 'web' ? '/landing' : '/onboarding'} />;
  }

  const user = session.user as typeof session.user & {
    onboardingCompleted?: boolean;
  };
  return <Redirect href={user.onboardingCompleted ? '/(tabs)' : '/setup-profile'} />;
}
