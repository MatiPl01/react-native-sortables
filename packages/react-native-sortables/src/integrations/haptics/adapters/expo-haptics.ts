/**
 * Optional expo-haptics adapter. We never import the package (a static import
 * would break Metro for bare apps without it); instead we read its native
 * module from the Expo runtime registry, so it is picked up in any Expo app and
 * ignored elsewhere.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { runOnJS } from 'react-native-reanimated';

import type { HapticsAdapter, HapticTrigger } from './types';

const load = (): HapticTrigger | null => {
  const expoHaptics = (globalThis as any).expo?.modules?.ExpoHaptics;

  if (!expoHaptics?.impactAsync) {
    return null;
  }

  const impact = (style: string) => {
    try {
      // expo-haptics' native method is async; fire-and-forget and swallow
      // rejections (e.g. when haptics are unsupported on the device)
      const result = expoHaptics.impactAsync(style);
      result?.catch?.(() => {
        // ignore rejection
      });
    } catch {
      // ignore
    }
  };

  const trigger: HapticTrigger = (type = 'impactLight') => {
    'worklet';
    // expo-haptics runs on the JS thread, so hop over from the UI worklet
    runOnJS(impact)(type === 'impactMedium' ? 'medium' : 'light');
  };

  return trigger;
};

const ExpoHaptics: HapticsAdapter = { load, name: 'expo-haptics' };

export default ExpoHaptics;
