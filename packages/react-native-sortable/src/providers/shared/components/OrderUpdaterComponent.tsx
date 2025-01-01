import { useMemo, useRef } from 'react';

import { useDebugContext } from '../../../debug';
import type { AnyRecord, OrderUpdater } from '../../../types';
import { typedMemo } from '../../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { useOrderUpdater } from '../hooks';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyStrategyFactory = (props: any) => OrderUpdater;

type PredefinedStrategies = Record<string, AnyStrategyFactory>;

export function useStrategyKey(strategy: AnyStrategyFactory | string) {
  const counterRef = useRef(0);

  return useMemo(
    () =>
      typeof strategy === 'string' ? strategy : String(counterRef.current++),
    [strategy]
  );
}

type OrderUpdaterProps<P extends PredefinedStrategies> = {
  predefinedStrategies: P;
  strategy: AnyStrategyFactory | keyof P;
  additionalValues: AnyRecord;
};

function OrderUpdaterComponent<P extends PredefinedStrategies>({
  additionalValues,
  predefinedStrategies,
  strategy
}: OrderUpdaterProps<P>) {
  const factory =
    typeof strategy === 'string' ? predefinedStrategies[strategy] : strategy;

  if (!factory && typeof strategy === 'string') {
    throw new Error(`'${strategy}' is not a valid ordering strategy`);
  }

  const updater = (factory as AnyStrategyFactory)({
    ...useCommonValuesContext(),
    ...useDebugContext(),
    ...additionalValues
  });

  useOrderUpdater(updater);

  return null;
}

export default typedMemo(OrderUpdaterComponent);
