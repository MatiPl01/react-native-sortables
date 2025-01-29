import { useRef } from 'react';

import type { AnyFunction } from '../../types';
import useStableCallback from './useStableCallback';

export default function useDebouncedStableCallback<C extends AnyFunction>(
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
