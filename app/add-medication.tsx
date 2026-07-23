import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';

const OPTIONS = [
  {
    key: 'scan',
    title: 'Scan packaging',
    subtitle: 'Use the camera to read a barcode on the box',
    icon: 'barcode-outline' as const,
    route: '/barcode-scan',
  },
  {
    key: 'lookup',
    title: 'Search product',
    subtitle: 'Look up a medication by name or barcode',
    icon: 'search-outline' as const,
    route: '/product-lookup',
  },
  {
    key: 'catalog',
    title: 'Search catalog',
    subtitle: 'Pick from Dosify’s substance library',
    icon: 'medkit-outline' as const,
    route: '/cabinet-edit',
  },
  {
    key: 'manual',
    title: 'Add manually',
    subtitle: 'Enter dose, quantity, and schedule yourself',
    icon: 'create-outline' as const,
    route: '/cabinet-edit',
  },
] as const;

export default function AddMedicationScreen() {
  const router = useRouter();

  return (
    <Screen>
      <ScreenHeader title="Add medication" showBack onBack={() => router.back()} />
      <Text style={styles.lead}>
        Choose how you want to add a medication to your Health Cabinet.
      </Text>

      {OPTIONS.map((option) => (
        <Pressable
          key={option.key}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => router.push(option.route as never)}
        >
          <View style={styles.icon}>
            <Ionicons name={option.icon} size={22} color={colors.primary} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{option.title}</Text>
            <Text style={styles.subtitle}>{option.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  rowPressed: {
    opacity: 0.88,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(99,102,241,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
