/* eslint-disable @typescript-eslint/no-unsafe-return */
import { useCallback, useRef } from 'react';

import type { AnyFunction } from '../types';

export function useStableCallback<C extends AnyFunction>(callback: C) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback((...args: Parameters<C>) => {
    callbackRef.current(...args);
  }, []);
}

export function useDebouncedStableCallback<C extends AnyFunction>(
  callback: C,
  delay: number = 100
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useStableCallback((...args: Parameters<C>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  });
}
