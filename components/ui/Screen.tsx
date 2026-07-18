import { Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '@/constants/theme';
import { useIsDesktopWeb } from '@/hooks/useResponsiveLayout';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  padded?: boolean;
};

export function Screen({ children, scroll = true, style, padded = true }: ScreenProps) {
  const isDesktop = useIsDesktopWeb();

  const content = (
    <View
      style={[
        styles.column,
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
          contentContainerStyle={styles.scrollContent}
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
    paddingBottom: spacing.xxxl,
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
});
