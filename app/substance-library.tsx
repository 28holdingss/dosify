import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterChips } from '@/components/ui/FilterChips';
import { GradientButton } from '@/components/ui/GradientButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useSubstances } from '@/hooks/useApi';
import { getSubstanceIcon, LIBRARY_FILTER_SLUGS } from '@/lib/substance-icons';

export default function SubstanceLibraryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const { data: substances, loading, error } = useSubstances({
    popular: filter === 'All' && !search ? true : undefined,
    search: search || undefined,
  });

  const filtered = useMemo(() => {
    if (!substances) return [];
    const slugs = LIBRARY_FILTER_SLUGS[filter];
    if (!slugs) return substances;
    return substances.filter((s) => slugs.includes(s.category?.slug ?? ''));
  }, [substances, filter]);

  return (
    <Screen>
      <ScreenHeader
        title="Substance Library"
        showBack
        onBack={() => router.back()}
      />

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          placeholder="Search substances..."
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FilterChips
        options={['All', 'Medications', 'Vitamins', 'Substances', 'Alcohol']}
        selected={filter}
        onSelect={setFilter}
      />

      {error && (
        <Text style={styles.errorText}>Could not load substances. Is the API running?</Text>
      )}

      <Text style={styles.sectionTitle}>
        {search ? 'Results' : 'Popular'}
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
      ) : (
        filtered.map((item) => {
          const icon = getSubstanceIcon(item.name, item.category?.slug);
          return (
            <Pressable
              key={item.id}
              style={styles.substanceRow}
              onPress={() =>
                router.push({
                  pathname: '/log-intake',
                  params: { substanceId: item.id },
                })
              }
            >
              <View style={[styles.icon, { backgroundColor: `${icon.color}22` }]}>
                <Ionicons name={icon.icon} size={22} color={icon.color} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.desc}>{item.description ?? item.category?.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          );
        })
      )}

      {!loading && filtered.length === 0 && (
        <Text style={styles.emptyText}>No substances found.</Text>
      )}

      <GradientButton
        title={`Browse All (${substances?.length ?? 0}+)`}
        onPress={() => {
          setFilter('All');
          setSearch('');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  errorText: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  substanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  desc: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
});
