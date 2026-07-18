import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

type IconConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const CATEGORY_ICONS: Record<string, IconConfig> = {
  prescription: { icon: 'medical', color: '#3B82F6' },
  otc: { icon: 'bandage', color: '#22D3EE' },
  vitamins: { icon: 'nutrition', color: '#FACC15' },
  alcohol: { icon: 'wine', color: '#F87171' },
  cannabis: { icon: 'leaf', color: '#4ADE80' },
  nicotine: { icon: 'flame', color: '#C084FC' },
  caffeine: { icon: 'cafe', color: '#D97706' },
  stimulants: { icon: 'flash', color: '#FBBF24' },
  psychedelics: { icon: 'color-palette', color: '#F472B6' },
  sedatives: { icon: 'water', color: '#60A5FA' },
  herbals: { icon: 'flower', color: '#86EFAC' },
  other: { icon: 'ellipse', color: colors.textMuted },
  dissociatives: { icon: 'planet', color: '#60A5FA' },
};

const SUBSTANCE_ICONS: Record<string, IconConfig> = {
  Ibuprofen: { icon: 'medical', color: colors.green },
  Paracetamol: { icon: 'medical', color: colors.blue },
  'Vitamin D3': { icon: 'sunny', color: colors.orange },
  Coffee: { icon: 'cafe', color: colors.orange },
  Alcohol: { icon: 'wine', color: colors.purple },
  Cannabis: { icon: 'leaf', color: colors.green },
  Nicotine: { icon: 'flame', color: '#C084FC' },
  MDMA: { icon: 'heart', color: colors.pink },
  LSD: { icon: 'infinite', color: colors.purple },
  Cocaine: { icon: 'snow', color: colors.textSecondary },
  Ketamine: { icon: 'water', color: '#60A5FA' },
  Psilocybin: { icon: 'nutrition', color: '#F472B6' },
  Methamphetamine: { icon: 'flash', color: colors.danger },
  Amphetamine: { icon: 'flash', color: colors.warning },
  DMT: { icon: 'sparkles', color: colors.purple },
  '2C-B': { icon: 'color-palette', color: colors.pink },
  Kratom: { icon: 'leaf', color: '#86EFAC' },
  Sertraline: { icon: 'medical', color: '#3B82F6' },
  Oxycodone: { icon: 'medical', color: '#EF4444' },
  Modafinil: { icon: 'flash', color: '#FBBF24' },
  'THC Edible': { icon: 'nutrition', color: '#4ADE80' },
  'Energy Drink': { icon: 'flash', color: '#D97706' },
  GHB: { icon: 'water', color: '#60A5FA' },
  '1P-LSD': { icon: 'infinite', color: colors.purple },
  Heroin: { icon: 'medical', color: '#EF4444' },
  Fentanyl: { icon: 'warning', color: colors.danger },
  'L-Theanine': { icon: 'leaf', color: '#86EFAC' },
  Matcha: { icon: 'cafe', color: '#4ADE80' },
  PCP: { icon: 'planet', color: '#60A5FA' },
  'Lions Mane': { icon: 'nutrition', color: '#FACC15' },
};

export function getCategoryIcon(slug?: string | null): IconConfig {
  return CATEGORY_ICONS[slug ?? ''] ?? { icon: 'flask', color: colors.primary };
}

export function getSubstanceIcon(name: string, categorySlug?: string | null): IconConfig {
  return SUBSTANCE_ICONS[name] ?? getCategoryIcon(categorySlug);
}

export const LIBRARY_FILTER_SLUGS: Record<string, string[] | null> = {
  All: null,
  Medications: ['prescription', 'otc'],
  Vitamins: ['vitamins'],
  Substances: ['cannabis', 'stimulants', 'psychedelics', 'sedatives', 'herbals'],
  Alcohol: ['alcohol'],
};
