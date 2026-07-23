import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { addReminderResponseListener } from '@/lib/reminders';

/**
 * When the user taps a local dose reminder, open the target route.
 * Mount once near the root navigator.
 */
export function useNotificationRouting() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let remove = () => undefined;
    void addReminderResponseListener((response) => {
      const data = response.notification.request.content.data as
        | { route?: string }
        | undefined;
      const route = data?.route;
      if (typeof route === 'string' && route.startsWith('/')) {
        router.push(route as never);
      }
    }).then((unsubscribe) => {
      remove = unsubscribe;
    });

    return () => remove();
  }, [router]);
}
