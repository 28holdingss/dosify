import { Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '@/constants/theme';
import { useIsDesktopWeb } from '@/hooks/useResponsiveLayout';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  padded?: boolean;
  /** Extra bottom space so content clears the floating tab dock. */
  dockPadding?: boolean;
};

export function Screen({
  children,
  scroll = true,
  style,
  padded = true,
  dockPadding = true,
}: ScreenProps) {
  const isDesktop = useIsDesktopWeb();

  const content = (
    <View
      style={[
        styles.column,
        !scroll && styles.fill,
        isDesktop && styles.desktopColumn,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            dockPadding && (isDesktop ? styles.desktopBottomPadding : styles.dockClearance),
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
  /** Clears FloatingDock (~72) + home indicator + margin */
  dockClearance: {
    paddingBottom: 140,
  },
  desktopBottomPadding: {
    paddingBottom: spacing.xxxl,
  },
  fill: {
    flex: 1,
  },
  column:
    Platform.OS === 'web'
      ? {
          width: '100%',
          maxWidth: layout.maxContentWidth,
          alignSelf: 'center' as const,
          flexGrow: 1,
        }
      : {
          width: '100%',
        },
  desktopColumn: {
    maxWidth: layout.maxDesktopContentWidth,
    paddingTop: spacing.xl,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
});
