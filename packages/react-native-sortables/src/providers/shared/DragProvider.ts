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

import { useHaptics, useStableCallbackValue } from '../../hooks';
import type {
  DragContextType,
  OverDrag,
  ReorderTriggerOrigin,
  SortableCallbacks,
  Vector
} from '../../types';
import {
  AbsoluteLayoutState,
  DragActivationState,
  LayerState
} from '../../types';
import {
  clearAnimatedTimeout,
  getOffsetDistance,
  setAnimatedTimeout
} from '../../utils';
import { createProvider } from '../utils';
import { useAutoScrollContext } from './AutoScrollProvider';
import { useCommonValuesContext } from './CommonValuesProvider';
import { useCustomHandleContext } from './CustomHandleProvider';
import { useInterDragContext } from './InterDragProvider';
import { useLayerContext } from './LayerProvider';
import { useMeasurementsContext } from './MeasurementsProvider';
import { usePortalContext } from './PortalProvider';

type DragProviderProps = PropsWithChildren<
  {
    hapticsEnabled: boolean;
    overDrag: OverDrag;
    triggerOrigin: ReorderTriggerOrigin;
  } & Required<SortableCallbacks>
>;

const { DragProvider, useDragContext } = createProvider('Drag')<
  DragProviderProps,
  DragContextType
