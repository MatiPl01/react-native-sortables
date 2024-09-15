import { type PropsWithChildren, useCallback } from 'react';
import type {
  GestureTouchEvent,
  TouchData
} from 'react-native-gesture-handler';
import { State } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import {
  useAnimatedReaction,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import {
  ACTIVATE_PAN_ANIMATION_DELAY,
  ACTIVATION_FAIL_OFFSET,
  TIME_TO_ACTIVATE_PAN
} from '../../constants';
import { useDebugContext } from '../../debug';
import { useHaptics, useJSStableCallback } from '../../hooks';
import type { ReorderStrategy, SortableCallbacks, Vector } from '../../types';
import { DragActivationState } from '../../types';
import {
  clearAnimatedTimeout,
  getOffsetDistance,
  setAnimatedTimeout
} from '../../utils';
import { createProvider } from '../utils';
import { useAutoScrollContext } from './AutoScrollProvider';
import { useCommonValuesContext } from './CommonValuesProvider';
import { LayerState, useLayerContext } from './LayerProvider';
import { useMeasurementsContext } from './MeasurementsProvider';

type DragContextType = {
  handleTouchStart: (
    e: GestureTouchEvent,
    key: string,
    reorderStrategy: ReorderStrategy,
    pressProgress: SharedValue<number>,
    onActivate: () => void
  ) => void;
  handleTouchesMove: (
    e: GestureTouchEvent,
    reverseXAxis: boolean,
    onFail: () => void
  ) => void;
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
    hapticsEnabled: boolean;
  } & SortableCallbacks
>;

const { DragProvider, useDragContext } = createProvider('Drag')<
  DragProviderProps,
  DragContextType
>(({ hapticsEnabled, onDragEnd, onDragStart, onOrderChange }) => {
  const {
    activationProgress,
    activationState,
    activeItemDropped,
    activeItemKey,
    containerHeight,
    enableActiveItemSnap,
    inactiveAnimationProgress,
    indexToKey,
    itemPositions,
    keyToIndex,
    snapOffsetX,
    snapOffsetY,
    touchPosition,
    touchedItemHeight,
    touchedItemKey,
    touchedItemPosition,
    touchedItemWidth
  } = useCommonValuesContext();
  const { tryMeasureContainerHeight, updateTouchedItemDimensions } =
    useMeasurementsContext();
  const { updateLayer } = useLayerContext() ?? {};
  const { dragStartScrollOffset, scrollOffset, updateStartScrollOffset } =
    useAutoScrollContext() ?? {};
  const debugContext = useDebugContext();

  const debugCross = debugContext?.useDebugCross();

  const haptics = useHaptics(hapticsEnabled);

  const startTouch = useSharedValue<TouchData | null>(null);
  const touchStartItemPosition = useSharedValue<Vector | null>(null);
  const touchTranslation = useSharedValue<Vector | null>(null);
  const dragStartTouchTranslation = useSharedValue<Vector | null>(null);

  const dragStartIndex = useSharedValue(-1);
  const activationTimeoutId = useSharedValue(-1);
  const snapTranslation = useSharedValue<Vector | null>(null);

  // Create stable callbacks to avoid re-rendering when the callback
  // function is not memoized
  const stableOnDragStart = useJSStableCallback(onDragStart);
  const stableOnDragEnd = useJSStableCallback(onDragEnd);
  const stableOnOrderChange = useJSStableCallback(onOrderChange);

  // ACTIVE ITEM SNAP UPDATER
  useAnimatedReaction(
    () => ({
      enableSnap: enableActiveItemSnap.value,
      height: touchedItemHeight.value,
      oX: snapOffsetX.value,
      oY: snapOffsetY.value,
      progress: activationProgress.value,
      touch: startTouch.value && {
        x: startTouch.value.x,
        y: startTouch.value.y
      },
      width: touchedItemWidth.value
    }),
    ({ enableSnap, height, oX, oY, progress, touch, width }) => {
      if (!enableSnap || !height || !width || !touch) {
        snapTranslation.value = null;
        return;
      }

      const translation = touchTranslation.value;
      const targetDeltaX =
        touch.x - getOffsetDistance(oX, width) + (translation?.x ?? 0);
      const targetDeltaY =
        touch.y - getOffsetDistance(oY, height) + (translation?.y ?? 0);

      snapTranslation.value = {
        x: progress * targetDeltaX,
        y: progress * targetDeltaY
      };
    }
  );

  // ACTIVE ITEM POSITION UPDATER
  useAnimatedReaction(
    () => ({
      dragStartTranslation: dragStartTouchTranslation.value,
      itemStartPosition: touchStartItemPosition.value,
      scrollOffsetY:
        dragStartScrollOffset?.value === -1
          ? 0
          : (scrollOffset?.value ?? 0) - (dragStartScrollOffset?.value ?? 0),
      snap: snapTranslation.value,
      translation: touchTranslation.value
    }),
    ({
      dragStartTranslation,
      itemStartPosition,
      scrollOffsetY,
      snap,
      translation
    }) => {
      if (!itemStartPosition) {
        touchedItemPosition.value = null;
        return;
      }

      touchedItemPosition.value = {
        x:
          itemStartPosition.x +
          (translation?.x ?? 0) +
          (snap?.x ?? 0) -
          (dragStartTranslation?.x ?? 0),
        y:
          itemStartPosition.y +
          (translation?.y ?? 0) +
          (snap?.y ?? 0) -
          (dragStartTranslation?.y ?? 0) +
          scrollOffsetY
      };
    }
  );

  // TOUCH POSITION UPDATER
  useAnimatedReaction(
    () => ({
      itemPosition: touchedItemPosition.value,
      snap: snapTranslation.value,
      touch: startTouch.value
        ? { x: startTouch.value.x, y: startTouch.value.y }
        : null
    }),
    ({ itemPosition, snap, touch }) => {
      if (!itemPosition || !touch) {
        touchPosition.value = null;
        debugCross?.set({ position: null });
        return;
      }

      touchPosition.value = {
        x: itemPosition.x + touch.x - (snap?.x ?? 0),
        y: itemPosition.y + touch.y - (snap?.y ?? 0)
      };
      debugCross?.set({ color: '#00007e', position: touchPosition.value });
    }
  );

  /**
   * DRAG HANDLERS
   */

  const handleDragStart = useCallback(
    (key: string, reorderStrategy: ReorderStrategy) => {
      'worklet';
      updateStartScrollOffset?.();
      activeItemKey.value = key;
      activeItemDropped.value = false;
      dragStartIndex.value = keyToIndex.value[key]!;
      dragStartTouchTranslation.value = touchTranslation.value;
      activationState.value = DragActivationState.ACTIVE;

      haptics.medium();
      stableOnDragStart({
        fromIndex: dragStartIndex.value,
        key,
        reorderStrategy
      });
    },
    [
      dragStartTouchTranslation,
      touchTranslation,
      updateStartScrollOffset,
      stableOnDragStart,
      activationState,
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

      clearAnimatedTimeout(activationTimeoutId.value);
      touchedItemKey.value = null;
      startTouch.value = null;
      touchTranslation.value = null;
      touchStartItemPosition.value = null;
      dragStartTouchTranslation.value = null;
      activationState.value = DragActivationState.INACTIVE;

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
          reorderStrategy,
          toIndex: keyToIndex.value[key]!
        });
        dragStartIndex.value = -1;
      }
    },
    [
      touchedItemKey,
      dragStartTouchTranslation,
      touchStartItemPosition,
      startTouch,
      touchTranslation,
      activationTimeoutId,
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
      startTouch.value = firstTouch;

      // This should never happen, but just in case the container height
      // was not measured within the specified interval and onLayout
      // was not called, we will try to measure it again after the item
      // is touched
      if (containerHeight.value === -1) {
        tryMeasureContainerHeight();
      }

      clearAnimatedTimeout(activationTimeoutId.value);
      // Start handling touch after a delay to prevent accidental activation
      // e.g. while scrolling the ScrollView
      activationTimeoutId.value = setAnimatedTimeout(() => {
        updateTouchedItemDimensions(key);
        updateLayer?.(LayerState.Focused);

        const animate = (callback?: (finished?: boolean) => void) =>
          withTiming(
            1,
            {
              duration: TIME_TO_ACTIVATE_PAN - ACTIVATE_PAN_ANIMATION_DELAY
            },
            callback
          );

        touchStartItemPosition.value = itemPositions.value[key] ?? null;
        activationState.value = DragActivationState.ACTIVATING;
        inactiveAnimationProgress.value = animate();
        activationProgress.value = animate();
        pressProgress.value = animate(finished => {
          if (
            finished &&
            e.state !== State.CANCELLED &&
            e.state !== State.END
          ) {
            if (touchedItemKey.value === key && itemPositions.value[key]) {
              onActivate();
              handleDragStart(key, reorderStrategy);
            } else {
              handleDragEnd(key, reorderStrategy);
            }
          }
        });
      }, ACTIVATE_PAN_ANIMATION_DELAY);
    },
    [
      startTouch,
      touchedItemKey,
      itemPositions,
      containerHeight,
      activationTimeoutId,
      touchStartItemPosition,
      activationState,
      activationProgress,
      inactiveAnimationProgress,
      updateLayer,
      handleDragStart,
      handleDragEnd,
      tryMeasureContainerHeight,
      updateTouchedItemDimensions
    ]
  );

  const handleTouchesMove = useCallback(
    (e: GestureTouchEvent, reverseXAxis: boolean, onFail: () => void) => {
      'worklet';
      const firstTouch = e.allTouches[0];
      if (!firstTouch || !startTouch.value || touchedItemKey.value === null) {
        onFail();
        return;
      }

      const dX = firstTouch.absoluteX - startTouch.value.absoluteX;
      const dY = firstTouch.absoluteY - startTouch.value.absoluteY;

      // Cancel touch if the touch moved too far from the initial position
      // before the item was activated
      const r = Math.sqrt(dX * dX + dY * dY);
      if (activeItemKey.value === null && r >= ACTIVATION_FAIL_OFFSET) {
        onFail();
        return;
      }

      touchTranslation.value = {
        x: reverseXAxis ? -dX : dX,
        y: dY
      };
    },
    [startTouch, touchTranslation, touchedItemKey, activeItemKey]
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
      handleOrderChange,
      handleTouchStart,
      handleTouchesMove
    }
  };
});

export { DragProvider, useDragContext };
