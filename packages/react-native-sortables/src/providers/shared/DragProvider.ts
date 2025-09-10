import { type PropsWithChildren, useCallback } from 'react';
import type {
  GestureTouchEvent,
  TouchData
} from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import {
  clamp,
  interpolate,
  useAnimatedReaction,
  withTiming
} from 'react-native-reanimated';

import { useHaptics } from '../../integrations/haptics';
import {
  clearAnimatedTimeout,
  setAnimatedTimeout,
  useMutableValue
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
import { useMultiZoneContext } from './MultiZoneProvider';
import { usePortalContext } from './PortalProvider';

type StateContextType = {
  touchStartTouch: null | TouchData;
  dragStartItemTouchOffset: null | Vector;
  dragStartTouchPosition: null | Vector;
  dragStartIndex: number;
  activationTimeoutId: number;
};

const INITIAL_STATE: StateContextType = {
  activationTimeoutId: -1,
  dragStartIndex: -1,
  dragStartItemTouchOffset: null,
  dragStartTouchPosition: null,
  touchStartTouch: null
};

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
  const { updateLayer } = useLayerContext() ?? {};
  const { isVerticalScroll, scrollOffsetDiff } = useAutoScrollContext() ?? {};
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

  const context = useMutableValue<StateContextType>(INITIAL_STATE);

  const currentTouch = useMutableValue<null | TouchData>(null);
  // Used to trigger order change of items when the active item is dragged around
  const triggerOriginPosition = useMutableValue<null | Vector>(null);

  // ACTIVE ITEM POSITION UPDATER
  useAnimatedReaction(
    () => ({
      activeDimensions: activeItemDimensions.value,
      containerH: containerHeight.value,
      containerW: containerWidth.value,
      enableSnap: enableActiveItemSnap.value,
      itemTouchOffset: context.value.dragStartItemTouchOffset,
      key: activeItemKey.value,
      offsetX: snapOffsetX.value,
      offsetY: snapOffsetY.value,
      progress: activeAnimationProgress.value,
      scrollDiff: scrollOffsetDiff?.value,
      snapItemDimensions:
        activeHandleMeasurements?.value ?? activeItemDimensions.value,
      snapItemOffset: activeHandleOffset?.value,
      startTouch: context.value.touchStartTouch,
      startTouchPosition: context.value.dragStartTouchPosition,
      touch: currentTouch.value
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
      scrollDiff,
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
        x: startTouchPosition.x + (touch.absoluteX - startTouch.absoluteX),
        y: startTouchPosition.y + (touch.absoluteY - startTouch.absoluteY)
      };

      if (scrollDiff) {
        if (isVerticalScroll) {
          newTouchPosition.y += scrollDiff;
        } else {
          newTouchPosition.x += scrollDiff;
        }
      }

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
      itemPosition: Vector,
      itemDimensions: Dimensions,
      activationAnimationProgress: SharedValue<number>
    ) => {
      'worklet';
      const ctx = context.value;
      activeAnimationProgress.value = 0;
      activeItemDropped.value = false;
      prevActiveItemKey.value = null;
      activeItemKey.value = key;
      activeItemPosition.value = itemPosition;
      activeItemDimensions.value = itemDimensions;
      activationState.value = DragActivationState.ACTIVE;
      ctx.dragStartIndex = keyToIndex.value[key] ?? -1;

      if (activeContainerId) {
        activeContainerId.value = containerId;
      }
      if (multiZoneActiveItemDimensions) {
        multiZoneActiveItemDimensions.value = itemDimensions;
      }

      updateLayer?.(LayerState.FOCUSED);

      // We need to update the custom handle measurements if the custom handle
      // is used (touch position is relative to the handle in this case)
      updateActiveHandleMeasurements?.(key);

      // Touch position relative to the top-left corner of the sortable
      // container
      const dragStartItemTouchOffset = {
        x: touch.x + (activeHandleOffset?.value?.x ?? 0),
        y: touch.y + (activeHandleOffset?.value?.y ?? 0)
      };
      ctx.dragStartItemTouchOffset = dragStartItemTouchOffset;
      // Must be calculated relative to the item position instead of using
      // measure on the containerRef, because measure doesn't work properly
      // on Android on Fabric and returns wrong value on the second measurement
      touchPosition.value = {
        x: itemPosition.x + dragStartItemTouchOffset.x,
        y: itemPosition.y + dragStartItemTouchOffset.y
      };
      ctx.dragStartTouchPosition = touchPosition.value;

      const hasInactiveAnimation =
        inactiveItemOpacity.value !== 1 || inactiveItemScale.value !== 1;

      const animate = () =>
        withTiming(1, { duration: activationAnimationDuration.value });

      inactiveAnimationProgress.value = hasInactiveAnimation ? animate() : 0;
      activeAnimationProgress.value = animate();
      activationAnimationProgress.value = animate();

      haptics.medium();

      // Use timeout to ensure that the callback is called after all animated
      // reactions are computed in the library (e.g. for the portal and collapsible
      // items case when the size of the active item must change after it is teleported)
      setAnimatedTimeout(() => {
        onDragStart({
          fromIndex: ctx.dragStartIndex,
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
      activeHandleOffset,
      activeItemDimensions,
      activeItemDropped,
      activationState,
      activeItemKey,
      activeItemPosition,
      context,
      containerId,
      haptics,
      inactiveAnimationProgress,
      inactiveItemOpacity,
      inactiveItemScale,
      indexToKey,
      keyToIndex,
      multiZoneActiveItemDimensions,
      prevActiveItemKey,
      onDragStart,
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
        // Sorting is disabled
        !sortEnabled.value ||
        // Absolute layout is not applied yet
        !usesAbsoluteLayout.value ||
        // Another item is already being touched/activated
        activationAnimationProgress.value > 0 ||
        activeItemKey.value !== null
      ) {
        fail();
        return;
      }

      const ctx = context.value;
      ctx.touchStartTouch = touch;
      currentTouch.value = touch;
      activationState.value = DragActivationState.TOUCHED;

      clearAnimatedTimeout(ctx.activationTimeoutId);

      // Start handling touch after a delay to prevent accidental activation
      // e.g. while scrolling the ScrollView
      ctx.activationTimeoutId = setAnimatedTimeout(() => {
        if (!usesAbsoluteLayout.value) {
          return;
        }

        const itemPosition = itemPositions.value[key];
        const itemDimensions = getItemDimensions(
          key,
          itemWidths.value,
          itemHeights.value
        );

        if (!itemPosition || !itemDimensions) {
          return;
        }

        handleDragStart(
          touch,
          key,
          itemPosition,
          itemDimensions,
          activationAnimationProgress
        );
        activate();
      }, dragActivationDelay.value);
    },
    [
      activeItemKey,
      activationState,
      context,
      currentTouch,
      dragActivationDelay,
      handleDragStart,
      itemHeights,
      itemWidths,
      itemPositions,
      sortEnabled,
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

      const ctx = context.value;

      if (activeItemKey.value) {
        onDragMove({
          fromIndex: ctx.dragStartIndex,
          key: activeItemKey.value,
          touchData: touch
        });
      }

      if (activationState.value === DragActivationState.TOUCHED) {
        if (!ctx.touchStartTouch) {
          fail();
          return;
        }
        const dX = touch.absoluteX - ctx.touchStartTouch.absoluteX;
        const dY = touch.absoluteY - ctx.touchStartTouch.absoluteY;

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
      dragActivationFailOffset,
      currentTouch,
      context,
      onDragMove
    ]
  );

  const handleDragEnd = useCallback(
    (key: string, activationAnimationProgress: SharedValue<number>) => {
      'worklet';
      if (activeItemKey.value && activeItemKey.value !== key) {
        return;
      }

      const ctx = context.value;
      clearAnimatedTimeout(ctx.activationTimeoutId);

      const fromIndex = ctx.dragStartIndex;
      const toIndex = keyToIndex.value[key]!;

      ctx.touchStartTouch = null;
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
      ctx.dragStartItemTouchOffset = null;
      ctx.dragStartTouchPosition = null;
      activeItemPosition.value = null;
      activeItemDimensions.value = null;
      touchPosition.value = null;
      activeItemKey.value = null;
      ctx.dragStartIndex = -1;

      // This ensures that the drop duration is reduced if the item activation
      // animation didn't complete yet
      const dropDuration =
        activeAnimationProgress.value * dropAnimationDuration.value;

      const animate = (callback?: (finished: boolean | undefined) => void) =>
        withTiming(0, { duration: dropDuration }, callback);

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
        onActiveItemDropped({
          fromIndex,
          indexToKey: indexToKey.value,
          key,
          keyToIndex: keyToIndex.value,
          toIndex
        });
      }, dropDuration);
    },
    [
      activeContainerId,
      activeItemKey,
      activeItemDimensions,
      activeItemDropped,
      activeItemPosition,
      prevActiveItemKey,
      context,
      activeAnimationProgress,
      activationState,
      currentTouch,
      dropAnimationDuration,
      haptics,
      inactiveAnimationProgress,
      indexToKey,
      keyToIndex,
      multiZoneActiveItemDimensions,
      onActiveItemDropped,
      stableOnDragEnd,
      touchPosition,
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

      onOrderChange({
        fromIndex,
        indexToKey: indexToKey.value,
        key,
        keyToIndex: getKeyToIndex(newOrder),
        toIndex
      });
    },
    [indexToKey, onOrderChange, haptics]
  );

  return {
    value: {
      handleDragEnd,
      handleOrderChange,
      handleTouchesMove,
      handleTouchStart,
      triggerOriginPosition
    }
  };
});

export { DragProvider, useDragContext };
