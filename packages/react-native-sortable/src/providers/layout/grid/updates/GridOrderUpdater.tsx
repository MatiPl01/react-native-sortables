import { useDebugContext } from '../../../../debug';
import type { SortableGridStrategy } from '../../../../types';
import { useCommonValuesContext, useOrderUpdater } from '../../../shared';
import { useGridLayoutContext } from '../GridLayoutProvider';
import strategies from './strategies';

type GridOrderUpdaterProps = {
  strategy: SortableGridStrategy;
};

export default function GridOrderUpdater({ strategy }: GridOrderUpdaterProps) {
  const factory =
    typeof strategy === 'string' ? strategies[strategy] : strategy;

  if (!factory) {
    throw new Error(
      `'${strategy}' is not a valid ordering strategy for Sortable.Grid`
    );
  }

  const commonValues = useCommonValuesContext();
  const gridLayout = useGridLayoutContext();
  const debug = useDebugContext();

  const updater = factory({
    ...commonValues,
    ...gridLayout,
    ...debug
  });

  useOrderUpdater(updater);

  return null;
}
