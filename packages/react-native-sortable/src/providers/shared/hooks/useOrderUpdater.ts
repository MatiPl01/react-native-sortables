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
    relativeTouchOffset,
    reorderStrategy,
    touchedItemPosition
  } = useCommonValuesContext();
  const { handleOrderChange } = useDragContext();

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      activePosition: touchedItemPosition.value,
      strategy: reorderStrategy.value,
      touchOffset: relativeTouchOffset.value
    }),
    ({ activeKey, activePosition, strategy, touchOffset }) => {
      if (
        activeKey === null ||
        activePosition === null ||
        touchOffset === null
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

      const touchPosition = {
        x: activePosition.x + touchOffset.x,
        y: activePosition.y + touchOffset.y
      };

      const newOrder = callback({
        activeIndex,
        activeKey,
        dimensions,
        position: activePosition,
        strategy,
        touchPosition
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
