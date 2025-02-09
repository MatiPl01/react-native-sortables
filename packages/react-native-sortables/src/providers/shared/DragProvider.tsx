import { type PropsWithChildren, useCallback } from 'react';
import type {
  GestureTouchEvent,
  TouchData
} from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import {
  interpolate,
  measure,
  useAnimatedReaction,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { useDebugContext } from '../../debug';
import { useHaptics, useJSStableCallback } from '../../hooks';
import type { DragContextType, SortableCallbacks, Vector } from '../../types';
import { DragActivationState, LayerState } from '../../types';
import {
  clearAnimatedTimeout,
  getOffsetDistance,
  setAnimatedTimeout
} from '../../utils';
import { createProvider } from '../utils';
import { useAutoScrollContext } from './AutoScrollProvider';
import { useCommonValuesContext } from './CommonValuesProvider';
import { useLayerContext } from './LayerProvider';
import { useMeasurementsContext } from './MeasurementsProvider';

type DragProviderProps = PropsWithChildren<
  {
    hapticsEnabled: boolean;
  } & Required<SortableCallbacks>
>;

const { DragProvider, useDragContext } = createProvider('Drag')<
  DragProviderProps,
  DragContextType
>(({ hapticsEnabled, onDragEnd, onDragStart, onOrderChange }) => {
  const {
    activationState,
    activeAnimationDuration,
    activeAnimationProgress,
    activeItemDropped,
    activeItemKey,
    activeItemPosition,
    canSwitchToAbsoluteLayout,
    containerRef,
    dragActivationDelay,
    dragActivationFailOffset,
    dropAnimationDuration,
    enableActiveItemSnap,
    inactiveAnimationProgress,
    inactiveItemOpacity,
    inactiveItemScale,
    indexToKey,
    itemPositions,
    keyToIndex,
    prevActiveItemKey,
    snapItemDimensions,
    snapItemOffset,
    snapOffsetX,
    snapOffsetY,
    touchPosition
  } = useCommonValuesContext();
  const { maybeUpdateSnapDimensions, tryMeasureContainerHeight } =
    useMeasurementsContext();
  const { updateLayer } = useLayerContext() ?? {};
  const { scrollOffset, updateStartScrollOffset } =
    useAutoScrollContext() ?? {};
  const debugContext = useDebugContext();

  const debugCross = debugContext?.useDebugCross();
  const haptics = useHaptics(hapticsEnabled);

  const firstTouch = useSharedValue<TouchData | null>(null);
  const currentTouch = useSharedValue<TouchData | null>(null);
  const dragStartItemTouchOffset = useSharedValue<Vector | null>(null);
  const dragStartIndex = useSharedValue(-1);

  // used for activation and deactivation (drop)
  const activationTimeoutId = useSharedValue(-1);

  // Create stable callbacks to avoid re-rendering when the callback
  // function is not memoized
  const stableOnDragStart = useJSStableCallback(onDragStart);
  const stableOnDragEnd = useJSStableCallback(onDragEnd);
  const stableOnOrderChange = useJSStableCallback(onOrderChange);

  const getTouchPosition = useCallback(
    (touch: TouchData) => {
      'worklet';
      const containerMeasurements = measure(containerRef);
      if (!containerMeasurements) {
        return null;
      }

      return {
        x: touch.absoluteX - containerMeasurements.pageX,
        y: touch.absoluteY - containerMeasurements.pageY
      };
    },
    [containerRef]
  );

  // ACTIVE ITEM POSITION UPDATER
  useAnimatedReaction(
    () => ({
      dimensions: snapItemDimensions.value,
      enableSnap: enableActiveItemSnap.value,
      itemTouchOffset: dragStartItemTouchOffset.value,
      oX: snapOffsetX.value,
      oY: snapOffsetY.value,
      offset: scrollOffset?.value,
      progress: activeAnimationProgress.value,
      snapOffset: snapItemOffset.value,
      touch: currentTouch.value
    }),
    ({
      dimensions,
      enableSnap,
      itemTouchOffset,
      oX,
      oY,
      progress,
      snapOffset,
      touch
    }) => {
      if (!dimensions || !touch || !itemTouchOffset) {
        return;
      }

      touchPosition.value = getTouchPosition(touch);
      if (!touchPosition.value) {
        debugCross?.set({ position: null });
        return;
      }

      if (debugCross) {
        debugCross.set({
          color: '#00007e',
          position: touchPosition.value
        });
      }

      const translate = (from: number, to: number) =>
        from === to ? from : interpolate(progress, [0, 1], [from, to]);

      let tX = itemTouchOffset.x;
      let tY = itemTouchOffset.y;

      if (enableSnap) {
        tX = (snapOffset?.x ?? 0) + getOffsetDistance(oX, dimensions.width);
        tY = (snapOffset?.y ?? 0) + getOffsetDistance(oY, dimensions.height);
      }

      activeItemPosition.value = {
        x: touchPosition.value.x - translate(itemTouchOffset.x, tX),
        y: touchPosition.value.y - translate(itemTouchOffset.y, tY)
      };
    }
  );

  /**
   * DRAG HANDLERS
   */

  const handleDragStart = useCallback(
    (key: string, pressProgress: SharedValue<number>) => {
      'worklet';
      activeAnimationProgress.value = 0;
      activeItemDropped.value = false;
      prevActiveItemKey.value = activeItemKey.value;
      activeItemKey.value = key;
      dragStartIndex.value = keyToIndex.value[key] ?? -1;
      activeItemPosition.value = itemPositions.value[key] ?? null;
      activationState.value = DragActivationState.ACTIVE;

      updateLayer?.(LayerState.Focused);
      maybeUpdateSnapDimensions(key);
      updateStartScrollOffset?.();

      const itemPosition = itemPositions.value[key];
      if (currentTouch.value) {
        touchPosition.value = getTouchPosition(currentTouch.value);
      }
      if (itemPosition && touchPosition.value) {
        dragStartItemTouchOffset.value = {
          x: touchPosition.value.x - itemPosition.x,
          y: touchPosition.value.y - itemPosition.y
        };
      }

      const hasInactiveAnimation =
        inactiveItemOpacity.value !== 1 || inactiveItemScale.value !== 1;

      const animate = () =>
        withTiming(1, { duration: activeAnimationDuration.value });

      inactiveAnimationProgress.value = hasInactiveAnimation ? animate() : 0;
      activeAnimationProgress.value = animate();
      pressProgress.value = animate();

      haptics.medium();
      stableOnDragStart({
        fromIndex: dragStartIndex.value,
        key
      });
    },
    [
      activeAnimationDuration,
      activeAnimationProgress,
      activeItemDropped,
      activationState,
      activeItemKey,
      activeItemPosition,
      currentTouch,
      dragStartIndex,
      dragStartItemTouchOffset,
      getTouchPosition,
      haptics,
      inactiveAnimationProgress,
      inactiveItemOpacity,
      inactiveItemScale,
      itemPositions,
      keyToIndex,
      maybeUpdateSnapDimensions,
      prevActiveItemKey,
      stableOnDragStart,
      touchPosition,
      updateLayer,
      updateStartScrollOffset
    ]
  );

  const handleTouchStart = useCallback(
    (
      e: GestureTouchEvent,
      key: string,
      pressProgress: SharedValue<number>,
      activate: () => void,
      fail: () => void
    ) => {
      'worklet';
      const touch = e.allTouches[0];
      if (!touch) {
        fail();
        return;
      }

      firstTouch.value = currentTouch.value = touch;

      if (!canSwitchToAbsoluteLayout.value) {
        tryMeasureContainerHeight?.();
      }

      activationState.value = DragActivationState.TOUCHED;
      clearAnimatedTimeout(activationTimeoutId.value);

      // Start handling touch after a delay to prevent accidental activation
      // e.g. while scrolling the ScrollView
      activationTimeoutId.value = setAnimatedTimeout(() => {
        activate();
        handleDragStart(key, pressProgress);
      }, dragActivationDelay.value);
    },
    [
      activationState,
      activationTimeoutId,
      canSwitchToAbsoluteLayout,
      currentTouch,
      dragActivationDelay,
      firstTouch,
      handleDragStart,
      tryMeasureContainerHeight
    ]
  );

  const handleTouchesMove = useCallback(
    (e: GestureTouchEvent, fail: () => void) => {
      'worklet';
      const touch = e.allTouches[0];
      if (!touch || !firstTouch.value) {
        fail();
        return;
      }

      if (activationState.value === DragActivationState.TOUCHED) {
        const dX = touch.x - firstTouch.value.x;
        const dY = touch.y - firstTouch.value.y;

        // Cancel touch if the touch moved too far from the initial position
        // before the item activation animation starts
        const r = Math.sqrt(dX * dX + dY * dY);
        if (
          // activeItemKey is set after the drag activation delay passes
          // and we don't want to cancel the touch anymore after this time
          activeItemKey.value === null &&
          r >= dragActivationFailOffset.value
        ) {
          fail();
          return;
        }
        currentTouch.value = touch;
      } else if (activationState.value === DragActivationState.ACTIVE) {
        currentTouch.value = touch;
      }
    },
    [
      activationState,
      activeItemKey,
      dragActivationFailOffset,
      firstTouch,
      currentTouch
    ]
  );

  const handleDragEnd = useCallback(
    (key: string, pressProgress: SharedValue<number>) => {
      'worklet';
      prevActiveItemKey.value = activeItemKey.value;
      activeItemPosition.value = null;
      firstTouch.value = null;
      currentTouch.value = null;
      touchPosition.value = null;
      dragStartIndex.value = -1;
      dragStartItemTouchOffset.value = null;
      activationState.value = DragActivationState.INACTIVE;

      if (activeItemKey.value !== null) {
        activeItemKey.value = null;
        updateLayer?.(LayerState.Intermediate);
        debugCross?.set({ position: null });
        haptics.medium();

        stableOnDragEnd({
          fromIndex: dragStartIndex.value,
          indexToKey: indexToKey.value,
          key,
          keyToIndex: keyToIndex.value,
          toIndex: keyToIndex.value[key]!
        });
      }

      const animate = (callback?: (finished: boolean | undefined) => void) =>
        withTiming(0, { duration: dropAnimationDuration.value }, callback);

      pressProgress.value = animate();
      inactiveAnimationProgress.value = animate();

      clearAnimatedTimeout(activationTimeoutId.value);
      activationTimeoutId.value = setAnimatedTimeout(() => {
        activeAnimationProgress.value = 0;
        if (activeItemKey.value === null) {
          prevActiveItemKey.value = null;
          activeItemDropped.value = true;
          updateLayer?.(LayerState.Idle);
        }
      }, dropAnimationDuration.value);
    },
    [
      activeItemKey,
      activeItemPosition,
      prevActiveItemKey,
      activationTimeoutId,
      activeItemDropped,
      activeAnimationProgress,
      activationState,
      debugCross,
      dropAnimationDuration,
      dragStartIndex,
      dragStartItemTouchOffset,
      firstTouch,
      haptics,
      inactiveAnimationProgress,
      indexToKey,
      keyToIndex,
      currentTouch,
      stableOnDragEnd,
      touchPosition,
      updateLayer
    ]
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
        indexToKey: indexToKey.value,
        key,
        keyToIndex: keyToIndex.value,
        toIndex
      });
    },
    [indexToKey, keyToIndex, stableOnOrderChange, haptics]
  );

  return {
    value: {
      dropAnimationDuration,
      handleDragEnd,
      handleDragStart,
      handleOrderChange,
      handleTouchStart,
      handleTouchesMove
    }
  };
});

export { DragProvider, useDragContext };
