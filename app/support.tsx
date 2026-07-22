import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';

const SUPPORT_EMAIL = 'support@mydosify.com';
const WEB = 'https://mydosify.com';

export default function SupportScreen() {
  const router = useRouter();

  const openMail = () => {
    void Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Dosify support')}`
    );
  };

  return (
    <Screen>
      <ScreenHeader title="Support" showBack onBack={() => router.back()} />

      <Text style={styles.lead}>
        We’re here to help with account access, Health Cabinet, reminders, Family & Care, and
        App Store questions.
      </Text>

      <Pressable onPress={openMail}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="mail-outline" size={22} color={colors.primary} />
            <View style={styles.copy}>
              <Text style={styles.title}>Email support</Text>
              <Text style={styles.meta}>{SUPPORT_EMAIL}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </Card>
      </Pressable>

      <Text style={styles.section}>Common topics</Text>
      <Card style={styles.block}>
        <Text style={styles.itemTitle}>Account & sign-in</Text>
        <Text style={styles.itemBody}>
          Use the same email you registered with. If you cannot sign in, email us from that
          address and we will help reset access.
        </Text>
      </Card>
      <Card style={styles.block}>
        <Text style={styles.itemTitle}>Delete my account</Text>
        <Text style={styles.itemBody}>
          Email {SUPPORT_EMAIL} from your account email with subject “Account deletion request”.
          We will verify ownership and delete associated personal data as described in our Privacy
          Policy.
        </Text>
      </Card>
      <Card style={styles.block}>
        <Text style={styles.itemTitle}>Apple Health / Watch</Text>
        <Text style={styles.itemBody}>
          Manage permissions in iOS Settings → Privacy & Security → Health → Dosify. Sync is
          available on iPhone builds; web does not read HealthKit.
        </Text>
      </Card>
      <Card style={styles.block}>
        <Text style={styles.itemTitle}>Medical emergencies</Text>
        <Text style={styles.itemBody}>
          Dosify is not an emergency service. Call your local emergency number immediately if you
          need urgent medical help.
        </Text>
      </Card>

      <Text style={styles.section}>Policies</Text>
      <View style={styles.links}>
        <Pressable onPress={() => router.push('/privacy' as never)}>
          <Text style={styles.link}>Privacy Policy</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/terms' as never)}>
          <Text style={styles.link}>Terms of Use</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(WEB)}>
          <Text style={styles.link}>{WEB.replace('https://', '')}</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>
        App Store Connect → Support URL: {WEB}/support{'\n'}
        Privacy Policy URL: {WEB}/privacy
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  copy: { flex: 1 },
  title: { ...typography.body, color: colors.text, fontWeight: '600' },
  meta: { ...typography.caption, color: colors.primary, marginTop: 2 },
  section: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  block: {
    marginBottom: spacing.sm,
  },
  itemTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  itemBody: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  links: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  link: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    ...typography.small,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: spacing.xxxl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceLight,
  },
});
