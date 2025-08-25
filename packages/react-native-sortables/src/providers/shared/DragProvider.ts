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
  ReorderTriggerOrigin,
  SortableCallbacks,
  Vector
} from '../../types';
import { DragActivationState, LayerState } from '../../types';
import {
  areVectorsDifferent,
  calculateSnapOffset,
  getItemDimensions,
  getKeyToIndex
} from '../../utils';
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
    reorderTriggerOrigin: ReorderTriggerOrigin;
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
  overDrag,
  reorderTriggerOrigin
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
    itemHeights,
    itemPositions,
    itemWidths,
    keyToIndex,
    prevActiveItemKey,
    snapOffsetX,
    snapOffsetY,
    sortEnabled,
    touchPosition,
    usesAbsoluteLayout
  } = useCommonValuesContext();
  const { handleContainerMeasurement } = useMeasurementsContext();
  const { updateLayer } = useLayerContext() ?? {};
  const { scrollOffsetDiff } = useAutoScrollContext() ?? {};
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

  // Used to trigger order change of items when the active item is dragged around
  const triggerOriginPosition = useMutableValue<null | Vector>(null);

  // Used for activation and deactivation (drop)
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
      snapItemDimensions:
        activeHandleMeasurements?.value ?? activeItemDimensions.value,
      snapItemOffset: activeHandleOffset?.value,
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
      snapItemDimensions,
      snapItemOffset,
      startTouch,
      startTouchPosition,
      touch
    }) => {
      if (
        key === null ||
        containerH === null ||
        containerW === null ||
        !activeDimensions ||
        !snapItemDimensions ||
        !itemTouchOffset ||
        !startTouchPosition ||
        !touch ||
        !startTouch
      ) {
        touchPosition.value = null;
        triggerOriginPosition.value = null;
        return;
      }

      // Touch position

      const newTouchPosition = {
        x:
          startTouchPosition.x +
          (touch.absoluteX - startTouch.absoluteX) +
          (offsetDiff?.x ?? 0) / 3,
        y:
          startTouchPosition.y +
          (touch.absoluteY - startTouch.absoluteY) +
          (offsetDiff?.y ?? 0) / 3
      };

      if (
        !touchPosition.value ||
        areVectorsDifferent(newTouchPosition, touchPosition.value)
      ) {
        touchPosition.value = newTouchPosition;
      }

      // Active item position

      const translate = (from: number, to: number) =>
        from === to ? from : interpolate(progress, [0, 1], [from, to]);

      const maybeClampPosition = (x: number, y: number) => ({
        x: hasHorizontalOverDrag
          ? x
          : clamp(x, 0, containerW - activeDimensions.width),
        y: hasVerticalOverDrag
          ? y
          : clamp(y, 0, containerH - activeDimensions.height)
      });

      const snapOffset = enableSnap
        ? calculateSnapOffset(
            offsetX,
            offsetY,
            snapItemDimensions,
            snapItemOffset
          )
        : itemTouchOffset;

      const snapX = translate(itemTouchOffset.x, snapOffset.x);
      const snapY = translate(itemTouchOffset.y, snapOffset.y);

      const unclampedActiveX = touchPosition.value.x - snapX;
      const unclampedActiveY = touchPosition.value.y - snapY;

      activeItemPosition.value = maybeClampPosition(
        unclampedActiveX,
        unclampedActiveY
      );

      // Trigger origin position

      if (reorderTriggerOrigin === 'touch') {
        triggerOriginPosition.value = touchPosition.value;
      } else {
        const activeItemTargetPosition = maybeClampPosition(
          touchPosition.value.x - snapOffset.x,
          touchPosition.value.y - snapOffset.y
        );
        triggerOriginPosition.value = {
          x: activeItemTargetPosition.x + activeDimensions.width / 2,
          y: activeItemTargetPosition.y + activeDimensions.height / 2
        };
      }

      // Portal-related values

      if (activeItemAbsolutePosition) {
        const activePosition = activeItemPosition.value;
        activeItemAbsolutePosition.value = {
          x: touch.absoluteX + activePosition.x - unclampedActiveX - snapX,
          y: touch.absoluteY + activePosition.y - unclampedActiveY - snapY
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
      const containerMeasurements = measure(containerRef);

      if (!position || !dimensions || !containerMeasurements) {
        return;
      }

      activeAnimationProgress.value = 0;
      activeItemDropped.value = false;
      prevActiveItemKey.value = null;
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
      activationAnimationProgress.value = 0.01;
      activationAnimationProgress.value = animate();

      haptics.medium();
      // Use timeout to ensure that the callback is called after all animated
      // reactions are computed in the library
      setAnimatedTimeout(() => {
        stableOnDragStart({
          fromIndex: dragStartIndex.value,
          indexToKey: indexToKey.value,
          key,
          keyToIndex: keyToIndex.value
        });
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
      containerRef,
      prevActiveItemKey,
      stableOnDragStart,
      touchPosition,
      updateLayer,
      updateActiveHandleMeasurements
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
        const measurements = measure(containerRef);
        if (measurements) {
          handleContainerMeasurement(measurements.width, measurements.height);
        }
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
        const dimensions = getItemDimensions(
          key,
          itemWidths.value,
          itemHeights.value
        );

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
      activeItemKey,
      activationState,
      activationTimeoutId,
      containerRef,
      currentTouch,
      dragActivationDelay,
      handleContainerMeasurement,
      handleDragStart,
      itemHeights,
      itemWidths,
      itemPositions,
      sortEnabled,
      touchStartTouch,
      usesAbsoluteLayout
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

      updateLayer?.(LayerState.INTERMEDIATE);
      haptics.medium();

      stableOnDragEnd({
        fromIndex,
        indexToKey: indexToKey.value,
        key,
        keyToIndex: keyToIndex.value,
        toIndex
      });

      setAnimatedTimeout(() => {
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
      handleTouchStart,
      triggerOriginPosition
    }
  };
});

export { DragProvider, useDragContext };
