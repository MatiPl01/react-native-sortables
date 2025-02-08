import { type PropsWithChildren, useCallback } from 'react';
import type {
  GestureTouchEvent,
  TouchData
} from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import {
  clamp,
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
    allowOverDrag: boolean;
  } & Required<SortableCallbacks>
>;

const { DragProvider, useDragContext } = createProvider('Drag')<
  DragProviderProps,
  DragContextType
>(({
  allowOverDrag,
  hapticsEnabled,
  onDragEnd,
  onDragStart,
  onOrderChange
}) => {
  const {
    activationState,
    activeAnimationDuration,
    activeAnimationProgress,
    activeItemDimensions,
    activeItemDropped,
    activeItemKey,
    activeItemPosition,
    canSwitchToAbsoluteLayout,
    containerHeight,
    containerRef,
    containerWidth,
    dragActivationDelay,
    dragActivationFailOffset,
    dropAnimationDuration,
    enableActiveItemSnap,
    inactiveAnimationProgress,
    inactiveItemOpacity,
    inactiveItemScale,
    indexToKey,
    itemDimensions,
    itemPositions,
    keyToIndex,
    prevActiveItemKey,
    snapItemDimensions,
    snapItemOffset,
    snapOffsetX,
    snapOffsetY,
    sortEnabled,
    touchPosition
  } = useCommonValuesContext();
  const { maybeUpdateSnapDimensions, tryMeasureContainerHeight } =
    useMeasurementsContext();
  const { updateLayer } = useLayerContext() ?? {};
  const { dragScrollOffsetDiff, updateStartScrollOffset } =
    useAutoScrollContext() ?? {};
  const debugContext = useDebugContext();

  const debugCross = debugContext?.useDebugCross();
  const haptics = useHaptics(hapticsEnabled);

  const touchStartTouch = useSharedValue<TouchData | null>(null);
  const dragStartTouch = useSharedValue<TouchData | null>(null);
  const dragStartItemTouchOffset = useSharedValue<Vector | null>(null);
  const dragStartTouchPosition = useSharedValue<Vector | null>(null);
  const dragTranslation = useSharedValue<Vector | null>(null);
  const dragStartIndex = useSharedValue(-1);

  // used for activation and deactivation (drop)
  const activationTimeoutId = useSharedValue(-1);

  // Create stable callbacks to avoid re-rendering when the callback
  // function is not memoized
  const stableOnDragStart = useJSStableCallback(onDragStart);
  const stableOnDragEnd = useJSStableCallback(onDragEnd);
  const stableOnOrderChange = useJSStableCallback(onOrderChange);

  // ACTIVE ITEM POSITION UPDATER
  useAnimatedReaction(
    () => ({
      activeDimensions: activeItemDimensions.value,
      containerH: containerHeight.value,
      containerW: containerWidth.value,
      enableSnap: enableActiveItemSnap.value,
      itemTouchOffset: dragStartItemTouchOffset.value,
      key: activeItemKey.value,
      offsetX: snapOffsetX.value,
      offsetY: snapOffsetY.value,
      progress: activeAnimationProgress.value,
      scrollOffsetDiff: dragScrollOffsetDiff?.value ?? 0,
      snapDimensions: snapItemDimensions.value,
      snapOffset: snapItemOffset.value,
      startTouchPosition: dragStartTouchPosition.value,
      translation: dragTranslation.value
    }),
    ({
      activeDimensions,
      containerH,
      containerW,
      enableSnap,
      itemTouchOffset,
      key,
      offsetX,
      offsetY,
      progress,
      scrollOffsetDiff,
      snapDimensions,
      snapOffset,
      startTouchPosition,
      translation
    }) => {
      if (
        key === null ||
        containerH === null ||
        containerW === null ||
        !activeDimensions ||
        !snapDimensions ||
        !itemTouchOffset ||
        !startTouchPosition
      ) {
        touchPosition.value = null;
        if (debugCross) debugCross.set({ position: null });
        return;
      }

      touchPosition.value = {
        x: startTouchPosition.x + (translation?.x ?? 0),
        y: startTouchPosition.y + (translation?.y ?? 0) + scrollOffsetDiff
      };

      if (debugCross) {
        debugCross.set({
          color: '#00007e',
          position: touchPosition.value
        });
      }

      let tX = itemTouchOffset.x;
      let tY = itemTouchOffset.y;

      if (enableSnap) {
        tX =
          (snapOffset?.x ?? 0) +
          getOffsetDistance(offsetX, snapDimensions.width);
        tY =
          (snapOffset?.y ?? 0) +
          getOffsetDistance(offsetY, snapDimensions.height);
      }

      const translate = (from: number, to: number) =>
        from === to ? from : interpolate(progress, [0, 1], [from, to]);

      let activeX = touchPosition.value.x - translate(itemTouchOffset.x, tX);
      let activeY = touchPosition.value.y - translate(itemTouchOffset.y, tY);

      if (!allowOverDrag) {
        activeX = clamp(activeX, 0, containerW - activeDimensions.width);
        activeY = clamp(activeY, 0, containerH - activeDimensions.height);
      }

      activeItemPosition.value = {
        x: activeX,
        y: activeY
      };
    },
    [allowOverDrag]
  );

  /**
   * DRAG HANDLERS
   */

  const handleDragStart = useCallback(
    (
      touch: TouchData,
      key: string,
      pressProgress: SharedValue<number>,
      fail: () => void
    ) => {
      'worklet';
      const containerMeasurements = measure(containerRef);
      const itemPosition = itemPositions.value[key];

      if (!containerMeasurements || !itemPosition) {
        fail();
        return;
      }

      dragStartTouch.value = touch;
      touchPosition.value = {
        x: touch.absoluteX - containerMeasurements.pageX,
        y: touch.absoluteY - containerMeasurements.pageY
      };
      dragStartTouchPosition.value = touchPosition.value;
      dragStartItemTouchOffset.value = {
        x: touchPosition.value.x - itemPosition.x,
        y: touchPosition.value.y - itemPosition.y
      };

      activeAnimationProgress.value = 0;
      activeItemDropped.value = false;
      prevActiveItemKey.value = activeItemKey.value;
      activeItemKey.value = key;
      activeItemPosition.value = itemPosition;
      activeItemDimensions.value = itemDimensions.value[key] ?? null;
      dragStartIndex.value = keyToIndex.value[key] ?? -1;
      activationState.value = DragActivationState.ACTIVE;

      updateLayer?.(LayerState.Focused);
      maybeUpdateSnapDimensions(key);
      updateStartScrollOffset?.();

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
      activeItemDimensions,
      activeItemDropped,
      activationState,
      activeItemKey,
      activeItemPosition,
      containerRef,
      dragStartIndex,
      dragStartItemTouchOffset,
      dragStartTouch,
      dragStartTouchPosition,
      haptics,
      inactiveAnimationProgress,
      inactiveItemOpacity,
      inactiveItemScale,
      itemDimensions,
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
      if (
        !touch ||
        // Ignore touch if another item is already being touched/activated
        // if the current item is still animated to the drag end position
        // or sorting is disabled at all
        !sortEnabled.value ||
        pressProgress.value > 0 ||
        activeItemKey.value !== null
      ) {
        fail();
        return;
      }

      if (!canSwitchToAbsoluteLayout.value) {
        tryMeasureContainerHeight?.();
      }

      touchStartTouch.value = touch;
      activationState.value = DragActivationState.TOUCHED;

      clearAnimatedTimeout(activationTimeoutId.value);

      // Start handling touch after a delay to prevent accidental activation
      // e.g. while scrolling the ScrollView
      activationTimeoutId.value = setAnimatedTimeout(() => {
        activate();
        handleDragStart(touch, key, pressProgress, fail);
      }, dragActivationDelay.value);
    },
    [
      activeItemKey,
      activationState,
      activationTimeoutId,
      canSwitchToAbsoluteLayout,
      dragActivationDelay,
      handleDragStart,
      sortEnabled,
      tryMeasureContainerHeight,
      touchStartTouch
    ]
  );

  const handleTouchesMove = useCallback(
    (e: GestureTouchEvent, fail: () => void) => {
      'worklet';
      const touch = e.allTouches[0];
      if (!touch) {
        fail();
        return;
      }

      if (activationState.value === DragActivationState.TOUCHED) {
        if (!touchStartTouch.value) {
          fail();
          return;
        }
        const dX = touch.absoluteX - touchStartTouch.value.absoluteX;
        const dY = touch.absoluteY - touchStartTouch.value.absoluteY;

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
      } else if (activationState.value === DragActivationState.ACTIVE) {
        if (!dragStartTouch.value) {
          fail();
          return;
        }
        const dX = touch.absoluteX - dragStartTouch.value.absoluteX;
        const dY = touch.absoluteY - dragStartTouch.value.absoluteY;
        dragTranslation.value = { x: dX, y: dY };
      }
    },
    [
      activationState,
      activeItemKey,
      dragActivationFailOffset,
      dragStartTouch,
      dragTranslation,
      touchStartTouch
    ]
  );

  const handleDragEnd = useCallback(
    (key: string, pressProgress: SharedValue<number>) => {
      'worklet';
      dragStartIndex.value = -1;
      touchStartTouch.value = null;
      dragStartTouch.value = null;
      dragStartItemTouchOffset.value = null;
      dragStartTouchPosition.value = null;
      dragTranslation.value = null;
      activeItemPosition.value = null;
      activeItemDimensions.value = null;
      touchPosition.value = null;
      activationState.value = DragActivationState.INACTIVE;
      updateStartScrollOffset?.(null);

      if (activeItemKey.value !== null) {
        prevActiveItemKey.value = activeItemKey.value;
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
      activeItemDimensions,
      activeItemDropped,
      activeItemPosition,
      prevActiveItemKey,
      activationTimeoutId,
      activeAnimationProgress,
      activationState,
      debugCross,
      dropAnimationDuration,
      dragStartIndex,
      dragStartItemTouchOffset,
      dragStartTouch,
      dragStartTouchPosition,
      dragTranslation,
      haptics,
      inactiveAnimationProgress,
      indexToKey,
      keyToIndex,
      stableOnDragEnd,
      touchPosition,
      touchStartTouch,
      updateLayer,
      updateStartScrollOffset
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
