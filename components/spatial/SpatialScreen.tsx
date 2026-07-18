import { Platform, ScrollView, StyleSheet, View, ViewStyle, type RefreshControlProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SpatialBackground } from '@/components/spatial/SpatialBackground';
import { layout, spacing } from '@/constants/theme';
import { useIsDesktopWeb } from '@/hooks/useResponsiveLayout';

type SpatialScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  padded?: boolean;
  /** Extra bottom padding for floating dock */
  dockPadding?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
};

export function SpatialScreen({
  children,
  scroll = true,
  style,
  padded = true,
  dockPadding = true,
  refreshControl,
}: SpatialScreenProps) {
  const isDesktop = useIsDesktopWeb();

  const content = (
    <View
      style={[
        styles.column,
        isDesktop && styles.desktopColumn,
        padded && styles.padded,
        dockPadding && (isDesktop ? styles.desktopBottomPadding : styles.dockPadding),
        style,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SpatialBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={refreshControl}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </SafeAreaView>
    </SpatialBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  column:
    Platform.OS === 'web'
      ? {
          width: '100%',
          maxWidth: layout.maxContentWidth,
          alignSelf: 'center' as const,
          flexGrow: 1,
        }
      : {},
  desktopColumn: {
    maxWidth: layout.maxDesktopContentWidth,
    paddingTop: spacing.xl,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
  dockPadding: {
    paddingBottom: 136,
  },
  desktopBottomPadding: {
    paddingBottom: spacing.xxxl,
  },
});
