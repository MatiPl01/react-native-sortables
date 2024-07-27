import { useCallback, useMemo } from 'react';

import { ReactNativeHapticFeedback } from '../lib';

type HapticImpact = {
  light(): void;
  medium(): void;
};

export function useHaptics(enabled: boolean): HapticImpact {
  let hapticFeedback: ReturnType<typeof ReactNativeHapticFeedback.load> = null;

  if (enabled) {
    hapticFeedback = ReactNativeHapticFeedback.load();
  }

  const light = useCallback(() => {
    'worklet';
    if (hapticFeedback) {
      hapticFeedback('impactLight');
    }
  }, [hapticFeedback]);

  const medium = useCallback(() => {
    'worklet';
    if (hapticFeedback) {
      hapticFeedback('impactMedium');
    }
  }, [hapticFeedback]);

  return useMemo(
    () => ({
      light,
      medium
    }),
    [light, medium]
  );
}
