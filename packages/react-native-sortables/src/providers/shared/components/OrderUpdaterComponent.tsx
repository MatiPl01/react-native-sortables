import { useMemo, useRef } from 'react';

import type {
  OrderUpdaterProps,
  PredefinedStrategies,
  SortStrategyFactory
} from '../../../types';
import { error, typedMemo } from '../../../utils';
import { useOrderUpdater } from '../hooks';

export function useStrategyKey(strategy: SortStrategyFactory | string) {
  const counterRef = useRef(0);

  return useMemo(
    () =>
      typeof strategy === 'string' ? strategy : String(counterRef.current++),
    [strategy]
  );
}

function OrderUpdaterComponent<P extends PredefinedStrategies>({
  predefinedStrategies,
  strategy,
  triggerOrigin
}: OrderUpdaterProps<P>) {
  const useStrategy =
    typeof strategy === 'string' ? predefinedStrategies[strategy] : strategy;

  if (!useStrategy || typeof useStrategy !== 'function') {
    throw error(`'${String(useStrategy)}' is not a valid ordering strategy`);
  }

  const updater = useStrategy();
  useOrderUpdater(updater, triggerOrigin);

  return null;
}

export default typedMemo(OrderUpdaterComponent);
