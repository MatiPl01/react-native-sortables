import { type PropsWithChildren, useCallback } from 'react';
import { type GestureTouchEvent } from 'react-native-gesture-handler';
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { TIME_TO_ACTIVATE_PAN } from '../../constants';
import { useHaptics, useJSStableCallback } from '../../hooks';
import type { ReorderStrategy, SortableCallbacks, Vector } from '../../types';
import { getOffsetDistance } from '../../utils';
import { createProvider } from '../utils';
import { useAutoScrollContext } from './AutoScrollProvider';
import { useCommonValuesContext } from './CommonValuesProvider';
import { LayerState, useLayerContext } from './LayerProvider';

type DragContextType = {
  handleTouchStart: (e: GestureTouchEvent, key: string) => void;
  handleDragStart: (key: string, reorderStrategy: ReorderStrategy) => void;
  handleDragUpdate: (translation: Vector, reverseXAxis?: boolean) => void;
  handleDragEnd: (key: string, reorderStrategy: ReorderStrategy) => void;
  handleOrderChange: (
    key: string,
    fromIndex: number,
    toIndex: number,
    newOrder: Array<string>,
    reorderStrategy: ReorderStrategy
  ) => void;
};

type DragProviderProps = PropsWithChildren<
  {
    enableHaptics: boolean;
  } & SortableCallbacks
>;

const { DragProvider, useDragContext } = createProvider('Drag')<
  DragProviderProps,
  DragContextType
