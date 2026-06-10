/**
 * Optional expo-haptics adapter.
 *
 * We never import `expo-haptics` directly, because a static import would break
 * Metro bundling for bare React Native apps that don't have it installed.
 * Instead we read its native module from the Expo runtime registry, so it's
 * picked up automatically in any Expo app (including Expo Go) and ignored
 * everywhere else.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { runOnJS } from 'react-native-reanimated';

const load = () => {
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

  const trigger = (type = 'impactLight') => {
    'worklet';
    // expo-haptics runs on the JS thread, so hop over from the UI worklet
    runOnJS(impact)(type === 'impactMedium' ? 'medium' : 'light');
  };

  return trigger;
};

const ExpoHaptics = { load };

export default ExpoHaptics;
