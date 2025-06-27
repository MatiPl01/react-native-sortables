import { useCallback, useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';

import { IS_WEB } from '../../../constants';
import { ReactNativeHapticFeedback } from '../adapters';

type HapticImpact = {
  light(): void;
  medium(): void;
};

let hapticFeedback: null | ReturnType<typeof ReactNativeHapticFeedback.load> =
  null;

export default function useHaptics(enabled: boolean): HapticImpact {
  const isEnabled = !IS_WEB && enabled;
  const enabledValue = useDerivedValue(() => isEnabled);

  if (isEnabled && !hapticFeedback) {
    hapticFeedback = ReactNativeHapticFeedback.load();
  }

  const light = useCallback(() => {
    'worklet';
    if (enabledValue.value) {
      hapticFeedback?.('impactLight');
    }
  }, [enabledValue]);

  const medium = useCallback(() => {
    'worklet';
    if (enabledValue.value) {
      hapticFeedback?.('impactMedium');
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
