import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSpatialColorScheme, useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { radius } from '@/constants/theme';

type MetallicGlassCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Soft tint along the top edge (e.g. risk color). */
  accentColor?: string;
  borderRadius?: number;
};

/**
 * Quiet frosted-metal card — transparent with a restrained brushed finish.
 */
export function MetallicGlassCard({
  children,
  style,
  accentColor,
  borderRadius = radius.xl,
}: MetallicGlassCardProps) {
  const theme = useSpatialTheme();
  const scheme = useSpatialColorScheme();
  const isLight = scheme === 'light';

  const metal = isLight
    ? {
        fill: 'rgba(245, 247, 250, 0.55)',
        plate: [
          'rgba(255, 255, 255, 0.4)',
          'rgba(220, 226, 234, 0.28)',
          'rgba(235, 238, 244, 0.32)',
          'rgba(200, 208, 220, 0.22)',
        ] as const,
        sheen: [
          'rgba(255, 255, 255, 0.28)',
          'rgba(255, 255, 255, 0.04)',
          'transparent',
        ] as const,
        specular: ['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0)'] as const,
        rim: 'rgba(255, 255, 255, 0.55)',
      }
    : {
        fill: 'rgba(14, 16, 24, 0.55)',
        plate: [
          'rgba(48, 54, 68, 0.28)',
          'rgba(22, 26, 36, 0.5)',
          'rgba(36, 42, 56, 0.32)',
          'rgba(12, 14, 22, 0.58)',
        ] as const,
        sheen: [
          'rgba(255, 255, 255, 0.08)',
          'rgba(255, 255, 255, 0.02)',
          'transparent',
        ] as const,
        specular: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0)'] as const,
        rim: 'rgba(255, 255, 255, 0.1)',
      };

  return (
    <View
      style={[
        styles.outer,
        {
          borderRadius,
          shadowColor: '#000',
        },
        style,
      ]}
    >
      {Platform.OS === 'web' ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.webBlur,
            { borderRadius, backgroundColor: metal.fill },
          ]}
        />
      ) : (
        <BlurView
          intensity={Platform.OS === 'ios' ? 40 : 32}
          tint={theme.blurTint}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
      )}

      <View
        style={[StyleSheet.absoluteFill, { borderRadius, backgroundColor: metal.fill }]}
        pointerEvents="none"
      />

      <LinearGradient
        colors={[...metal.plate]}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
        pointerEvents="none"
      />

      <LinearGradient
        colors={[...metal.sheen]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
        pointerEvents="none"
      />

      <LinearGradient
        colors={[...metal.specular]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.specular, { borderRadius }]}
        pointerEvents="none"
      />

      {accentColor ? (
        <LinearGradient
          colors={[`${accentColor}55`, `${accentColor}00`]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.accentGlow}
          pointerEvents="none"
        />
      ) : null}

      <View
        style={[
          StyleSheet.absoluteFill,
          styles.rim,
          { borderRadius, borderColor: metal.rim },
        ]}
        pointerEvents="none"
      />

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  webBlur: {
    backdropFilter: 'blur(20px) saturate(130%)',
  } as ViewStyle,
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '28%',
  },
  accentGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  rim: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
