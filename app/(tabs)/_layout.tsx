import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { FloatingDock } from '@/components/spatial/FloatingDock';
import { SidebarNav } from '@/components/spatial/SidebarNav';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { useIsDesktopWeb } from '@/hooks/useResponsiveLayout';

export default function TabLayout() {
  const isDesktop = useIsDesktopWeb();
  const theme = useSpatialTheme();

  const tabs = (
    <Tabs
      tabBar={isDesktop ? () => null : (props) => <FloatingDock {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="log" options={{ title: 'Log' }} />
      <Tabs.Screen name="timeline" options={{ title: 'Timeline' }} />
      <Tabs.Screen name="recovery" options={{ title: 'Recovery' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );

  if (!isDesktop) return tabs;

  return (
    <View style={[styles.desktop, { backgroundColor: theme.background }]}>
      <SidebarNav />
      <View style={styles.desktopContent}>{tabs}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  desktop: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopContent: {
    flex: 1,
  },
});
