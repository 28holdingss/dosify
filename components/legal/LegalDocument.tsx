import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, spacing, typography } from '@/constants/theme';

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalDocumentProps = {
  title: string;
  effectiveDate: string;
  intro?: string;
  sections: LegalSection[];
  footerNote?: string;
};

export function LegalDocument({
  title,
  effectiveDate,
  intro,
  sections,
  footerNote,
}: LegalDocumentProps) {
  const router = useRouter();

  return (
    <Screen>
      <ScreenHeader title={title} showBack onBack={() => router.back()} />

      <Text style={styles.effective}>Effective date: {effectiveDate}</Text>
      {intro ? <Text style={styles.paragraph}>{intro}</Text> : null}

      {sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text style={styles.heading}>{section.heading}</Text>
          {section.paragraphs.map((p) => (
            <Text key={p.slice(0, 48)} style={styles.paragraph}>
              {p}
            </Text>
          ))}
          {section.bullets?.map((b) => (
            <Text key={b} style={styles.bullet}>
              • {b}
            </Text>
          ))}
        </View>
      ))}

      {footerNote ? <Text style={styles.footerNote}>{footerNote}</Text> : null}

      <View style={styles.nav}>
        <Pressable onPress={() => router.push('/privacy' as never)}>
          <Text style={styles.navLink}>Privacy Policy</Text>
        </Pressable>
        <Text style={styles.navSep}>·</Text>
        <Pressable onPress={() => router.push('/terms' as never)}>
          <Text style={styles.navLink}>Terms of Use</Text>
        </Pressable>
        <Text style={styles.navSep}>·</Text>
        <Pressable onPress={() => router.push('/support' as never)}>
          <Text style={styles.navLink}>Support</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  effective: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  heading: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  paragraph: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  bullet: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
  footerNote: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  nav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  navLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  navSep: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
