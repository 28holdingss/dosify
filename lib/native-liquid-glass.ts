import { requireOptionalNativeModule } from 'expo-modules-core';
import type { ComponentType } from 'react';
import type { ViewProps } from 'react-native';
import { Platform } from 'react-native';

export type NativeLiquidGlassViewProps = ViewProps & {
  interactive?: boolean;
  effect?: 'clear' | 'regular' | 'none';
  colorScheme?: 'light' | 'dark' | 'system';
};

type NativeLiquidGlassModule = {
  LiquidGlassView: ComponentType<NativeLiquidGlassViewProps>;
  isLiquidGlassSupported: boolean;
};

let cached: NativeLiquidGlassModule | null | undefined;

/** Safe loader — never imports @callstack/liquid-glass in Expo Go. */
export function getNativeLiquidGlass(): NativeLiquidGlassModule | null {
  if (cached !== undefined) return cached;

  if (Platform.OS !== 'ios') {
    cached = null;
    return null;
  }

  const nativeModule = requireOptionalNativeModule('NativeLiquidGlassModule');
  if (!nativeModule) {
    cached = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@callstack/liquid-glass') as NativeLiquidGlassModule;
    cached = mod.isLiquidGlassSupported ? mod : null;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export function isNativeLiquidGlassAvailable(): boolean {
  return getNativeLiquidGlass() != null;
}
