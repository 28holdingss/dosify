import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryGridCard } from '@/components/ui/CategoryGridCard';
import { FilterChips } from '@/components/ui/FilterChips';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { FALLBACK_CATEGORIES, filterCategoriesBySlug } from '@/constants/fallback-data';
import {
  LOG_SEARCH_FILTERS,
  LOG_SEARCH_FILTER_SLUGS,
  sortCategoriesByDisplayOrder,
  type LogSearchFilter,
} from '@/constants/substance-categories';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useSubstanceCategories, useSubstances } from '@/hooks/useApi';
import { getSubstanceIcon } from '@/lib/substance-icons';

export default function LogSearchScreen() {
  const router = useRouter();
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
  const [filter, setFilter] = useState<LogSearchFilter>('All');
  const [search, setSearch] = useState('');

  const isBrowsingCategory = Boolean(categoryParam);
  const isSearching = search.trim().length > 0;
  const showSubstanceList = isBrowsingCategory || isSearching;

  const { data: categories, loading: catsLoading, error: catsError } = useSubstanceCategories();
  const { data: substances, loading: subsLoading, error: subsError } = useSubstances({
    category: categoryParam,
    search: search || undefined,
    popular: !showSubstanceList ? true : undefined,
  });

  const displayCategories = useMemo(() => {
    const source = categories?.length ? categories : FALLBACK_CATEGORIES;
    const filtered = filterCategoriesBySlug(source, LOG_SEARCH_FILTER_SLUGS[filter]);
    return sortCategoriesByDisplayOrder(filtered);
  }, [categories, filter]);

  const popularSubstances = useMemo(() => {
    if (showSubstanceList || !substances) return [];
    return substances;
  }, [showSubstanceList, substances]);

  const listSubstances = showSubstanceList ? substances : null;
  const loading = showSubstanceList ? subsLoading : catsLoading || subsLoading;
  const apiError = catsError || subsError;

  const navigateToIntake = (substanceId: string) => {
    router.push({
      pathname: '/log-intake',
      params: { substanceId },
    });
  };

  return (
    <Screen>
      <ScreenHeader
        title="What would you like to log?"
        showBack
        onBack={() => router.back()}
      />

      <SearchBar
        placeholder="Search for any substance, medicine..."
        value={search}
        onChangeText={setSearch}
        autoFocus={!categoryParam}
        style={{ marginBottom: spacing.md }}
      />

      {!isBrowsingCategory && (
        <FilterChips
          options={[...LOG_SEARCH_FILTERS]}
          selected={filter}
          onSelect={(value) => setFilter(value as LogSearchFilter)}
        />
      )}

      {apiError && !categories?.length && (
        <Text style={styles.errorText}>
          API offline — showing cached categories. Start server with `npm run server:dev`.
        </Text>
      )}

      {loading && (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
      )}

      {showSubstanceList ? (
        <>
          {isBrowsingCategory && (
            <Text style={styles.sectionTitle}>
              {displayCategories.find((c) => c.slug === categoryParam)?.name ?? 'Substances'}
            </Text>
          )}
          {listSubstances && listSubstances.length > 0 ? (
            listSubstances.map((sub) => {
              const icon = getSubstanceIcon(sub.name, sub.category?.slug);
              return (
                <Pressable
                  key={sub.id}
                  style={styles.row}
                  onPress={() => navigateToIntake(sub.id)}
                >
                  <View style={[styles.icon, { backgroundColor: `${icon.color}22` }]}>
                    <Ionicons name={icon.icon} size={22} color={icon.color} />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{sub.name}</Text>
                    <Text style={styles.desc}>{sub.description}</Text>
                    {sub.category?.name ? (
                      <Text style={styles.categoryTag}>{sub.category.name}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              );
            })
          ) : (
            !loading && (
              <Text style={styles.emptyText}>
                {apiError
                  ? 'Could not load substances. Make sure the API is running (`npm run server:dev`).'
                  : 'No substances found.'}
              </Text>
            )
          )}
        </>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Pressable onPress={() => setFilter('All')}>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          </View>

          <View style={styles.grid}>
            {displayCategories.map((cat) => (
              <CategoryGridCard
                key={cat.id}
                name={cat.name}
                slug={cat.slug}
                count={cat._count?.substances ?? 0}
                onPress={() =>
                  router.push({
                    pathname: '/log-search',
                    params: { category: cat.slug },
                  })
                }
              />
            ))}
          </View>

          {popularSubstances.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, styles.popularTitle]}>Popular</Text>
              {popularSubstances.map((sub) => {
                const icon = getSubstanceIcon(sub.name, sub.category?.slug);
                return (
                  <Pressable
                    key={sub.id}
                    style={styles.row}
                    onPress={() => navigateToIntake(sub.id)}
                  >
                    <View style={[styles.icon, { backgroundColor: `${icon.color}22` }]}>
                      <Ionicons name={icon.icon} size={22} color={icon.color} />
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.name}>{sub.name}</Text>
                      <Text style={styles.desc}>{sub.description}</Text>
                      {sub.category?.name ? (
                        <Text style={styles.categoryTag}>{sub.category.name}</Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </Pressable>
                );
              })}
            </>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorText: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  popularTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  viewAll: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  row: {
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
  categoryTag: {
    ...typography.small,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
