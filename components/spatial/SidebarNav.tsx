import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSpatialTheme, useSpatialThemeToggle } from '@/components/spatial/useSpatialTheme';
import { layout, radius, spacing, typography } from '@/constants/theme';

type NavItem = {
  label: string;
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  /** Paths that should highlight this item. */
  match: string[];
};

const MAIN_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: 'home-outline', iconActive: 'home', match: ['/'] },
  { label: 'Log Intake', href: '/log', icon: 'add-circle-outline', iconActive: 'add-circle', match: ['/log'] },
  { label: 'Timeline', href: '/timeline', icon: 'time-outline', iconActive: 'time', match: ['/timeline'] },
  { label: 'Recovery', href: '/recovery', icon: 'heart-outline', iconActive: 'heart', match: ['/recovery'] },
  { label: 'Profile', href: '/profile', icon: 'person-outline', iconActive: 'person', match: ['/profile'] },
];

const TOOL_ITEMS: NavItem[] = [
  { label: 'Insights', href: '/insights', icon: 'sparkles-outline', iconActive: 'sparkles', match: ['/insights'] },
  { label: 'Trends', href: '/trends', icon: 'trending-up-outline', iconActive: 'trending-up', match: ['/trends'] },
  { label: 'Calendar', href: '/substance-calendar', icon: 'calendar-outline', iconActive: 'calendar', match: ['/substance-calendar'] },
  { label: 'Library', href: '/substance-library', icon: 'book-outline', iconActive: 'book', match: ['/substance-library'] },
  { label: 'Interactions', href: '/check-before-taking', icon: 'shield-checkmark-outline', iconActive: 'shield-checkmark', match: ['/check-before-taking', '/check-interactions', '/interaction-check'] },
];

function SidebarItem({ item, active }: { item: NavItem; active: boolean }) {
  const theme = useSpatialTheme();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(item.href)}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.item,
        active && { backgroundColor: theme.pressed },
        !active && hovered && { backgroundColor: theme.pressed },
        pressed && { opacity: 0.7 },
      ]}
      accessibilityRole="link"
      accessibilityLabel={item.label}
    >
      <Ionicons
        name={active ? item.iconActive : item.icon}
        size={20}
        color={active ? theme.accent : theme.textSecondary}
      />
      <Text
        style={[
          styles.itemLabel,
          { color: active ? theme.text : theme.textSecondary },
          active && styles.itemLabelActive,
        ]}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

export function SidebarNav() {
  const theme = useSpatialTheme();
  const { scheme, toggleScheme } = useSpatialThemeToggle();
  const pathname = usePathname();

  const isActive = useMemo(
    () => (item: NavItem) => item.match.includes(pathname),
    [pathname],
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.glass, borderColor: theme.separator },
      ]}
    >
      <View style={styles.brand}>
        <View style={[styles.brandIcon, { backgroundColor: theme.accent }]}>
          <Ionicons name="pulse" size={18} color="#FFFFFF" />
        </View>
        <Text style={[styles.brandName, { color: theme.text }]}>Dosify</Text>
      </View>

      <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Menu</Text>
        {MAIN_ITEMS.map((item) => (
          <SidebarItem key={item.label} item={item} active={isActive(item)} />
        ))}

        <Text style={[styles.sectionLabel, styles.sectionSpacing, { color: theme.textMuted }]}>
          Tools
        </Text>
        {TOOL_ITEMS.map((item) => (
          <SidebarItem key={item.label} item={item} active={isActive(item)} />
        ))}
      </ScrollView>

      <Pressable
        onPress={toggleScheme}
        style={({ hovered }: { hovered?: boolean }) => [
          styles.footerBtn,
          { borderTopColor: theme.separator },
          hovered && { backgroundColor: theme.pressed },
        ]}
        accessibilityRole="button"
        accessibilityLabel={scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <Ionicons
          name={scheme === 'dark' ? 'sunny-outline' : 'moon-outline'}
          size={18}
          color={theme.textSecondary}
        />
        <Text style={[styles.itemLabel, { color: theme.textSecondary }]}>
          {scheme === 'dark' ? 'Light mode' : 'Dark mode'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: layout.sidebarWidth,
    margin: spacing.lg,
    marginRight: 0,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  nav: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  sectionLabel: {
    ...typography.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionSpacing: {
    marginTop: spacing.xxl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginBottom: 2,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemLabelActive: {
    fontWeight: '600',
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
