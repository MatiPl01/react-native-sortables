import { useCallback, useEffect } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import {
  type AnimatedTimeoutID,
  clearAnimatedTimeout,
  setAnimatedTimeout
} from './animatedTimeout';

export function useAnimatedDebounce() {
  const updateTimeoutId = useSharedValue<AnimatedTimeoutID>(-1);

  useEffect(() => {
    return () => {
      clearAnimatedTimeout(updateTimeoutId.value);
    };
  }, [updateTimeoutId]);

  const debounce = useCallback(
    (callback: () => void, timeout: number) => {
      'worklet';
      if (updateTimeoutId.value !== -1) {
        clearAnimatedTimeout(updateTimeoutId.value);
      }
      updateTimeoutId.value = setAnimatedTimeout(() => {
        callback();
        updateTimeoutId.value = -1;
      }, timeout);
    },
    [updateTimeoutId]
  );

  return debounce;
}
