import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { radius } from '@/constants/theme';
import { getNativeLiquidGlass } from '@/lib/native-liquid-glass';

type LiquidGlassSurfaceProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  borderRadius?: number;
  /** Use a lighter glass variant for nested surfaces (e.g. tab indicator). */
  variant?: 'regular' | 'clear';
  interactive?: boolean;
};

function BlurGlassSurface({
  children,
  style,
  borderRadius,
  theme,
}: LiquidGlassSurfaceProps & { theme: ReturnType<typeof useSpatialTheme> }) {
  return (
    <View
      style={[
        styles.base,
        styles.outer,
        { borderRadius, shadowColor: theme.liquid.shadow },
        style,
      ]}
    >
      {Platform.OS === 'web' ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.webBlur,
            { borderRadius, backgroundColor: theme.liquid.fill },
          ]}
        />
      ) : (
        <BlurView
          intensity={Platform.OS === 'ios' ? 72 : 48}
          tint={theme.blurTint}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
      )}
      <View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius, backgroundColor: theme.liquid.fill },
        ]}
      />
      <LinearGradient
        colors={[theme.liquid.highlight, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.rim,
          { borderRadius, borderColor: theme.liquid.rim },
        ]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

export function LiquidGlassSurface({
  children,
  style,
  borderRadius = radius.full,
  variant = 'regular',
  interactive = false,
}: LiquidGlassSurfaceProps) {
  const theme = useSpatialTheme();
  const nativeGlass = getNativeLiquidGlass();

  if (nativeGlass) {
    const { LiquidGlassView } = nativeGlass;
    return (
      <LiquidGlassView
        style={[
          styles.base,
          styles.native,
          { borderRadius, shadowColor: theme.liquid.shadow },
          style,
        ]}
        effect={variant}
        interactive={interactive}
        colorScheme={theme.blurTint === 'dark' ? 'dark' : 'light'}
      >
        {children}
      </LiquidGlassView>
    );
  }

  return (
    <BlurGlassSurface style={style} borderRadius={borderRadius} theme={theme}>
      {children}
    </BlurGlassSurface>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 14,
  },
  native: {
    backgroundColor: 'transparent',
  },
  outer: {
    position: 'relative',
  },
  webBlur: {
    backdropFilter: 'blur(24px) saturate(180%)',
  } as ViewStyle,
  rim: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
