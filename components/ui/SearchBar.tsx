import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';

type SearchBarProps = {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: TextInputProps['onFocus'];
  autoFocus?: boolean;
  /** Override the default product-lookup route. */
  onScanPress?: () => void;
  style?: ViewStyle;
  inputProps?: Omit<
    TextInputProps,
    'value' | 'onChangeText' | 'placeholder' | 'onFocus' | 'autoFocus' | 'style'
  >;
};

export function SearchBar({
  placeholder = 'Search…',
  value,
  onChangeText,
  onFocus,
  autoFocus,
  onScanPress,
  style,
  inputProps,
}: SearchBarProps) {
  const router = useRouter();

  const handleScan = () => {
    if (onScanPress) {
      onScanPress();
      return;
    }
    router.push('/barcode-scan' as never);
  };

  return (
    <View style={[styles.searchBox, style]}>
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        {...inputProps}
      />
      <Pressable
        onPress={handleScan}
        hitSlop={8}
        style={({ pressed }) => [styles.scanBtn, pressed && styles.scanBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel="Scan barcode"
      >
        <Ionicons name="barcode-outline" size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  scanBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  scanBtnPressed: {
    opacity: 0.7,
  },
});
