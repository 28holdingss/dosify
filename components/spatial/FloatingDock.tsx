import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassSurface } from '@/components/spatial/LiquidGlassSurface';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { radius, spacing } from '@/constants/theme';
import { isNativeLiquidGlassAvailable } from '@/lib/native-liquid-glass';

const useNativeGlass = isNativeLiquidGlassAvailable();

type TabRoute = {
  key: string;
  name: string;
  params?: object;
};

type FloatingDockProps = {
  state: { index: number; routes: TabRoute[] };
  descriptors: Record<string, { options: { href?: string | null } }>;
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

type TabLayout = { x: number; width: number };

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  log: 'add-circle-outline',
  timeline: 'time-outline',
  ai: 'sparkles-outline',
  recovery: 'heart-outline',
  profile: 'person-outline',
};

const TAB_ICONS_ACTIVE: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  log: 'add-circle',
  timeline: 'time',
  ai: 'sparkles',
  recovery: 'heart',
  profile: 'person',
};

const SPRING = { damping: 20, stiffness: 260, mass: 0.85 };

function DockTab({
  routeName,
  isFocused,
  onPress,
  onLayout,
  accent,
  muted,
}: {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
  accent: string;
  muted: string;
}) {
  const icon = isFocused
    ? (TAB_ICONS_ACTIVE[routeName] ?? 'ellipse')
    : (TAB_ICONS[routeName] ?? 'ellipse');
  const isLog = routeName === 'log';

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
      hitSlop={6}
    >
      <Ionicons
        name={icon}
        size={isLog ? 28 : 24}
        color={isFocused ? accent : muted}
      />
    </Pressable>
  );
}

function DockAction({
  icon,
  iconActive,
  isActive,
  onPress,
  accent,
  muted,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  onPress: () => void;
  accent: string;
  muted: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel="Apple Watch sync"
    >
      <Ionicons
        name={isActive ? iconActive : icon}
        size={24}
        color={isActive ? accent : muted}
      />
    </Pressable>
  );
}

export function FloatingDock({ state, descriptors, navigation }: FloatingDockProps) {
  const pathname = usePathname();
  const isWatchActive = pathname === '/watch-sync';
  const theme = useSpatialTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 10);

  const tabLayouts = useRef<Record<number, TabLayout>>({});
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(52);

  const updateIndicator = useCallback(
    (index: number) => {
      const layout = tabLayouts.current[index];
      if (!layout) return;
      indicatorX.value = withSpring(layout.x, SPRING);
      indicatorWidth.value = withSpring(layout.width, SPRING);
    },
    [indicatorX, indicatorWidth],
  );

  useEffect(() => {
    // Watch sync is a hidden tab — keep the indicator on the last main tab.
    if (state.routes[state.index]?.name === 'watch-sync') return;
    updateIndicator(state.index);
  }, [state.index, state.routes, updateIndicator]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    return options.href !== null && route.name !== 'watch-sync' && route.name in TAB_ICONS;
  });

  return (
    <View style={[styles.container, { paddingBottom: bottom }]} pointerEvents="box-none">
      <LiquidGlassSurface
        style={styles.dock}
        borderRadius={radius.full}
        interactive={useNativeGlass}
      >
        <View style={styles.tabs}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              indicatorStyle,
              !useNativeGlass && { backgroundColor: theme.liquid.indicator },
            ]}
          >
            {useNativeGlass ? (
              <LiquidGlassSurface
                style={StyleSheet.absoluteFill}
                borderRadius={radius.full}
                variant="clear"
                interactive
              >
                <View />
              </LiquidGlassSurface>
            ) : (
              <>
                <LinearGradient
                  colors={[theme.liquid.highlight, 'transparent']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    styles.indicatorRim,
                    { borderColor: theme.liquid.rim },
                  ]}
                />
              </>
            )}
          </Animated.View>

          {state.routes.flatMap((route, index) => {
            const isFocused = state.index === index;
            const { options } = descriptors[route.key];

            // Hidden routes (e.g. watch-sync) — opened via DockAction, not as a tab icon
            if (options.href === null || route.name === 'watch-sync') return [];
            if (!(route.name in TAB_ICONS)) return [];

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const visibleIndex = visibleRoutes.findIndex((r) => r.key === route.key);

            const tab = (
              <DockTab
                key={route.key}
                routeName={route.name}
                isFocused={isFocused}
                onPress={onPress}
                accent={theme.accent}
                muted={theme.textMuted}
                onLayout={(event) => {
                  const { x, width } = event.nativeEvent.layout;
                  tabLayouts.current[visibleIndex] = { x, width };
                  if (state.index === index) {
                    indicatorX.value = x;
                    indicatorWidth.value = width;
                  }
                }}
              />
            );

            if (route.name === 'recovery') {
              return [
                tab,
                <DockAction
                  key="watch-sync"
                  icon="watch-outline"
                  iconActive="watch"
                  isActive={isWatchActive}
                  onPress={() => navigation.navigate('watch-sync')}
                  accent={theme.accent}
                  muted={theme.textMuted}
                />,
              ];
            }

            return [tab];
          })}
        </View>
      </LiquidGlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 0,
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  dock: {
    minHeight: 58,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...(Platform.OS === 'web'
      ? { width: '100%' as const, maxWidth: 480 }
      : {}),
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    minHeight: 44,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: radius.full,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      default: {},
    }),
  },
  indicatorRim: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.full,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    zIndex: 1,
  },
  tabPressed: {
    opacity: 0.72,
  },
});
