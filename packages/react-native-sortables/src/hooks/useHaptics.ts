import { useCallback, useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';

import { ReactNativeHapticFeedback } from '../lib';

type HapticImpact = {
  light(): void;
  medium(): void;
};

let hapticFeedback: ReturnType<typeof ReactNativeHapticFeedback.load> = null;

export default function useHaptics(enabled: boolean): HapticImpact {
  const enabledValue = useDerivedValue(() => enabled);

  if (enabled && !hapticFeedback) {
    hapticFeedback = ReactNativeHapticFeedback.load();
  }

  const light = useCallback(() => {
    'worklet';
    if (hapticFeedback && enabledValue.value) {
      hapticFeedback('impactLight');
    }
  }, [enabledValue]);

  const medium = useCallback(() => {
    'worklet';
    if (hapticFeedback && enabledValue.value) {
      hapticFeedback('impactMedium');
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
