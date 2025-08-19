import { useCallback, useEffect, useRef } from 'react';

import type { AnyFunction } from '../../helperTypes';

export default function useStableCallback<C extends AnyFunction>(callback: C) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (...args: Parameters<C>) => callbackRef.current(...args) as ReturnType<C>,
    []
  );
}
