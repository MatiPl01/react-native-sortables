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

import { useHaptics, useStableCallbackValue } from '../../hooks';
import type {
  DragContextType,
  OverDrag,
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
  getKeyToIndex,
  getOffsetDistance,
  setAnimatedTimeout
} from '../../utils';
import { createProvider } from '../utils';
import { useAutoScrollContext } from './AutoScrollProvider';
import { useCommonValuesContext } from './CommonValuesProvider';
import { useCustomHandleContext } from './CustomHandleProvider';
import { useLayerContext } from './LayerProvider';
import { useMeasurementsContext } from './MeasurementsProvider';
import { usePortalContext } from './PortalProvider';

type DragProviderProps = PropsWithChildren<
  {
    hapticsEnabled: boolean;
    overDrag: OverDrag;
  } & Required<SortableCallbacks>
>;

const { DragProvider, useDragContext } = createProvider('Drag')<
  DragProviderProps,
  DragContextType
>(({
  hapticsEnabled,
  onActiveItemDropped,
  onDragEnd: stableOnDragEnd,
  onDragMove,
  onDragStart,
  onOrderChange,
  overDrag
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
    snapOffsetX,
    snapOffsetY,
    sortEnabled,
    touchPosition
  } = useCommonValuesContext();
  const { measureContainer } = useMeasurementsContext();
  const { updateLayer } = useLayerContext() ?? {};
  const { scrollOffsetDiff, updateStartScrollOffset } =
    useAutoScrollContext() ?? {};
  const { activeHandleMeasurements, activeHandleOffset } =
    useCustomHandleContext() ?? {};
  const { activeItemAbsolutePosition } = usePortalContext() ?? {};

  const haptics = useHaptics(hapticsEnabled);

  const hasHorizontalOverDrag =
    overDrag === 'horizontal' || overDrag === 'both';
  const hasVerticalOverDrag = overDrag === 'vertical' || overDrag === 'both';

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
  const stableOnActiveItemDropped = useStableCallbackValue(onActiveItemDropped);

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
      snapDimensions: customHandle
        ? activeHandleMeasurements?.value
        : activeItemDimensions.value,
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
        touchPosition.value = null;
        return;
      }

      touchPosition.value = {
        x:
          startTouchPosition.x +
          (touch.absoluteX - startTouch.absoluteX) +
          (offsetDiff?.x ?? 0),
        y:
          startTouchPosition.y +
          (touch.absoluteY - startTouch.absoluteY) +
          (offsetDiff?.y ?? 0)
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

      const snapX = translate(itemTouchOffset.x, tX);
      const snapY = translate(itemTouchOffset.y, tY);

      const unclampedActiveX = touchPosition.value.x - snapX;
      const unclampedActiveY = touchPosition.value.y - snapY;

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

      if (activeItemAbsolutePosition) {
        activeItemAbsolutePosition.value = {
          x: touch.absoluteX + activeX - unclampedActiveX - snapX,
          y: touch.absoluteY + activeY - unclampedActiveY - snapY
        };
      }
    }
  );

  /**
   * DRAG HANDLERS
   */

  // If custom handle is used, it must be called after handle is measured
  const setDragStartValues = useCallback(
    (key: string) => {
      'worklet';
      const itemPosition = itemPositions.value[key];

      if (!itemPosition || !currentTouch.value) {
        return;
      }

      let touchItemPosition = itemPosition;
      if (customHandle) {
        const containerMeasurements = measure(containerRef);
        if (!activeHandleMeasurements?.value || !containerMeasurements) {
          return;
        }

        touchItemPosition = {
          x: activeHandleMeasurements.value.pageX - containerMeasurements.pageX,
          y: activeHandleMeasurements.value.pageY - containerMeasurements.pageY
        };
      }

      const touchX = touchItemPosition.x + currentTouch.value.x;
      const touchY = touchItemPosition.y + currentTouch.value.y;

      touchPosition.value = { x: touchX, y: touchY };
      dragStartTouchPosition.value = touchPosition.value;
      dragStartItemTouchOffset.value = {
        x: touchX - itemPosition.x,
        y: touchY - itemPosition.y
      };
    },
    [
      activeHandleMeasurements,
      containerRef,
      currentTouch,
      customHandle,
      dragStartItemTouchOffset,
      dragStartTouchPosition,
      itemPositions,
      touchPosition
    ]
  );

  const handleDragStart = useCallback(
    (
      key: string,
      activationAnimationProgress: SharedValue<number>,
      fail: () => void
    ) => {
      'worklet';
      const itemPosition = itemPositions.value[key];
      const dimensions = itemDimensions.value[key];

      if (!itemPosition || !dimensions) {
        fail();
        return;
      }

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

      // If a custom handle is used, these values will be set in the
      // handle component after the handle is measured
      if (!customHandle) {
        setDragStartValues(key);
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
        indexToKey: indexToKey.value,
        key,
        keyToIndex: keyToIndex.value
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
      customHandle,
      dragStartIndex,
      haptics,
      inactiveAnimationProgress,
      inactiveItemOpacity,
      inactiveItemScale,
      indexToKey,
      itemDimensions,
      itemPositions,
      keyToIndex,
      prevActiveItemKey,
      setDragStartValues,
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
        handleDragStart(key, activationAnimationProgress, fail);
        activate();
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
      touchPosition.value = null;
      activationState.value = DragActivationState.INACTIVE;
      updateStartScrollOffset?.(null);

      if (activeHandleMeasurements) {
        activeHandleMeasurements.value = null;
      }

      const fromIndex = dragStartIndex.value;
      const toIndex = keyToIndex.value[key]!;

      if (activeItemKey.value !== null) {
        prevActiveItemKey.value = activeItemKey.value;
        activeItemKey.value = null;
        updateLayer?.(LayerState.INTERMEDIATE);
        haptics.medium();

        stableOnDragEnd({
          fromIndex,
          indexToKey: indexToKey.value,
          key,
          keyToIndex: keyToIndex.value,
          toIndex
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
        stableOnActiveItemDropped({
          fromIndex,
          indexToKey: indexToKey.value,
          key,
          keyToIndex: keyToIndex.value,
          toIndex
        });
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
      stableOnActiveItemDropped,
      stableOnDragEnd,
      touchPosition,
      touchStartTouch,
      updateLayer,
      updateStartScrollOffset,
      activeHandleMeasurements
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
        keyToIndex: getKeyToIndex(newOrder),
        toIndex
      });
    },
    [indexToKey, stableOnOrderChange, haptics]
  );

  return {
    value: {
      dropAnimationDuration,
      handleDragEnd,
      handleOrderChange,
      handleTouchStart,
      handleTouchesMove,
      setDragStartValues
    }
  };
});

export { DragProvider, useDragContext };
