import { useCallback } from 'react';
import { useAnimatedReaction } from 'react-native-reanimated';

import { useDebugContext } from '../../../debug';
import type {
  OrderUpdaterCallbackProps,
  PredefinedStrategies,
  SortStrategyFactory
} from '../../../types';
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
  const { handleOrderChange, triggerOriginPosition } = useDragContext();
  const debugContext = useDebugContext();

  const debugCross = debugContext?.useDebugCross();

  const updater = useStrategy();

  const handleOrderUpdate = useCallback(
    ({
      activeKey,
      dimensions,
      position
    }: Omit<OrderUpdaterCallbackProps, 'activeIndex'>) => {
      'worklet';
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
    },
    [handleOrderChange, keyToIndex, updater]
  );

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      dimensions: activeItemDimensions.value,
      position: triggerOriginPosition.value
    }),
    ({ activeKey, dimensions, position }, prevProps) => {
      debugCross?.set({ color: '#00007e', position });

      if (reorderOnDrag) {
        if (activeKey !== null && dimensions && position) {
          handleOrderUpdate({ activeKey, dimensions, position });
        } else {
          debugCross?.set({ position: null });
        }
      } else if (
        activeKey === null &&
        prevProps?.dimensions &&
        prevProps?.position &&
        prevProps?.activeKey !== null
      ) {
        debugCross?.set({ position: null });
        handleOrderUpdate({
          activeKey: prevProps.activeKey,
          dimensions: prevProps.dimensions,
          position: prevProps.position
        });
      }
    }
  );
}
