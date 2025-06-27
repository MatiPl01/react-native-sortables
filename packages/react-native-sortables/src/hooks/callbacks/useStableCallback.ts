import { useCallback, useEffect, useRef } from 'react';

import type { AnyFunction } from '../../helperTypes';

export default function useStableCallback<C extends AnyFunction>(callback: C) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: Parameters<C>) => {
    callbackRef.current(...args);
  }, []);
}