>(({
  hapticsEnabled,
  onDragEnd: stableOnDragEnd,
  onDragMove,
  onDragStart,
  onOrderChange,
  overDrag,
  triggerOrigin
}) => {
  const {
    absoluteLayoutState,
    activationAnimationDuration,
    activationState,
    activeAnimationProgress,
    activeItemDimensions,
    activeItemDropped,
    activeItemKey,
    activeItemPosition,
    activeItemTriggerOriginPosition,
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
    snapOffsetX,
    snapOffsetY,
    sortEnabled
  } = useCommonValuesContext();
  const { measureContainer } = useMeasurementsContext();
  const { updateLayer } = useLayerContext() ?? {};
  const { scrollOffsetDiff, updateStartScrollOffset } =
    useAutoScrollContext() ?? {};
  const { activeHandleDimensions, activeHandleOffset } =
    useCustomHandleContext() ?? {};
  const { activeItemAbsolutePosition } = usePortalContext() ?? {};
  const { activeItemTriggerOriginAbsolutePosition } =
    useInterDragContext() ?? {};

  const haptics = useHaptics(hapticsEnabled);

  const hasHorizontalOverDrag =
    overDrag === 'horizontal' || overDrag === 'both';
  const hasVerticalOverDrag = overDrag === 'vertical' || overDrag === 'both';
  const isCenterOrigin = triggerOrigin === 'center';

  const touchStartTouch = useSharedValue<TouchData | null>(null);
  const currentTouch = useSharedValue<TouchData | null>(null);
  const dragStartItemTouchOffset = useSharedValue<Vector | null>(null);
  const dragStartTouchPosition = useSharedValue<Vector | null>(null);
  const dragStartIndex = useSharedValue(-1);

  // used for activation and deactivation (drop)
  const activationTimeoutId = useSharedValue(-1);

  // Create stable callbacks to avoid re-rendering when the callback
  // function is not memoized
  const stableOnDragStart = useStableCallbackValue(onDragStart);
  const stableOnDragMove = useStableCallbackValue(onDragMove);
  const stableOnOrderChange = useStableCallbackValue(onOrderChange);

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
      snapDimensions:
        activeHandleDimensions?.value ?? activeItemDimensions.value,
      snapOffset: activeHandleOffset?.value,
      startTouch: touchStartTouch.value,
      startTouchPosition: dragStartTouchPosition.value,
      touch: currentTouch.value
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
      startTouch,
      startTouchPosition,
      touch
    }) => {
      if (
        key === null ||
        containerH === null ||
        containerW === null ||
        !activeDimensions ||
        !snapDimensions ||
        !itemTouchOffset ||
        !startTouchPosition ||
        !touch ||
        !startTouch
      ) {
        activeItemTriggerOriginPosition.value = null;
        return;
      }

      const touchPosition = {
        x:
          startTouchPosition.x +
          (touch.absoluteX - startTouch.absoluteX) +
          (offsetDiff?.x ?? 0),
        y:
          startTouchPosition.y +
          (touch.absoluteY - startTouch.absoluteY) +
          (offsetDiff?.y ?? 0)
      };

      if (isCenterOrigin) {
        activeItemTriggerOriginPosition.value = {
          x: touchPosition.x + snapDimensions.width / 2,
          y: touchPosition.y + snapDimensions.height / 2
        };
      } else {
        activeItemTriggerOriginPosition.value = touchPosition;
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

      const snapX = translate(itemTouchOffset.x, tX);
      const snapY = translate(itemTouchOffset.y, tY);

      const unclampedActiveX = touchPosition.x - snapX;
      const unclampedActiveY = touchPosition.y - snapY;

      const activeX = hasHorizontalOverDrag
        ? unclampedActiveX
        : clamp(unclampedActiveX, 0, containerW - activeDimensions.width);
      const activeY = hasVerticalOverDrag
        ? unclampedActiveY
        : clamp(unclampedActiveY, 0, containerH - activeDimensions.height);

      activeItemPosition.value = {
        x: activeX,
        y: activeY
      };

      const absoluteX = touch.absoluteX + activeX - unclampedActiveX - snapX;
      const absoluteY = touch.absoluteY + activeY - unclampedActiveY - snapY;

      if (activeItemAbsolutePosition) {
        activeItemAbsolutePosition.value = {
          x: absoluteX,
          y: absoluteY
        };
      }
      if (activeItemTriggerOriginAbsolutePosition) {
        activeItemTriggerOriginAbsolutePosition.value = {
          x: absoluteX + (isCenterOrigin ? activeDimensions.width / 2 : 0),
          y: absoluteY + (isCenterOrigin ? activeDimensions.height / 2 : 0)
        };
      }
    }
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

      dragStartTouchPosition.value = { x: touchX, y: touchY };
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

      updateLayer?.(LayerState.FOCUSED);
      updateStartScrollOffset?.();

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
      dragStartIndex,
      dragStartItemTouchOffset,
      dragStartTouchPosition,
      haptics,
      inactiveAnimationProgress,
      inactiveItemOpacity,
      inactiveItemScale,
      itemDimensions,
      itemPositions,
      keyToIndex,
      prevActiveItemKey,
      stableOnDragStart,
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

      if (absoluteLayoutState.value !== AbsoluteLayoutState.COMPLETE) {
        measureContainer();
      }

      touchStartTouch.value = touch;
      currentTouch.value = touch;
      activationState.value = DragActivationState.TOUCHED;

      clearAnimatedTimeout(activationTimeoutId.value);

      // Start handling touch after a delay to prevent accidental activation
      // e.g. while scrolling the ScrollView
      activationTimeoutId.value = setAnimatedTimeout(() => {
        if (absoluteLayoutState.value !== AbsoluteLayoutState.COMPLETE) {
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
      absoluteLayoutState,
      activeItemKey,
      activationState,
      activationTimeoutId,
      currentTouch,
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
      currentTouch.value = touch ?? null;

      if (!touch) {
        fail();
        return;
      }

      if (activeItemKey.value) {
        stableOnDragMove({
          fromIndex: dragStartIndex.value,
          key: activeItemKey.value,
          touchData: touch
        });
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
      }
    },
    [
      activationState,
      activeItemKey,
      currentTouch,
      dragActivationFailOffset,
      touchStartTouch,
      dragStartIndex,
      stableOnDragMove
    ]
  );

  const handleDragEnd = useCallback(
    (key: string, activationAnimationProgress: SharedValue<number>) => {
      'worklet';
      touchStartTouch.value = null;
      currentTouch.value = null;
      dragStartItemTouchOffset.value = null;
      dragStartTouchPosition.value = null;
      activeItemPosition.value = null;
      activeItemDimensions.value = null;
      activationState.value = DragActivationState.INACTIVE;
      updateStartScrollOffset?.(null);

      if (activeItemKey.value !== null) {
        prevActiveItemKey.value = activeItemKey.value;
        activeItemKey.value = null;
        updateLayer?.(LayerState.INTERMEDIATE);
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

      dragStartIndex.value = -1;
      activationAnimationProgress.value = animate();
      inactiveAnimationProgress.value = animate();
      activeAnimationProgress.value = animate();

      clearAnimatedTimeout(activationTimeoutId.value);
      activationTimeoutId.value = setAnimatedTimeout(() => {
        prevActiveItemKey.value = null;
        activeItemDropped.value = true;
        updateLayer?.(LayerState.IDLE);
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
      currentTouch,
      dropAnimationDuration,
      dragStartIndex,
      dragStartItemTouchOffset,
      dragStartTouchPosition,
      haptics,
      inactiveAnimationProgress,
      indexToKey,
      keyToIndex,
      stableOnDragEnd,
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
