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
      }
    }),
    ({ activeKey, dimensions, positions }) => {
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
