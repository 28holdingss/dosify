import { useSpatialThemeContext } from '@/components/spatial/SpatialThemeContext';

export function useSpatialTheme() {
  return useSpatialThemeContext().theme;
}

export function useSpatialColorScheme() {
  return useSpatialThemeContext().scheme;
}

export function useSpatialThemeToggle() {
  const { scheme, toggleScheme } = useSpatialThemeContext();
  return { scheme, toggleScheme };
}
