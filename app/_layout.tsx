import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SplashBrand } from '@/components/SplashBrand';
import { SpatialThemeProvider } from '@/components/spatial/SpatialThemeContext';
import { configureReminderNotifications } from '@/lib/reminders';

const MIN_SPLASH_MS = 2200;

// Keep native splash up until our branded overlay is ready (no-op limitations in Expo Go).
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [showBrandSplash, setShowBrandSplash] = useState(true);

  useEffect(() => {
    void configureReminderNotifications();
  }, []);

  useEffect(() => {
    // Hide native splash as soon as React is up; we show SplashBrand instead.
    SplashScreen.hideAsync().catch(() => {});

    const timer = setTimeout(() => setShowBrandSplash(false), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SpatialThemeProvider>
      <StatusBar style="light" />
      <View style={styles.root}>
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
          <Stack.Screen name="check-before-taking" />
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
          <Stack.Screen name="health-cabinet" />
          <Stack.Screen name="cabinet-edit" />
          <Stack.Screen name="schedule-edit" />
          <Stack.Screen name="todays-doses" />
          <Stack.Screen name="product-lookup" />
          <Stack.Screen name="medicine-info" />
          <Stack.Screen name="emergency-contacts" />
          <Stack.Screen name="symptoms" />
          <Stack.Screen name="health-reports" />
          <Stack.Screen name="family" />
          <Stack.Screen name="observational-insights" />
          <Stack.Screen name="privacy" />
          <Stack.Screen name="terms" />
          <Stack.Screen name="support" />
        </Stack>

        {showBrandSplash ? (
          <View style={styles.splashOverlay} pointerEvents="auto">
            <SplashBrand />
          </View>
        ) : null}
      </View>
    </SpatialThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});
