import { useAnimatedReaction } from 'react-native-reanimated';

import type { OrderUpdater } from '../../../types';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { useDragContext } from '../DragProvider';

export default function useOrderUpdater(updater: OrderUpdater) {
  const {
    activeItemKey,
    itemDimensions,
    keyToIndex,
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
      }
    }),
    ({ activeKey, positions }) => {
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

      const newOrder = updater({
        activeIndex,
        activeKey,
        dimensions,
        position: positions.item,
        touchPosition: positions.touch
      });

      if (newOrder) {
        handleOrderChange(
          activeKey,
          activeIndex,
          newOrder.indexOf(activeKey),
          newOrder
        );
      }
    }
  );
}
