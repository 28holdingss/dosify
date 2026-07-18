import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { radius, spacing, typography } from '@/constants/theme';

type SpatialFilterChipsProps = {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
};

export function SpatialFilterChips({ options, selected, onSelect }: SpatialFilterChipsProps) {
  const theme = useSpatialTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          gap: spacing.sm,
          paddingVertical: spacing.sm,
        },
        chip: {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
          backgroundColor: theme.card,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.separator,
        },
        chipActive: {
          backgroundColor: theme.accent,
          borderColor: theme.accent,
        },
        chipText: {
          ...typography.caption,
          color: theme.textSecondary,
          fontWeight: '500',
        },
        chipTextActive: {
          color: '#FFFFFF',
          fontWeight: '600',
        },
        pressed: {
          opacity: 0.88,
        },
      }),
    [theme],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const isActive = option === selected;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={({ pressed }) => [
              styles.chip,
              isActive && styles.chipActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
