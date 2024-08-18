import { type PropsWithChildren, useCallback } from 'react';
import { type GestureTouchEvent, State } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import {
  ACTIVATE_PAN_ANIMATION_DELAY,
  TIME_TO_ACTIVATE_PAN
} from '../../constants';
import { useHaptics, useJSStableCallback } from '../../hooks';
import {
  DragActivationState,
  type ReorderStrategy,
  type SortableCallbacks
} from '../../types';
import {
  clearAnimatedTimeout,
  getOffsetDistance,
  setAnimatedTimeout
} from '../../utils';
import { createProvider } from '../utils';
import { useAutoScrollContext } from './AutoScrollProvider';
import { useCommonValuesContext } from './CommonValuesProvider';
import { LayerState, useLayerContext } from './LayerProvider';

type DragContextType = {
  handleTouchStart: (
    e: GestureTouchEvent,
    key: string,
    reorderStrategy: ReorderStrategy,
    pressProgress: SharedValue<number>,
    onActivate: () => void
  ) => void;
  handleDragUpdate: (e: GestureTouchEvent, reverseXAxis: boolean) => void;
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
    activationState,
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
  const { dragStartScrollOffset, scrollOffset, updateStartScrollOffset } =
    useAutoScrollContext() ?? {};

  const haptics = useHaptics(enableHaptics);

  const dragStartIndex = useSharedValue<null | number>(null);
  const activationTimeoutId = useSharedValue<null | number>(null);
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
  const absoluteTouchStartPosition = useSharedValue({ x: 0, y: 0 });

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

  const handleDragStart = useCallback(
    (key: string, reorderStrategy: ReorderStrategy) => {
      'worklet';
      activeItemKey.value = key;
      activeItemDropped.value = false;
      dragStartIndex.value = keyToIndex.value[key]!;
      activationState.value = DragActivationState.ACTIVE;

      haptics.medium();
      stableOnDragStart({
        fromIndex: dragStartIndex.value,
        key,
        reorderStrategy
      });
    },
    [
      stableOnDragStart,
      activationState,
      activeItemDropped,
      activeItemKey,
      dragStartIndex,
      keyToIndex,
      haptics
    ]
  );

  const handleTouchStart = useCallback(
    (
      e: GestureTouchEvent,
      key: string,
      reorderStrategy: ReorderStrategy,
      pressProgress: SharedValue<number>,
      onActivate: () => void
    ) => {
      'worklet';
      const firstTouch = e.allTouches[0];
      if (!firstTouch) {
        return;
      }

      touchedItemKey.value = key;
      activationProgress.value = 0;
      activationState.value = DragActivationState.TOUCHED;
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

      const animate = (callback?: (finished?: boolean) => void) =>
        withTiming(
          1,
          {
            duration: TIME_TO_ACTIVATE_PAN - ACTIVATE_PAN_ANIMATION_DELAY
          },
          callback
        );

      clearAnimatedTimeout(activationTimeoutId.value);
      activationTimeoutId.value = setAnimatedTimeout(() => {
        inactiveAnimationProgress.value = animate();
        activationProgress.value = animate();
        pressProgress.value = animate(finished => {
          if (
            finished &&
            e.state !== State.CANCELLED &&
            e.state !== State.END &&
            touchedItemKey.value === key
          ) {
            absoluteTouchStartPosition.value = {
              x: firstTouch.absoluteX,
              y: firstTouch.absoluteY
            };
            onActivate();
            updateStartScrollOffset?.();
            handleDragStart(key, reorderStrategy);
          }
        });
        activationState.value = DragActivationState.ACTIVATING;
      }, ACTIVATE_PAN_ANIMATION_DELAY);
    },
    [
      touchedItemKey,
      activationTimeoutId,
      activationState,
      activationProgress,
      inactiveAnimationProgress,
      touchStartPosition,
      absoluteTouchStartPosition,
      itemPositions,
      relativeTouchPosition,
      updateLayer,
      updateStartScrollOffset,
      handleDragStart
    ]
  );

  const handleDragEnd = useCallback(
    (key: string, reorderStrategy: ReorderStrategy) => {
      'worklet';
      const delayed = (callback?: (finished: boolean | undefined) => void) =>
        withTiming(0, { duration: TIME_TO_ACTIVATE_PAN }, callback);

      clearAnimatedTimeout(activationTimeoutId.value);
      touchedItemKey.value = null;
      touchStartPosition.value = null;
      relativeTouchPosition.value = null;
      activeItemTranslation.value = null;
      activationState.value = DragActivationState.INACTIVE;

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
      activationTimeoutId,
      activeItemTranslation,
      activeItemDropped,
      activeItemKey,
      activationProgress,
      activationState,
      inactiveAnimationProgress,
      dragStartIndex,
      keyToIndex,
      stableOnDragEnd,
      updateLayer,
      haptics
    ]
  );

  const handleDragUpdate = useCallback(
    (e: GestureTouchEvent, reverseXAxis: boolean) => {
      'worklet';
      const firstTouch = e.allTouches[0];
      const startPosition = absoluteTouchStartPosition.value;
      if (!firstTouch || !startPosition) {
        return;
      }

      const dX = firstTouch.absoluteX - startPosition.x;
      const dY = firstTouch.absoluteY - startPosition.y;

      // Change the touch start position if the finger was moved
      // slightly to prevent content jumping to the new translation
      // after the pressed item becomes active
      if (
        e.state !== State.ACTIVE &&
        e.state !== State.BEGAN &&
        touchStartPosition.value
      ) {
        absoluteTouchStartPosition.value = {
          x: firstTouch.absoluteX,
          y: firstTouch.absoluteY
        };
        touchStartPosition.value = {
          x: touchStartPosition.value.x + dX,
          y: touchStartPosition.value.y + dY
        };
      }

      activeItemTranslation.value = {
        x: (reverseXAxis ? -1 : 1) * dX,
        y: dY
      };
    },
    [activeItemTranslation, absoluteTouchStartPosition, touchStartPosition]
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
      handleDragUpdate,
      handleOrderChange,
      handleTouchStart
    }
  };
});

export { DragProvider, useDragContext };
