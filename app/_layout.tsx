import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SpatialThemeProvider } from '@/components/spatial/SpatialThemeContext';

export default function RootLayout() {
  return (
    <SpatialThemeProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="setup-profile" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="log-search" />
        <Stack.Screen name="log-intake" />
        <Stack.Screen name="analysis" />
        <Stack.Screen name="effect-timeline" />
        <Stack.Screen name="check-interactions" />
        <Stack.Screen name="interaction-check" />
        <Stack.Screen name="interaction-alert" />
        <Stack.Screen name="substance-calendar" />
        <Stack.Screen name="insights" />
        <Stack.Screen name="trends" />
        <Stack.Screen name="substance-library" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="edit-health-profile" />
        <Stack.Screen name="emergency-info" />
        <Stack.Screen name="watch-sync" />
      </Stack>
    </SpatialThemeProvider>
  );
}
