import { useAnimatedReaction } from 'react-native-reanimated';

import type { OrderUpdater } from '../../../types';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { useDragContext } from '../DragProvider';

export default function useOrderUpdater(updater: OrderUpdater) {
  const { activeItemDimensions, activeItemKey, keyToIndex, touchPosition } =
    useCommonValuesContext();
  const { handleOrderChange } = useDragContext();

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      dimensions: activeItemDimensions.value,
      position: touchPosition.value
    }),
    ({ activeKey, dimensions, position }) => {
      if (!activeKey || !dimensions || !position) {
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
        position
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
