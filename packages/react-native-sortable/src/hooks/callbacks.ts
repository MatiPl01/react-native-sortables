/* eslint-disable @typescript-eslint/no-unsafe-return */
import { useCallback, useRef } from 'react';
import { runOnUI } from 'react-native-reanimated';

import type { AnyFunction } from '@/types';

export function useStableCallback<C extends AnyFunction>(callback: C) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    (...args: Parameters<C>) => callbackRef.current(...args),
    []
  );
}

export function useUICallback<C extends AnyFunction>(callback: C) {
  return useStableCallback(
    runOnUI((...args: Parameters<C>) => callback(...args))
  );
}
