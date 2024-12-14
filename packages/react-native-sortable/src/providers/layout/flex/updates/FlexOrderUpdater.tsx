import { useDebugContext } from '../../../../debug';
import type { SortableFlexStrategy } from '../../../../types';
import { useCommonValuesContext, useOrderUpdater } from '../../../shared';
import { useFlexLayoutContext } from '../FlexLayoutProvider';
import strategies from './strategies';

type FlexOrderUpdaterProps = {
  strategy: SortableFlexStrategy;
};

export default function FlexOrderUpdater({ strategy }: FlexOrderUpdaterProps) {
  const factory =
    typeof strategy === 'string' ? strategies[strategy] : strategy;

  const commonValues = useCommonValuesContext();
  const flexLayout = useFlexLayoutContext();
  const debug = useDebugContext();

  const updater = factory({
    ...commonValues,
    ...flexLayout,
    ...debug
  });

  useOrderUpdater(updater);

  return null;
}
