import { type PropsWithChildren, useCallback } from 'react';
import type {
  GestureTouchEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload
} from 'react-native-gesture-handler';
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { TIME_TO_ACTIVATE_PAN } from '../../constants';
import { useHaptics, useJSStableCallback } from '../../hooks';
import type { SortableCallbacks } from '../../types';
import { getOffsetDistance } from '../../utils';
import { createProvider } from '../utils';
import { useAutoScrollContext } from './AutoScrollProvider';
import { useCommonValuesContext } from './CommonValuesProvider';
import { LayerState, useLayerContext } from './LayerProvider';

type DragContextType = {
  handleTouchStart: (e: GestureTouchEvent, key: string) => void;
  handleDragStart: (key: string) => void;
  handleDragUpdate: (
    e: GestureUpdateEvent<PanGestureHandlerEventPayload>,
    reverseXAxis?: boolean
  ) => void;
  handleDragEnd: (key: string) => void;
  handleOrderChange: (
    key: string,
    fromIndex: number,
    toIndex: number,
    newOrder: Array<string>
  ) => void;
};

type DragProviderProps = PropsWithChildren<
  {
    hapticsEnabled: boolean;
  } & SortableCallbacks
>;

const { DragProvider, useDragContext } = createProvider('Drag')<
  DragProviderProps,
  DragContextType
>(({ hapticsEnabled, onDragEnd, onDragStart, onOrderChange }) => {
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
    touchedItemHeight,
    touchedItemKey,
    touchedItemPosition,
    touchedItemWidth
  } = useCommonValuesContext();
  const { updateLayer } = useLayerContext() ?? {};
  const { dragStartScrollOffset, scrollOffset } = useAutoScrollContext() ?? {};

  const haptics = useHaptics(hapticsEnabled);

  const dragStartIndex = useSharedValue(-1);
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
      height: touchedItemHeight.value,
      oX: snapOffsetX.value,
      oY: snapOffsetY.value,
      touchPosition: relativeTouchPosition.value,
      width: touchedItemWidth.value
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
        dragStartScrollOffset?.value === -1
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
    (key: string) => {
      'worklet';
      activeItemKey.value = key;
      activeItemDropped.value = false;
      dragStartIndex.value = keyToIndex.value[key]!;

      haptics.medium();
      stableOnDragStart({
        fromIndex: dragStartIndex.value,
        key
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
    (key: string) => {
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

      if (activeItemKey.value !== null) {
        activeItemKey.value = null;
        updateLayer?.(LayerState.Intermediate);
        haptics.medium();

        stableOnDragEnd({
          fromIndex: dragStartIndex.value,
          key,
          toIndex: keyToIndex.value[key]!
        });
        dragStartIndex.value = -1;
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
    (
      e: GestureUpdateEvent<PanGestureHandlerEventPayload>,
      reverseXAxis?: boolean
    ) => {
      'worklet';
      activeItemTranslation.value = {
        x: (reverseXAxis ? -1 : 1) * e.translationX,
        y: e.translationY
      };
    },
    [activeItemTranslation]
  );

  const handleOrderChange = useCallback(
    (
      key: string,
      fromIndex: number,
      toIndex: number,
      newOrder: Array<string>
    ) => {
      'worklet';
      indexToKey.value = newOrder;

      haptics.light();
      stableOnOrderChange({
        fromIndex,
        key,
        newOrder,
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
