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
  withTiming
} from 'react-native-reanimated';

import { useHaptics } from '../../integrations/haptics';
import {
  clearAnimatedTimeout,
  setAnimatedTimeout,
  useMutableValue,
  useStableCallbackValue
} from '../../integrations/reanimated';
import type {
  Dimensions,
  DragContextType,
  OverDrag,
  SortableCallbacks,
  Vector
} from '../../types';
import { DragActivationState, LayerState } from '../../types';
import { getKeyToIndex, getOffsetDistance } from '../../utils';
import { createProvider } from '../utils';
import { useAutoScrollContext } from './AutoScrollProvider';
import { useCommonValuesContext } from './CommonValuesProvider';
import { useCustomHandleContext } from './CustomHandleProvider';
import { useLayerContext } from './LayerProvider';
import { useMeasurementsContext } from './MeasurementsProvider';
import { useMultiZoneContext } from './MultiZoneProvider';
import { usePortalContext } from './PortalProvider';

type DragProviderProps = PropsWithChildren<
  Required<SortableCallbacks> & {
    hapticsEnabled: boolean;
    overDrag: OverDrag;
  }
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
    activationAnimationDuration,
    activationState,
    activeAnimationProgress,
    activeItemDimensions,
    activeItemDropped,
    activeItemKey,
    activeItemPosition,
    containerHeight,
    containerId,
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
    outerContainerRef,
    prevActiveItemKey,
    snapOffsetX,
    snapOffsetY,
    sortEnabled,
    touchPosition,
    usesAbsoluteLayout
  } = useCommonValuesContext();
  const { measureContainer } = useMeasurementsContext();
  const { updateLayer } = useLayerContext() ?? {};
  const { scrollOffsetDiff, updateStartScrollOffset } =
    useAutoScrollContext() ?? {};
  const {
    activeHandleMeasurements,
    activeHandleOffset,
    updateActiveHandleMeasurements
  } = useCustomHandleContext() ?? {};
  const { activeItemAbsolutePosition } = usePortalContext() ?? {};
  const {
    activeContainerId,
    activeItemDimensions: multiZoneActiveItemDimensions
  } = useMultiZoneContext() ?? {};

  const haptics = useHaptics(hapticsEnabled);

  const hasHorizontalOverDrag =
    overDrag === 'horizontal' || overDrag === 'both';
  const hasVerticalOverDrag = overDrag === 'vertical' || overDrag === 'both';

  const touchStartTouch = useMutableValue<null | TouchData>(null);
  const currentTouch = useMutableValue<null | TouchData>(null);
  const dragStartItemTouchOffset = useMutableValue<null | Vector>(null);
  const dragStartTouchPosition = useMutableValue<null | Vector>(null);
  const dragStartIndex = useMutableValue(-1);

  // used for activation and deactivation (drop)
  const activationTimeoutId = useMutableValue(-1);

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
      snapDimensions:
        activeHandleMeasurements?.value ?? activeItemDimensions.value,
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

  const handleDragStart = useCallback(
    (
      touch: TouchData,
      key: string,
      position: Vector,
      dimensions: Dimensions,
      activationAnimationProgress: SharedValue<number>
    ) => {
      'worklet';
      const containerMeasurements = measure(outerContainerRef);

      if (!position || !dimensions || !containerMeasurements) {
        return;
      }

      activeAnimationProgress.value = 0;
      activeItemDropped.value = false;
      prevActiveItemKey.value = activeItemKey.value;
      activeItemKey.value = key;
      activeItemPosition.value = position;
      activeItemDimensions.value = dimensions;
      dragStartIndex.value = keyToIndex.value[key] ?? -1;
      activationState.value = DragActivationState.ACTIVE;

      if (activeContainerId) {
        activeContainerId.value = containerId;
      }
      if (multiZoneActiveItemDimensions) {
        multiZoneActiveItemDimensions.value = dimensions;
      }

      updateLayer?.(LayerState.FOCUSED);
      updateStartScrollOffset?.();

      let touchedItemPosition = position;

      // We need to update the custom handle measurements if the custom handle
      // is used (touch position is relative to the handle in this case)
      updateActiveHandleMeasurements?.(key);
      if (activeHandleMeasurements?.value) {
        const { pageX, pageY } = activeHandleMeasurements.value;
        touchedItemPosition = {
          x: pageX - containerMeasurements.pageX,
          y: pageY - containerMeasurements.pageY
        };
      }

      // Touch position relative to the top-left corner of the sortable
      // container
      const touchX = touchedItemPosition.x + touch.x;
      const touchY = touchedItemPosition.y + touch.y;

      touchPosition.value = { x: touchX, y: touchY };
      dragStartTouchPosition.value = touchPosition.value;
      dragStartItemTouchOffset.value = {
        x: touchX - position.x,
        y: touchY - position.y
      };

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
      activeContainerId,
      activeHandleMeasurements,
      activeItemDimensions,
      activeItemDropped,
      activationState,
      activeItemKey,
      activeItemPosition,
      containerId,
      dragStartIndex,
      dragStartItemTouchOffset,
      dragStartTouchPosition,
      haptics,
      inactiveAnimationProgress,
      inactiveItemOpacity,
      inactiveItemScale,
      indexToKey,
      keyToIndex,
      multiZoneActiveItemDimensions,
      outerContainerRef,
      prevActiveItemKey,
      stableOnDragStart,
      touchPosition,
      updateLayer,
      updateActiveHandleMeasurements,
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

      if (!usesAbsoluteLayout.value) {
        measureContainer();
      }

      touchStartTouch.value = touch;
      currentTouch.value = touch;
      activationState.value = DragActivationState.TOUCHED;

      clearAnimatedTimeout(activationTimeoutId.value);

      // Start handling touch after a delay to prevent accidental activation
      // e.g. while scrolling the ScrollView
      activationTimeoutId.value = setAnimatedTimeout(() => {
        if (!usesAbsoluteLayout.value) {
          return;
        }

        const position = itemPositions.value[key];
        const dimensions = itemDimensions.value[key];

        if (!position || !dimensions) {
          return;
        }

        handleDragStart(
          touch,
          key,
          position,
          dimensions,
          activationAnimationProgress
        );
        activate();
      }, dragActivationDelay.value);
    },
    [
      usesAbsoluteLayout,
      activeItemKey,
      activationState,
      activationTimeoutId,
      currentTouch,
      dragActivationDelay,
      handleDragStart,
      itemDimensions,
      itemPositions,
      measureContainer,
      sortEnabled,
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
      if (activeItemKey.value && activeItemKey.value !== key) {
        return;
      }

      clearAnimatedTimeout(activationTimeoutId.value);

      const fromIndex = dragStartIndex.value;
      const toIndex = keyToIndex.value[key]!;

      touchStartTouch.value = null;
      currentTouch.value = null;
      activationState.value = DragActivationState.INACTIVE;

      if (activeItemKey.value === null) {
        return;
      }
      if (activeHandleMeasurements) {
        activeHandleMeasurements.value = null;
      }
      if (activeContainerId) {
        activeContainerId.value = null;
      }
      if (multiZoneActiveItemDimensions) {
        multiZoneActiveItemDimensions.value = null;
      }

      prevActiveItemKey.value = activeItemKey.value;
      dragStartItemTouchOffset.value = null;
      dragStartTouchPosition.value = null;
      activeItemPosition.value = null;
      activeItemDimensions.value = null;
      touchPosition.value = null;
      activeItemKey.value = null;
      dragStartIndex.value = -1;

      const animate = (callback?: (finished: boolean | undefined) => void) =>
        withTiming(0, { duration: dropAnimationDuration.value }, callback);

      activationAnimationProgress.value = animate();
      inactiveAnimationProgress.value = animate();
      activeAnimationProgress.value = animate();

      updateStartScrollOffset?.(null);
      updateLayer?.(LayerState.INTERMEDIATE);
      haptics.medium();

      stableOnDragEnd({
        fromIndex,
        indexToKey: indexToKey.value,
        key,
        keyToIndex: keyToIndex.value,
        toIndex
      });

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
      activeContainerId,
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
      multiZoneActiveItemDimensions,
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
      handleTouchesMove,
      handleTouchStart
    }
  };
});

export { DragProvider, useDragContext };
