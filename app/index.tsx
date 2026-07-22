import { Redirect } from 'expo-router';
import { SplashBrand } from '@/components/SplashBrand';
import { useSession } from '@/lib/auth-client';

export default function Index() {
  const { data: session, isPending } = useSession();

  // Root layout already shows the branded splash on launch.
  // Keep a matching screen here only while session is still resolving.
  if (isPending) {
    return <SplashBrand />;
  }

  if (!session) return <Redirect href="/onboarding" />;

  const user = session.user as typeof session.user & {
    onboardingCompleted?: boolean;
  };
  return <Redirect href={user.onboardingCompleted ? '/(tabs)' : '/setup-profile'} />;
}
