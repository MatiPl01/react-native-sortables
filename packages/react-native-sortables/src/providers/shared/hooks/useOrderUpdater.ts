import { useAnimatedReaction } from 'react-native-reanimated';

import { useDebugContext } from '../../../debug';
import type {
  OrderUpdater,
  ReorderTriggerOrigin,
  Vector
} from '../../../types';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { useDragContext } from '../DragProvider';

export default function useOrderUpdater(
  updater: OrderUpdater,
  triggerOrigin: ReorderTriggerOrigin
) {
  const {
    activeItemDimensions,
    activeItemKey,
    activeItemPosition,
    keyToIndex,
    sortableKeys,
    touchPosition
  } = useCommonValuesContext();
  const { handleOrderChange } = useDragContext();
  const debugContext = useDebugContext();

  const debugCross = debugContext?.useDebugCross();

  const isCenter = triggerOrigin === 'center';

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      dimensions: activeItemDimensions.value,
      positions: {
        activeItem: activeItemPosition.value,
        touch: touchPosition.value
      },
      sortableKeys
    }),
    ({ activeKey, dimensions, positions, sortableKeys }) => {
      if (
        !activeKey ||
        !dimensions ||
        !positions.touch ||
        !positions.activeItem
      ) {
        if (debugCross) debugCross.set({ position: null });
        return;
      }

      const activeIndex = keyToIndex.value[activeKey];
      if (activeIndex === undefined) {
        return;
      }

      let position: Vector;
      if (isCenter) {
        position = {
          x: positions.activeItem.x + dimensions.width / 2,
          y: positions.activeItem.y + dimensions.height / 2
        };
      } else {
        position = positions.touch;
      }

      if (debugCross) {
        debugCross.set({ color: '#00007e', position });
      }

      // Don't allow updating order if the active item is not sortable.
      if (!sortableKeys.includes(activeKey)) {
        return;
      }

      const oldOrder = Object.keys(keyToIndex.value);
      const newOrder = updater({
        activeIndex,
        activeKey,
        dimensions,
        position
      });

      const updateOrderWithNonSortables = (
        newOrder: string[],
        oldOrder: string[],
        sortableKeys: string[]
      ) => {
        const newOrderWithoutNonSortables = newOrder.filter(key =>
          sortableKeys.includes(key)
        );
        // insert non sortables to their respective positions.
        const nonSortables = oldOrder.filter(
          key => !sortableKeys.includes(key)
        );
        nonSortables.forEach(key => {
          newOrderWithoutNonSortables.splice(+key, 0, key);
        });
        return newOrderWithoutNonSortables;
      };

      if (newOrder) {
        const newOrderSorted = updateOrderWithNonSortables(
          newOrder,
          oldOrder,
          sortableKeys
        );

        handleOrderChange(
          activeKey,
          activeIndex,
          newOrderSorted.indexOf(activeKey),
          newOrderSorted
        );
      }
    }
  );
}
