import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

const DELETE_WIDTH = 76;

type SwipeToDeleteRowProps = {
  children: React.ReactNode;
  onDelete: () => void;
  style?: ViewStyle;
};

export function SwipeToDeleteRow({ children, onDelete, style }: SwipeToDeleteRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const openRef = useRef(false);

  const snapTo = (open: boolean) => {
    openRef.current = open;
    Animated.spring(translateX, {
      toValue: open ? -DELETE_WIDTH : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start();
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        translateX.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        const base = openRef.current ? -DELETE_WIDTH : 0;
        const next = Math.min(0, Math.max(-DELETE_WIDTH, base + g.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const base = openRef.current ? -DELETE_WIDTH : 0;
        const finalX = base + g.dx;
        if (finalX < -DELETE_WIDTH / 2 || g.vx < -0.4) {
          snapTo(true);
        } else {
          snapTo(false);
        }
      },
      onPanResponderTerminate: () => {
        snapTo(openRef.current);
      },
    })
  ).current;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.deleteRail}>
        <Pressable
          style={styles.deleteBtn}
          onPress={onDelete}
          accessibilityLabel="Delete intake"
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
      <Animated.View
        style={[styles.foreground, { transform: [{ translateX }] }]}
        {...pan.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  deleteRail: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_WIDTH,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foreground: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
});
