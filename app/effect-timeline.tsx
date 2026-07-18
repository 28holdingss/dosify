import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { RefreshControl } from 'react-native';
import { EffectTimelineView } from '@/components/EffectTimelineView';
import { SpatialHeader, SpatialScreen } from '@/components/spatial';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';

export default function EffectTimelineScreen() {
  const router = useRouter();
  const theme = useSpatialTheme();
  const { intakeId } = useLocalSearchParams<{ intakeId?: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const refetchRef = useRef<(() => Promise<void>) | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchRef.current?.();
    setRefreshing(false);
  }, []);

  return (
    <SpatialScreen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
      }
    >
      <SpatialHeader
        title="Effect Timeline"
        showBack
        onBack={() => router.back()}
        showThemeToggle
        showBell={false}
      />
      <EffectTimelineView
        intakeId={intakeId}
        onRefetchReady={(fn) => { refetchRef.current = fn; }}
      />
    </SpatialScreen>
  );
}
