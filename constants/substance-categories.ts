/** Display order for the log-search category grid (matches library UX). */
export const CATEGORY_DISPLAY_ORDER = [
  'prescription',
  'otc',
  'vitamins',
  'alcohol',
  'cannabis',
  'nicotine',
  'caffeine',
  'stimulants',
  'psychedelics',
  'sedatives',
  'herbals',
  'other',
] as const;

export const LOG_SEARCH_FILTERS = ['All', 'Substances', 'Medicines', 'Vitamins', 'Lifestyle'] as const;

export type LogSearchFilter = (typeof LOG_SEARCH_FILTERS)[number];

export const LOG_SEARCH_FILTER_SLUGS: Record<LogSearchFilter, string[] | null> = {
  All: null,
  Substances: [
    'cannabis',
    'alcohol',
    'nicotine',
    'caffeine',
    'stimulants',
    'psychedelics',
    'sedatives',
    'herbals',
  ],
  Medicines: ['prescription', 'otc'],
  Vitamins: ['vitamins'],
  Lifestyle: ['caffeine', 'alcohol', 'nicotine'],
};

export function sortCategoriesByDisplayOrder<T extends { slug: string }>(categories: T[]): T[] {
  const order = new Map(CATEGORY_DISPLAY_ORDER.map((slug, index) => [slug, index]));
  return [...categories].sort(
    (a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999)
  );
}
