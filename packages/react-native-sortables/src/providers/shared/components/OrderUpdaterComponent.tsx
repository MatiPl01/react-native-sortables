import { useMemo, useRef } from 'react';

import { useDebugContext } from '../../../debug';
import type {
  AnyStrategyFactory,
  OrderUpdaterProps,
  PredefinedStrategies
} from '../../../types';
import { error, typedMemo } from '../../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { useOrderUpdater } from '../hooks';

export function useStrategyKey(strategy: AnyStrategyFactory | string) {
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
  useAdditionalValues
}: OrderUpdaterProps<P>) {
  const factory =
    typeof strategy === 'string' ? predefinedStrategies[strategy] : strategy;

  if (!factory && typeof strategy === 'string') {
    throw error(`'${strategy}' is not a valid ordering strategy`);
  }

  const updater = (factory as AnyStrategyFactory)({
    debugContext: useDebugContext(),
    ...useCommonValuesContext(),
    ...useAdditionalValues()
  });

  useOrderUpdater(updater);

  return null;
}

export default typedMemo(OrderUpdaterComponent);
