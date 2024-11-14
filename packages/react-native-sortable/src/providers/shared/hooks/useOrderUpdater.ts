import { useAnimatedReaction } from 'react-native-reanimated';

import type {
  Dimensions,
  Maybe,
  ReorderStrategy,
  Vector
} from '../../../types';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { useDragContext } from '../DragProvider';

export default function useOrderUpdater(
  callback: (props: {
    activeKey: string;
    activeIndex: number;
    dimensions: Dimensions;
    touchPosition: Vector;
    strategy: ReorderStrategy;
  }) => Maybe<Array<string>>,
  deps?: Array<unknown>
) {
  const {
    activeItemKey,
    itemDimensions,
    keyToIndex,
    reorderStrategy,
    touchPosition
  } = useCommonValuesContext();
  const { handleOrderChange } = useDragContext();

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      strategy: reorderStrategy.value,
      touchPos: touchPosition.value
    }),
    ({ activeKey, strategy, touchPos }) => {
      if (activeKey === null || touchPos === null) {
        return;
      }
      const dimensions = itemDimensions.value[activeKey];
      if (!dimensions) {
        return;
      }

      const activeIndex = keyToIndex.value[activeKey];
      if (activeIndex === undefined) {
        return;
      }

      const newOrder = callback({
        activeIndex,
        activeKey,
        dimensions,
        strategy,
        touchPosition: touchPos
      });

      if (newOrder) {
        handleOrderChange(
          activeKey,
          activeIndex,
          newOrder.indexOf(activeKey),
          newOrder,
          strategy
        );
      }
    },
    deps
  );
}
