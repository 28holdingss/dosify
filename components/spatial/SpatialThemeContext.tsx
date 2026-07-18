import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getSpatialTheme, SpatialTheme } from '@/constants/theme';

type ColorScheme = 'light' | 'dark';

type SpatialThemeContextValue = {
  scheme: ColorScheme;
  theme: SpatialTheme;
  toggleScheme: () => void;
  setScheme: (scheme: ColorScheme) => void;
};

const SpatialThemeContext = createContext<SpatialThemeContextValue | null>(null);

export function SpatialThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setScheme] = useState<ColorScheme>('dark');

  const toggleScheme = useCallback(() => {
    setScheme((current) => (current === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(
    () => ({
      scheme,
      theme: getSpatialTheme(scheme),
      toggleScheme,
      setScheme,
    }),
    [scheme, toggleScheme],
  );

  return (
    <SpatialThemeContext.Provider value={value}>{children}</SpatialThemeContext.Provider>
  );
}

export function useSpatialThemeContext(): SpatialThemeContextValue {
  const context = useContext(SpatialThemeContext);
  if (context) return context;

  return {
    scheme: 'dark',
    theme: getSpatialTheme('dark'),
    toggleScheme: () => {},
    setScheme: () => {},
  };
}
