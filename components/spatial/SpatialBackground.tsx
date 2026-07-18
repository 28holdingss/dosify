import { StyleSheet, View } from 'react-native';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';

type SpatialBackgroundProps = {
  children: React.ReactNode;
};

export function SpatialBackground({ children }: SpatialBackgroundProps) {
  const theme = useSpatialTheme();

  return <View style={[styles.root, { backgroundColor: theme.background }]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
