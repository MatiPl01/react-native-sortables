/* eslint-disable @typescript-eslint/no-unsafe-return */
import { useCallback, useRef } from 'react';
import { runOnJS, runOnUI } from 'react-native-reanimated';

import type { AnyFunction } from '../types';
import { noop } from '../utils';

export function useStableCallback<C extends AnyFunction>(callback: C) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback((...args: Parameters<C>) => {
    callbackRef.current(...args);
  }, []);
}

export function useUIStableCallback<C extends AnyFunction>(callback: C) {
  return useStableCallback(
    runOnUI((...args: Parameters<C>) => callback(...args))
  );
}

export function useJSStableCallback<C extends AnyFunction>(callback?: C) {
  const hasCallback = !!callback;
  const stableCallback = useStableCallback(callback ?? noop);

  return useCallback(
    (...args: Parameters<C>) => {
      'worklet';
      if (hasCallback) runOnJS(stableCallback)(...args);
    },
    [stableCallback, hasCallback]
  );
}
