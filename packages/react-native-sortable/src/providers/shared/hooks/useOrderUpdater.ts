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
    centerPosition: Vector;
    strategy: ReorderStrategy;
  }) => Maybe<Array<string>>,
  deps?: Array<unknown>
) {
  const {
    activeItemKey,
    itemDimensions,
    keyToIndex,
    reorderStrategy,
    touchedItemPosition
  } = useCommonValuesContext();
  const { handleOrderChange } = useDragContext();

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      activePosition: touchedItemPosition.value,
      strategy: reorderStrategy.value
    }),
    ({ activeKey, activePosition, strategy }) => {
      if (activeKey === null || activePosition === null) {
        return;
      }
      const dimensions = itemDimensions.value[activeKey];
      if (!dimensions) {
        return;
      }

      const centerY = activePosition.y + dimensions.height / 2;
      const centerX = activePosition.x + dimensions.width / 2;
      const activeIndex = keyToIndex.value[activeKey];

      if (activeIndex === undefined) {
        return;
      }

      const centerPosition = {
        x: centerX,
        y: centerY
      };

      const newOrder = callback({
        activeIndex,
        activeKey,
        centerPosition,
        dimensions,
        position: activePosition,
        strategy
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
