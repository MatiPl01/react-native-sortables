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
    position: Vector;
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
    touchPosition,
    touchedItemPosition
  } = useCommonValuesContext();
  const { handleOrderChange } = useDragContext();

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      positions: {
        item: touchedItemPosition.value,
        touch: touchPosition.value
      },
      strategy: reorderStrategy.value
    }),
    ({ activeKey, positions, strategy }) => {
      if (
        activeKey === null ||
        positions.item === null ||
        positions.touch === null
      ) {
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
        position: positions.item,
        strategy,
        touchPosition: positions.touch
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