>(({ enableHaptics, onDragEnd, onDragStart, onOrderChange }) => {
  const {
    activationProgress,
    activeItemDropped,
    activeItemKey,
    activeItemTranslation,
    enableActiveItemSnap,
    inactiveAnimationProgress,
    indexToKey,
    itemPositions,
    keyToIndex,
    relativeTouchPosition,
    snapOffsetX,
    snapOffsetY,
    touchStartPosition,
    touchedItemDimensions,
    touchedItemKey,
    touchedItemPosition
  } = useCommonValuesContext();
  const { updateLayer } = useLayerContext() ?? {};
  const { dragStartScrollOffset, scrollOffset } = useAutoScrollContext() ?? {};

  const haptics = useHaptics(enableHaptics);

  const dragStartIndex = useSharedValue<null | number>(null);
  const targetDeltaX = useSharedValue(0);
  const targetDeltaY = useSharedValue(0);
  const deltaX = useDerivedValue(
    () => targetDeltaX.value * activationProgress.value
  );
  const deltaY = useDerivedValue(
    () => targetDeltaY.value * activationProgress.value
  );

  // Create stable callbacks to avoid re-rendering when the callback
  // function is not memoized
  const stableOnDragStart = useJSStableCallback(onDragStart);
  const stableOnDragEnd = useJSStableCallback(onDragEnd);
  const stableOnOrderChange = useJSStableCallback(onOrderChange);

  /**
   * ACTIVE ITEM SNAP UPDATERS
   */

  useAnimatedReaction(
    () => ({
      enableSnap: enableActiveItemSnap.value,
      oX: snapOffsetX.value,
      oY: snapOffsetY.value,
      touchPosition: relativeTouchPosition.value,
      ...touchedItemDimensions.value
    }),
    ({ enableSnap, height, oX, oY, touchPosition, width }) => {
      if (!enableSnap || !height || !width || !touchPosition) {
        targetDeltaX.value = 0;
        targetDeltaY.value = 0;
        return;
      }

      targetDeltaX.value = getOffsetDistance(oX, width) - touchPosition.x;
      targetDeltaY.value = getOffsetDistance(oY, height) - touchPosition.y;
    }
  );

  useAnimatedReaction(
    () => ({
      dX: deltaX.value,
      dY: deltaY.value,
      enableSnap: enableActiveItemSnap.value,
      scrollOffsetY:
        dragStartScrollOffset?.value === null
          ? 0
          : (scrollOffset?.value ?? 0) - (dragStartScrollOffset?.value ?? 0),
      startPosition: touchStartPosition.value,
      translation: activeItemTranslation.value
    }),
    ({ dX, dY, enableSnap, scrollOffsetY, startPosition, translation }) => {
      if (!startPosition) {
        touchedItemPosition.value = null;
        return;
      }
      touchedItemPosition.value = {
        x: startPosition.x + (translation?.x ?? 0) - (enableSnap ? dX : 0),
        y:
          startPosition.y +
          (translation?.y ?? 0) -
          (enableSnap ? dY : 0) +
          scrollOffsetY
      };
    }
  );

  /**
   * DRAG HANDLERS
   */

  const handleTouchStart = useCallback(
    (e: GestureTouchEvent, key: string) => {
      'worklet';
      touchedItemKey.value = key;
      activationProgress.value = 0;
      updateLayer?.(LayerState.Focused);

      const itemPosition = itemPositions.value[key];
      if (itemPosition) {
        touchStartPosition.value = itemPosition;
        const touch = e.allTouches[0];
        relativeTouchPosition.value = touch
          ? {
              x: touch.x,
              y: touch.y
            }
          : null;
      }
    },
    [
      touchedItemKey,
      activationProgress,
      touchStartPosition,
      itemPositions,
      relativeTouchPosition,
      updateLayer
    ]
  );

  const handleDragStart = useCallback(
    (key: string, reorderStrategy: ReorderStrategy) => {
      'worklet';
      activeItemKey.value = key;
      activeItemDropped.value = false;
      dragStartIndex.value = keyToIndex.value[key]!;

      haptics.medium();
      stableOnDragStart({
        fromIndex: dragStartIndex.value,
        key,
        reorderStrategy
      });
    },
    [
      stableOnDragStart,
      activeItemDropped,
      activeItemKey,
      dragStartIndex,
      keyToIndex,
      haptics
    ]
  );

  const handleDragEnd = useCallback(
    (key: string, reorderStrategy: ReorderStrategy) => {
      'worklet';
      const delayed = (callback?: (finished: boolean | undefined) => void) =>
        withTiming(0, { duration: TIME_TO_ACTIVATE_PAN }, callback);

      touchedItemKey.value = null;
      touchStartPosition.value = null;
      relativeTouchPosition.value = null;
      activeItemTranslation.value = null;

      inactiveAnimationProgress.value = delayed();
      activationProgress.value = delayed(finished => {
        if (finished) {
          activeItemDropped.value = true;
          updateLayer?.(LayerState.Idle);
        }
      });

      if (activeItemKey.value !== null && dragStartIndex.value !== null) {
        activeItemKey.value = null;
        updateLayer?.(LayerState.Intermediate);
        haptics.medium();

        stableOnDragEnd({
          fromIndex: dragStartIndex.value,
          key,
          reorderStrategy,
          toIndex: keyToIndex.value[key]!
        });
        dragStartIndex.value = null;
      }
    },
    [
      touchedItemKey,
      touchStartPosition,
      relativeTouchPosition,
      activeItemTranslation,
      activeItemDropped,
      activeItemKey,
      activationProgress,
      inactiveAnimationProgress,
      dragStartIndex,
      keyToIndex,
      stableOnDragEnd,
      updateLayer,
      haptics
    ]
  );

  const handleDragUpdate = useCallback(
    (translation: Vector, reverseXAxis?: boolean) => {
      'worklet';
      activeItemTranslation.value = {
        x: (reverseXAxis ? -1 : 1) * translation.x,
        y: translation.y
      };
    },
    [activeItemTranslation]
  );

  const handleOrderChange = useCallback(
    (
      key: string,
      fromIndex: number,
      toIndex: number,
      newOrder: Array<string>,
      reorderStrategy: ReorderStrategy
    ) => {
      'worklet';
      indexToKey.value = newOrder;

      haptics.light();
      stableOnOrderChange({
        fromIndex,
        key,
        newOrder,
        reorderStrategy,
        toIndex
      });
    },
    [indexToKey, stableOnOrderChange, haptics]
  );

  return {
    value: {
      handleDragEnd,
      handleDragStart,
      handleDragUpdate,
      handleOrderChange,
      handleTouchStart
    }
  };
});

export { DragProvider, useDragContext };
