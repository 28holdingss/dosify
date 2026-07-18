import type { SubstanceCategory } from '@/types/api';

export const FALLBACK_CATEGORIES: SubstanceCategory[] = [
  { id: 'prescription', name: 'Prescription Medicines', slug: 'prescription', icon: 'medical' },
  { id: 'otc', name: 'OTC Medicines', slug: 'otc', icon: 'bandage' },
  { id: 'vitamins', name: 'Vitamins & Supplements', slug: 'vitamins', icon: 'sunny' },
  { id: 'alcohol', name: 'Alcohol', slug: 'alcohol', icon: 'wine' },
  { id: 'cannabis', name: 'Cannabis', slug: 'cannabis', icon: 'leaf' },
  { id: 'nicotine', name: 'Nicotine', slug: 'nicotine', icon: 'flame' },
  { id: 'caffeine', name: 'Caffeine', slug: 'caffeine', icon: 'cafe' },
  { id: 'stimulants', name: 'Stimulants', slug: 'stimulants', icon: 'flash' },
  { id: 'psychedelics', name: 'Psychedelics', slug: 'psychedelics', icon: 'color-palette' },
  { id: 'sedatives', name: 'Sedatives', slug: 'sedatives', icon: 'water' },
  { id: 'herbals', name: 'Herbals', slug: 'herbals', icon: 'flower' },
  { id: 'other', name: 'Other', slug: 'other', icon: 'ellipse' },
];

export function filterCategoriesBySlug(
  categories: SubstanceCategory[],
  slugs: string[] | null
): SubstanceCategory[] {
  if (!slugs) return categories;
  return categories.filter((c) => slugs.includes(c.slug));
}
