import { useAnimatedReaction } from 'react-native-reanimated';

import { useDebugContext } from '../../../debug';
import type { PredefinedStrategies, SortStrategyFactory } from '../../../types';
import { error } from '../../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { useDragContext } from '../DragProvider';

export default function useOrderUpdater<
  P extends PredefinedStrategies = PredefinedStrategies
>(
  strategy: keyof P | SortStrategyFactory,
  predefinedStrategies: P,
  reorderOnDrag: boolean
) {
  const useStrategy =
    typeof strategy === 'string' ? predefinedStrategies[strategy] : strategy;

  if (!useStrategy || typeof useStrategy !== 'function') {
    throw error(`'${String(useStrategy)}' is not a valid ordering strategy`);
  }

  const { activeItemDimensions, activeItemKey, keyToIndex } =
    useCommonValuesContext();
  const { handleOrderChange, pendingDropOrder, triggerOriginPosition } =
    useDragContext();
  const debugContext = useDebugContext();

  const debugCross = debugContext?.useDebugCross();

  const updater = useStrategy();

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      dimensions: activeItemDimensions.value,
      position: triggerOriginPosition.value
    }),
    ({ activeKey, dimensions, position }) => {
      if (!activeKey || !dimensions || !position) {
        if (debugCross) debugCross.set({ position: null });
        return;
      }

      const activeIndex = keyToIndex.value[activeKey];
      if (activeIndex === undefined) {
        return;
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

      if (!newOrder) {
        return;
      }

      if (reorderOnDrag) {
        handleOrderChange(
          activeKey,
          activeIndex,
          newOrder.indexOf(activeKey),
          newOrder
        );
      } else {
        // Keep computing the prospective order during the drag but don't apply
        // it yet. It's committed in handleDragEnd right before onDragEnd fires,
        // so the drag-end callbacks report the final order (see DragProvider).
        pendingDropOrder.value = newOrder;
      }
    }
  );
}
