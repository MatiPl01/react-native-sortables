import { useAnimatedReaction } from 'react-native-reanimated';

import { useDebugContext } from '../../../debug';
import type { OrderUpdater } from '../../../types';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { useDragContext } from '../DragProvider';

export default function useOrderUpdater(updater: OrderUpdater) {
  const {
    activeItemDimensions,
    activeItemKey,
    activeItemPosition,
    activeItemTriggerOriginPosition,
    keyToIndex
  } = useCommonValuesContext();
  const { handleOrderChange } = useDragContext();
  const debugContext = useDebugContext();

  const debugCross = debugContext?.useDebugCross();

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      dimensions: activeItemDimensions.value,
      positions: {
        activeItem: activeItemPosition.value,
        triggerOrigin: activeItemTriggerOriginPosition.value
      }
    }),
    ({ activeKey, dimensions, positions }) => {
      if (
        !activeKey ||
        !dimensions ||
        !positions.triggerOrigin ||
        !positions.activeItem
      ) {
        if (debugCross) debugCross.set({ position: null });
        return;
      }

      const activeIndex = keyToIndex.value[activeKey];
      if (activeIndex === undefined) {
        return;
      }

      const position = positions.triggerOrigin;
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

      if (debugCross) {
        debugCross.set({ color: '#00007e', position });
      }
    }
  );
}
