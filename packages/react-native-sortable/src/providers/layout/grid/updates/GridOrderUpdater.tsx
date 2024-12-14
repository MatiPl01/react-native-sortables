import { useMemo } from 'react';

import { useDebugContext } from '../../../../debug';
import type { SortableGridStrategy } from '../../../../types';
import { useCommonValuesContext, useOrderUpdater } from '../../../shared';
import { useGridLayoutContext } from '../GridLayoutProvider';
import strategies from './strategies';

type OrderUpdaterProps = {
  strategy: SortableGridStrategy;
};

export default function GridOrderUpdater({ strategy }: OrderUpdaterProps) {
  const factory =
    typeof strategy === 'string' ? strategies[strategy] : strategy;

  const commonValues = useCommonValuesContext();
  const gridLayout = useGridLayoutContext();
  const debug = useDebugContext();

  const updater = useMemo(
    () =>
      factory({
        ...commonValues,
        ...gridLayout,
        ...debug
      }),
    [factory, commonValues, gridLayout, debug]
  );

  useOrderUpdater(updater);

  return null;
}
