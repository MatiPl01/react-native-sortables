import { useCallback, useEffect } from 'react';

import {
  type AnimatedTimeoutID,
  clearAnimatedTimeout,
  setAnimatedTimeout
} from '../utils/animatedTimeout';
import useMutableValue from './useMutableValue';

export default function useAnimatedDebounce() {
  const updateTimeoutId = useMutableValue<AnimatedTimeoutID>(-1);

  useEffect(() => {
    return () => {
      clearAnimatedTimeout(updateTimeoutId.value);
    };
  }, [updateTimeoutId]);

  const cancel = useCallback(() => {
    'worklet';
    clearAnimatedTimeout(updateTimeoutId.value);
    updateTimeoutId.value = -1;
  }, [updateTimeoutId]);

  const schedule = useCallback(
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

  return { cancel, schedule };
}
