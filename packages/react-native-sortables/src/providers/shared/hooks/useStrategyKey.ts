import { useMemo, useRef } from 'react';

import type { SortStrategyFactory } from '../../../types';

export default function useStrategyKey(strategy: SortStrategyFactory | string) {
  const counterRef = useRef(0);

  return useMemo(
    () =>
      typeof strategy === 'string' ? strategy : String(counterRef.current++),
    [strategy]
  );
}
