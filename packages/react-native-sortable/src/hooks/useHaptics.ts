import { useCallback, useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';

import { ExpoHaptics, ReactNativeHapticFeedback } from '../lib';

type HapticImpact = {
  light(): void;
  medium(): void;
};

let expoHaptics: ReturnType<typeof ExpoHaptics.load> = null;
let hapticFeedback: ReturnType<typeof ReactNativeHapticFeedback.load> = null;

export default function useHaptics(enabled: boolean): HapticImpact {
  const enabledValue = useDerivedValue(() => enabled);

  if (enabled && !expoHaptics && !hapticFeedback) {
    expoHaptics = ExpoHaptics.load();
    if (!expoHaptics) {
      hapticFeedback = ReactNativeHapticFeedback.load();
    }
  }

  const light = useCallback(() => {
    'worklet';
    if (!enabledValue.value) return;
    if (expoHaptics) {
      const { trigger, ImpactFeedbackStyle } = expoHaptics;
      trigger(ImpactFeedbackStyle.Light);
    } else if (hapticFeedback) {
      hapticFeedback.trigger('impactLight');
    }
  }, [enabledValue]);

  const medium = useCallback(() => {
    'worklet';
    if (!enabledValue.value) return;
    if (expoHaptics) {
      const { trigger, ImpactFeedbackStyle } = expoHaptics;
      trigger(ImpactFeedbackStyle.Medium);
    } else if (hapticFeedback) {
      hapticFeedback.trigger('impactMedium');
    }
  }, [enabledValue]);

  return useMemo(
    () => ({
      light,
      medium
    }),
    [light, medium]
  );
}
