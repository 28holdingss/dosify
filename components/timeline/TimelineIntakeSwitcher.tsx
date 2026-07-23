import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSpatialTheme } from '@/components/spatial/useSpatialTheme';
import { formatIntakeDateTime } from '@/lib/format';
import { radius, spacing, typography } from '@/constants/theme';

export type TimelineIntakeOption = {
  id: string;
  substanceName: string;
  takenAt: string;
};

type TimelineIntakePickerModalProps = {
  visible: boolean;
  options: TimelineIntakeOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function TimelineIntakePickerModal({
  visible,
  options,
  selectedId,
  onSelect,
  onClose,
}: TimelineIntakePickerModalProps) {
  const theme = useSpatialTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: theme.card,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: theme.separator,
          maxHeight: '55%',
          paddingBottom: spacing.xxl,
        },
        sheetHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.separator,
        },
        sheetTitle: {
          ...typography.h3,
          color: theme.text,
          fontWeight: '700',
        },
        closeBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.pressed,
          alignItems: 'center',
          justifyContent: 'center',
        },
        option: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.separator,
        },
        optionLast: {
          borderBottomWidth: 0,
        },
        optionPressed: {
          backgroundColor: theme.pressed,
        },
        optionCopy: {
          flex: 1,
          gap: 2,
        },
        optionName: {
          ...typography.body,
          color: theme.text,
          fontWeight: '600',
        },
        optionNameActive: {
          color: theme.accent,
        },
        optionMeta: {
          ...typography.caption,
          color: theme.textSecondary,
        },
        check: {
          width: 28,
          height: 28,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [theme],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Recent intakes</Text>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>
          <ScrollView bounces={false}>
            {options.map((option, index) => {
              const isActive = option.id === selectedId;
              const isLast = index === options.length - 1;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    onSelect(option.id);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    isLast && styles.optionLast,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <View style={styles.optionCopy}>
                    <Text
                      style={[styles.optionName, isActive && styles.optionNameActive]}
                      numberOfLines={1}
                    >
                      {option.substanceName}
                    </Text>
                    <Text style={styles.optionMeta} numberOfLines={1}>
                      {formatIntakeDateTime(new Date(option.takenAt))}
                    </Text>
                  </View>
                  <View style={styles.check}>
                    {isActive && (
                      <Ionicons name="checkmark" size={20} color={theme.accent} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** @deprecated Use TimelineIntakePickerModal */
export const TimelineIntakeSwitcher = TimelineIntakePickerModal;
