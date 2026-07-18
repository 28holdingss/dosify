import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { radius, spacing, typography } from '@/constants/theme';

type SpatialSectionProps = {
  title?: string;
  children: React.ReactNode;
  footer?: string;
  headerAction?: React.ReactNode;
  /** grouped = inset list card; plain = no wrapper (for grids) */
  layout?: 'grouped' | 'plain';
};

export function SpatialSection({
  title,
  children,
  footer,
  headerAction,
  layout = 'grouped',
}: SpatialSectionProps) {
  const theme = useSpatialTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginBottom: spacing.lg,
        },
        title: {
          ...typography.small,
          color: theme.textSecondary,
          letterSpacing: 0.2,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        },
        titleOnly: {
          marginBottom: spacing.md,
        },
        group: {
          backgroundColor: theme.glass,
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.separator,
          overflow: 'hidden',
        },
        footer: {
          ...typography.caption,
          color: theme.textSecondary,
          marginTop: spacing.sm,
          lineHeight: 18,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.section}>
      {title && (
        <View style={headerAction ? styles.headerRow : undefined}>
          <Text style={[styles.title, !headerAction && styles.titleOnly]}>
            {title.toUpperCase()}
          </Text>
          {headerAction}
        </View>
      )}
      {layout === 'grouped' ? (
        <View style={styles.group}>{children}</View>
      ) : (
        children
      )}
      {footer && <Text style={styles.footer}>{footer}</Text>}
    </View>
  );
}
