import { useCallback, useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';

import { ReactNativeHapticFeedback } from '../lib';

type HapticImpact = {
  light(): void;
  medium(): void;
};

export function useHaptics(enabled: boolean): HapticImpact {
  let hapticFeedback: ReturnType<typeof ReactNativeHapticFeedback.load> = null;
  const enabledValue = useDerivedValue(() => enabled);

  if (enabled) {
    hapticFeedback = ReactNativeHapticFeedback.load();
  }

  const light = useCallback(() => {
    'worklet';
    if (hapticFeedback && enabledValue.value) {
      hapticFeedback('impactLight');
    }
  }, [hapticFeedback, enabledValue]);

  const medium = useCallback(() => {
    'worklet';
    if (hapticFeedback && enabledValue.value) {
      hapticFeedback('impactMedium');
    }
  }, [hapticFeedback, enabledValue]);

  return useMemo(
    () => ({
      light,
      medium
    }),
    [light, medium]
  );
}
