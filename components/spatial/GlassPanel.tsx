import { BlurView } from 'expo-blur';
import { useMemo } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { radius, spacing } from '@/constants/theme';

type GlassPanelProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  padded?: boolean;
};

export function GlassPanel({
  children,
  style,
  intensity = 28,
  padded = false,
}: GlassPanelProps) {
  const theme = useSpatialTheme();

  const panelStyle = useMemo(
    () => ({
      backgroundColor: theme.glass,
      borderColor: theme.separator,
    }),
    [theme],
  );

  const content = (
    <View style={[padded && styles.padded, styles.inner]}>{children}</View>
  );

  if (Platform.OS === 'web') {
    return <View style={[styles.glass, panelStyle, style]}>{content}</View>;
  }

  return (
    <View style={[styles.wrapper, panelStyle, style]}>
      <BlurView intensity={intensity} tint={theme.blurTint} style={[styles.blur, panelStyle]}>
        {content}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  blur: {
    flex: 1,
  },
  glass: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    backgroundColor: 'transparent',
  },
  padded: {
    padding: spacing.lg,
  },
});
