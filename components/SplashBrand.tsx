import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/constants/theme';

/** Sky blue sampled from dosifybg.jpeg — native splash + UI match. */
export const SPLASH_BG = '#3B9BE8';

type SplashBrandProps = {
  tagline?: string;
};

/**
 * Full-bleed branded splash used while the app boots.
 * Native splash (app.json) uses the same image — visible in release/TestFlight builds.
 * Expo Go shows this React splash instead (native splash is limited there).
 */
export function SplashBrand({
  tagline = 'Know your body. Make safer choices.',
}: SplashBrandProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('@/assets/images/dosifybg.jpeg')}
        style={styles.bg}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(11,14,20,0.2)', 'rgba(11,14,20,0.05)', 'rgba(11,14,20,0.75)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.topBrand,
            { paddingTop: Math.max(insets.top, spacing.xl) + spacing.xxl },
          ]}
        >
          <View style={styles.logoBadge}>
            <Image
              source={require('@/assets/images/dosify.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        <View
          style={[
            styles.bottom,
            { paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.xxl },
          ]}
        >
          <Text style={styles.name}>Dosify</Text>
          <Text style={styles.tagline}>{tagline}</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SPLASH_BG,
  },
  bg: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBrand: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    overflow: 'hidden',
  },
  logo: {
    width: 96,
    height: 96,
  },
  bottom: {
    paddingHorizontal: spacing.xxl,
  },
  name: {
    ...typography.h1,
    fontSize: 40,
    color: colors.text,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.body,
    color: 'rgba(255,255,255,0.88)',
    marginTop: spacing.sm,
    lineHeight: 22,
    maxWidth: 280,
  },
});
