import { type PropsWithChildren, useCallback } from 'react';
import type { View } from 'react-native';
import type {
  GestureTouchEvent,
  TouchData
} from 'react-native-gesture-handler';
import type { AnimatedRef, SharedValue } from 'react-native-reanimated';
import {
  clamp,
  interpolate,
  measure,
  useAnimatedReaction,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { useHaptics, useJSStableCallback } from '../../hooks';
import type {
  DragContextType,
  OverDrag,
  SortableCallbacks,
  Vector
} from '../../types';
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
    overDrag: OverDrag;
  } & Required<SortableCallbacks>
>;

const { DragProvider, useDragContext } = createProvider('Drag')<
  DragProviderProps,
  DragContextType
>(({ hapticsEnabled, onDragEnd, onDragStart, onOrderChange, overDrag }) => {
  const {
    activationAnimationDuration,
    activationState,
    activeAnimationProgress,
    activeItemDimensions,
    activeItemDropped,
    activeItemKey,
    activeItemPosition,
    canSwitchToAbsoluteLayout,
    containerHeight,
    containerRef,
    containerWidth,
    customHandle,
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
  const { measureContainer, setItemDimensionsAsSnapDimensions } =
    useMeasurementsContext();
  const { updateLayer } = useLayerContext() ?? {};
  const { scrollOffsetDiff, updateStartScrollOffset } =
    useAutoScrollContext() ?? {};

  const haptics = useHaptics(hapticsEnabled);

  const hasHorizontalOverDrag =
    overDrag === 'horizontal' || overDrag === 'both';
  const hasVerticalOverDrag = overDrag === 'vertical' || overDrag === 'both';

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
      offsetDiff: scrollOffsetDiff?.value,
      offsetX: snapOffsetX.value,
      offsetY: snapOffsetY.value,
      progress: activeAnimationProgress.value,
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
      offsetDiff,
      offsetX,
      offsetY,
      progress,
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
        return;
      }

      touchPosition.value = {
        x: startTouchPosition.x + (translation?.x ?? 0) + (offsetDiff?.x ?? 0),
        y: startTouchPosition.y + (translation?.y ?? 0) + (offsetDiff?.y ?? 0)
      };

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

      if (!hasHorizontalOverDrag) {
        activeX = clamp(activeX, 0, containerW - activeDimensions.width);
      }
      if (!hasVerticalOverDrag) {
        activeY = clamp(activeY, 0, containerH - activeDimensions.height);
      }

      activeItemPosition.value = {
        x: activeX,
        y: activeY
      };
    },
    [hasHorizontalOverDrag, hasVerticalOverDrag]
  );

  /**
   * DRAG HANDLERS
   */

  const handleDragStart = useCallback(
    (
      touch: TouchData,
      key: string,
      activationAnimationProgress: SharedValue<number>,
      fail: () => void,
      handleRef?: AnimatedRef<View>
    ) => {
      'worklet';
      const itemPosition = itemPositions.value[key];
      const dimensions = itemDimensions.value[key];

      if (!itemPosition || !dimensions) {
        fail();
        return;
      }

      let handlePosition = itemPosition;

      if (handleRef) {
        const handleMeasurements = measure(handleRef);
        const containerMeasurements = measure(containerRef);
        if (!handleMeasurements || !containerMeasurements) {
          fail();
          return;
        }

        handlePosition = {
          x: handleMeasurements.pageX - containerMeasurements.pageX,
          y: handleMeasurements.pageY - containerMeasurements.pageY
        };
      }

      const touchX = handlePosition.x + touch.x;
      const touchY = handlePosition.y + touch.y;

      dragStartTouch.value = touch;
      touchPosition.value = { x: touchX, y: touchY };
      dragStartTouchPosition.value = touchPosition.value;
      dragStartItemTouchOffset.value = {
        x: touchX - itemPosition.x,
        y: touchY - itemPosition.y
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
      updateStartScrollOffset?.();
      if (!customHandle) {
        setItemDimensionsAsSnapDimensions(key);
      }

      const hasInactiveAnimation =
        inactiveItemOpacity.value !== 1 || inactiveItemScale.value !== 1;

      const animate = () =>
        withTiming(1, { duration: activationAnimationDuration.value });

      inactiveAnimationProgress.value = hasInactiveAnimation ? animate() : 0;
      activeAnimationProgress.value = animate();
      activationAnimationProgress.value = animate();

      haptics.medium();
      stableOnDragStart({
        fromIndex: dragStartIndex.value,
        key
      });
    },
    [
      activationAnimationDuration,
      activeAnimationProgress,
      activeItemDimensions,
      activeItemDropped,
      activationState,
      activeItemKey,
      activeItemPosition,
      containerRef,
      customHandle,
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
      prevActiveItemKey,
      setItemDimensionsAsSnapDimensions,
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
      activationAnimationProgress: SharedValue<number>,
      activate: () => void,
      fail: () => void,
      handleRef: AnimatedRef<View> | undefined
    ) => {
      'worklet';
      const touch = e.allTouches[0];
      if (
        !touch ||
        // Ignore touch if another item is already being touched/activated
        // if the current item is still animated to the drag end position
        // or sorting is disabled at all
        !sortEnabled.value ||
        activationAnimationProgress.value > 0 ||
        activeItemKey.value !== null
      ) {
        fail();
        return;
      }

      if (!canSwitchToAbsoluteLayout.value) {
        measureContainer?.();
      }

      touchStartTouch.value = touch;
      activationState.value = DragActivationState.TOUCHED;

      clearAnimatedTimeout(activationTimeoutId.value);

      // Start handling touch after a delay to prevent accidental activation
      // e.g. while scrolling the ScrollView
      activationTimeoutId.value = setAnimatedTimeout(() => {
        if (!canSwitchToAbsoluteLayout.value) {
          fail();
          return;
        }
        activate();
        handleDragStart(
          touch,
          key,
          activationAnimationProgress,
          fail,
          handleRef
        );
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
      measureContainer,
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
    (key: string, activationAnimationProgress: SharedValue<number>) => {
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

      activationAnimationProgress.value = animate();
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
