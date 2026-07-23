import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';

type WatchSyncStatusIconProps = {
  connected: boolean;
  syncing: boolean;
  supported: boolean;
  /** Bumps when a sync just succeeded — plays the check burst. */
  successKey: number;
};

export function WatchSyncStatusIcon({
  connected,
  syncing,
  supported,
  successKey,
}: WatchSyncStatusIconProps) {
  const accent = !supported
    ? colors.warning
    : connected
      ? colors.green
      : colors.primary;

  const pulse = useSharedValue(0);
  const spin = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const check = useSharedValue(0);
  const burst = useSharedValue(0);

  useEffect(() => {
    if (connected && !syncing && supported) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [connected, syncing, supported, pulse]);

  useEffect(() => {
    if (syncing) {
      spin.value = 0;
      spin.value = withRepeat(
        withTiming(1, { duration: 1100, easing: Easing.linear }),
        -1,
        false
      );
      iconScale.value = withRepeat(
        withSequence(
          withTiming(0.92, { duration: 450 }),
          withTiming(1, { duration: 450 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(spin);
      cancelAnimation(iconScale);
      spin.value = withTiming(0, { duration: 200 });
      iconScale.value = withSpring(1, { damping: 14, stiffness: 180 });
    }
  }, [syncing, spin, iconScale]);

  useEffect(() => {
    if (successKey <= 0) return;
    check.value = 0;
    burst.value = 0;
    check.value = withSequence(
      withSpring(1, { damping: 12, stiffness: 220 }),
      withDelay(900, withTiming(0, { duration: 280 }))
    );
    burst.value = withSequence(
      withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 200 })
    );
    iconScale.value = withSequence(
      withSpring(1.12, { damping: 10, stiffness: 260 }),
      withSpring(1, { damping: 14, stiffness: 180 })
    );
  }, [successKey, check, burst, iconScale]);

  const ring1Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.35, 0.05], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(pulse.value, [0, 1], [1, 1.55], Extrapolation.CLAMP),
      },
    ],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.22, 0], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(pulse.value, [0, 1], [1.05, 1.9], Extrapolation.CLAMP),
      },
    ],
  }));

  const spinStyle = useAnimatedStyle(() => ({
    opacity: syncing ? 1 : 0,
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: check.value,
    transform: [
      { scale: interpolate(check.value, [0, 1], [0.4, 1], Extrapolation.CLAMP) },
    ],
  }));

  const burstStyle = useAnimatedStyle(() => ({
    opacity: interpolate(burst.value, [0, 0.3, 1], [0, 0.45, 0], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(burst.value, [0, 1], [0.8, 2.1], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <View style={styles.wrap}>
      {connected && supported ? (
        <>
          <Animated.View
            style={[styles.ring, { borderColor: accent }, ring2Style]}
            pointerEvents="none"
          />
          <Animated.View
            style={[styles.ring, { borderColor: accent }, ring1Style]}
            pointerEvents="none"
          />
        </>
      ) : null}

      <Animated.View
        style={[styles.burst, { backgroundColor: `${colors.green}33` }, burstStyle]}
        pointerEvents="none"
      />

      <Animated.View style={[styles.core, { backgroundColor: `${accent}22` }, iconStyle]}>
        <Ionicons
          name={syncing ? 'sync-outline' : 'watch-outline'}
          size={28}
          color={accent}
        />
      </Animated.View>

      <Animated.View style={[styles.orbit, spinStyle]} pointerEvents="none">
        <View style={[styles.orbitDot, { backgroundColor: accent }]} />
      </Animated.View>

      <Animated.View style={[styles.checkBadge, checkStyle]} pointerEvents="none">
        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
  },
  burst: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  core: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  orbit: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    zIndex: 1,
  },
  orbitDot: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  checkBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    borderWidth: 2,
    borderColor: colors.surfaceLight,
  },
});
