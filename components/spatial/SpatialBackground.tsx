import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useSpatialColorScheme, useSpatialTheme } from '@/components/spatial/useSpatialTheme';

type SpatialBackgroundProps = {
  children: React.ReactNode;
};

/** Soft ambient wash so transparent / metallic cards have depth to sit on. */
export function SpatialBackground({ children }: SpatialBackgroundProps) {
  const theme = useSpatialTheme();
  const scheme = useSpatialColorScheme();
  const isLight = scheme === 'light';

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={
          isLight
            ? ['rgba(180, 200, 230, 0.18)', 'transparent', 'rgba(200, 210, 230, 0.1)']
            : ['rgba(40, 52, 72, 0.14)', 'transparent', 'rgba(24, 28, 40, 0.18)']
        }
        locations={[0, 0.45, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
});
