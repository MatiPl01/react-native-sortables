import { type PropsWithChildren, useCallback } from 'react';
import type { View } from 'react-native';
import type {
  GestureTouchEvent,
  TouchData
} from 'react-native-gesture-handler';
import type { AnimatedRef, SharedValue } from 'react-native-reanimated';
import {
  interpolate,
  measure,
  useAnimatedReaction,
  useDerivedValue,
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
    snapOffsetX,
    snapOffsetY,
    touchPosition
  } = useCommonValuesContext();
  const { maybeUpdateSnapDimensions, tryMeasureContainerHeight } =
    useMeasurementsContext();
  const { updateLayer } = useLayerContext() ?? {};
  const { dragStartScrollOffset, scrollOffset, updateStartScrollOffset } =
    useAutoScrollContext() ?? {};
  const debugContext = useDebugContext();

  const debugCross = debugContext?.useDebugCross();
  const haptics = useHaptics(hapticsEnabled);

  const firstTouchBeforeActivation = useSharedValue<TouchData | null>(null);
  const lastTouchBeforeActivation = useSharedValue<TouchData | null>(null);
  const dragStartItemTouchOffset = useSharedValue<Vector | null>(null);
  const dragStartIndex = useSharedValue(-1);
  const snapItemOffset = useSharedValue<Vector | null>(null);
  const scrollOffsetY = useDerivedValue(() => {
    if (dragStartScrollOffset?.value === -1) {
      return 0;
    }
    return (scrollOffset?.value ?? 0) - (dragStartScrollOffset?.value ?? 0);
  });

  // used for activation and deactivation (drop)
  const activationTimeoutId = useSharedValue(-1);

  // Create stable callbacks to avoid re-rendering when the callback
  // function is not memoized
  const stableOnDragStart = useJSStableCallback(onDragStart);
  const stableOnDragEnd = useJSStableCallback(onDragEnd);
  const stableOnOrderChange = useJSStableCallback(onOrderChange);

  const handleTouchChange = useCallback(
    (touch: TouchData, handleRef?: AnimatedRef<View>) => {
      'worklet';
      const containerMeasurements = measure(containerRef);
      if (!containerMeasurements) {
        debugCross?.set({ position: null });
        return;
      }

      touchPosition.value = {
        x: touch.absoluteX - containerMeasurements.pageX,
        y: touch.absoluteY - containerMeasurements.pageY
      };
      debugCross?.set({
        color: '#00007e',
        position: touchPosition.value
      });

      if (handleRef) {
        const handleMeasurements = measure(handleRef);
        const activePosition =
          activeItemPosition.value ??
          (activeItemKey.value && itemPositions.value[activeItemKey.value]);
        if (!handleMeasurements || !activePosition) {
          return;
        }

        snapItemOffset.value = {
          x:
            handleMeasurements.pageX -
            containerMeasurements.pageX -
            activePosition.x,
          y:
            handleMeasurements.pageY -
            containerMeasurements.pageY -
            activePosition.y
        };
      }
    },
    [
      activeItemKey,
      activeItemPosition,
      containerRef,
      debugCross,
      itemPositions,
      snapItemOffset,
      touchPosition
    ]
  );

  // ACTIVE ITEM POSITION UPDATER
  useAnimatedReaction(
    () => ({
      dimensions: snapItemDimensions.value,
      enableSnap: enableActiveItemSnap.value,
      itemTouchOffset: dragStartItemTouchOffset.value,
      oX: snapOffsetX.value,
      oY: snapOffsetY.value,
      progress: activeAnimationProgress.value,
      scrollY: scrollOffsetY.value,
      snapOffset: snapItemOffset.value,
      touchPos: touchPosition.value
    }),
    ({
      dimensions,
      enableSnap,
      itemTouchOffset,
      oX,
      oY,
      progress,
      snapOffset,
      touchPos
    }) => {
      if (!dimensions || !touchPos || !itemTouchOffset) {
        return;
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
        x: touchPos.x - translate(itemTouchOffset.x, tX),
        y: touchPos.y - translate(itemTouchOffset.y, tY)
      };
    }
  );

  /**
   * DRAG HANDLERS
   */

  const handleDragStart = useCallback(
    (
      key: string,
      pressProgress: SharedValue<number>,
      handleRef?: AnimatedRef<View>
    ) => {
      'worklet';
      activeAnimationProgress.value = 0;
      activeItemDropped.value = false;
      prevActiveItemKey.value = activeItemKey.value;
      activeItemKey.value = key;
      dragStartIndex.value = keyToIndex.value[key] ?? -1;
      activationState.value = DragActivationState.ACTIVE;

      updateLayer?.(LayerState.Focused);
      maybeUpdateSnapDimensions(key);
      updateStartScrollOffset?.();
      if (lastTouchBeforeActivation.value) {
        handleTouchChange(lastTouchBeforeActivation.value, handleRef);
      }

      const itemPosition = itemPositions.value[key];
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
      dragStartIndex,
      dragStartItemTouchOffset,
      haptics,
      handleTouchChange,
      inactiveAnimationProgress,
      inactiveItemOpacity,
      inactiveItemScale,
      itemPositions,
      keyToIndex,
      lastTouchBeforeActivation,
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
      fail: () => void,
      handleRef?: AnimatedRef<View>
    ) => {
      'worklet';
      const touch = e.allTouches[0];
      if (!touch) {
        fail();
        return;
      }

      firstTouchBeforeActivation.value = lastTouchBeforeActivation.value =
        touch;

      if (!canSwitchToAbsoluteLayout.value) {
        tryMeasureContainerHeight?.();
      }

      activationState.value = DragActivationState.TOUCHED;
      clearAnimatedTimeout(activationTimeoutId.value);

      // Start handling touch after a delay to prevent accidental activation
      // e.g. while scrolling the ScrollView
      activationTimeoutId.value = setAnimatedTimeout(() => {
        activate();
        handleDragStart(key, pressProgress, handleRef);
      }, dragActivationDelay.value);
    },
    [
      activationState,
      activationTimeoutId,
      canSwitchToAbsoluteLayout,
      lastTouchBeforeActivation,
      dragActivationDelay,
      firstTouchBeforeActivation,
      handleDragStart,
      tryMeasureContainerHeight
    ]
  );

  const handleTouchesMove = useCallback(
    (e: GestureTouchEvent, fail: () => void, handleRef?: AnimatedRef<View>) => {
      'worklet';
      const touch = e.allTouches[0];
      if (!touch || !firstTouchBeforeActivation.value) {
        fail();
        return;
      }

      if (activationState.value === DragActivationState.TOUCHED) {
        const dX = touch.x - firstTouchBeforeActivation.value.x;
        const dY = touch.y - firstTouchBeforeActivation.value.y;

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
        lastTouchBeforeActivation.value = touch;
      } else if (activationState.value === DragActivationState.ACTIVE) {
        handleTouchChange(touch, handleRef);
      }
    },
    [
      activationState,
      activeItemKey,
      dragActivationFailOffset,
      firstTouchBeforeActivation,
      lastTouchBeforeActivation,
      handleTouchChange
    ]
  );

  const handleDragEnd = useCallback(
    (key: string, pressProgress: SharedValue<number>) => {
      'worklet';
      prevActiveItemKey.value = activeItemKey.value;
      activeItemPosition.value = null;
      activeItemKey.value = null;
      firstTouchBeforeActivation.value = null;
      lastTouchBeforeActivation.value = null;
      touchPosition.value = null;
      dragStartIndex.value = -1;
      dragStartItemTouchOffset.value = null;
      activationState.value = DragActivationState.INACTIVE;

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

      if (activeItemKey.value !== null) {
        activeItemKey.value = null;
        updateLayer?.(LayerState.Intermediate);
        haptics.medium();

        stableOnDragEnd({
          fromIndex: dragStartIndex.value,
          indexToKey: indexToKey.value,
          key,
          keyToIndex: keyToIndex.value,
          toIndex: keyToIndex.value[key]!
        });
        dragStartIndex.value = -1;
      }
    },
    [
      activeItemKey,
      activeItemPosition,
      prevActiveItemKey,
      activationTimeoutId,
      activeItemDropped,
      activeAnimationProgress,
      activationState,
      dropAnimationDuration,
      dragStartIndex,
      dragStartItemTouchOffset,
      firstTouchBeforeActivation,
      haptics,
      inactiveAnimationProgress,
      indexToKey,
      keyToIndex,
      lastTouchBeforeActivation,
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
