import { Platform, useWindowDimensions } from 'react-native';
import { layout } from '@/constants/theme';

/** True when running on web at desktop width — switches to sidebar layout. */
export function useIsDesktopWeb(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= layout.desktopBreakpoint;
}
