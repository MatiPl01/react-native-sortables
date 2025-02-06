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
      dimensions: snapItemDimensions.value,
      enableSnap: enableActiveItemSnap.value,
      oX: snapOffsetX.value,
      oY: snapOffsetY.value,
      progress: activeAnimationProgress.value,
      touch: startTouch.value && {
        x: startTouch.value.x,
        y: startTouch.value.y
      }
    }),
    ({ dimensions, enableSnap, oX, oY, progress, touch }) => {
      if (!enableSnap || !dimensions || !touch) {
        snapTranslation.value = null;
        return;
      }

      const translation = touchTranslation.value;
      const targetDeltaX =
        touch.x -
        getOffsetDistance(oX, dimensions.width) +
        (translation?.x ?? 0);
      const targetDeltaY =
        touch.y -
        getOffsetDistance(oY, dimensions.height) +
        (translation?.y ?? 0);

      snapTranslation.value = {
        x: 0,
        y: 0
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
        activeItemPosition.value = null;
        return;
      }

      activeItemPosition.value = {
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
      itemPosition: activeItemPosition.value,
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
    (key: string) => {
      'worklet';
      updateStartScrollOffset?.();
      activeItemKey.value = key;
      dragStartIndex.value = keyToIndex.value[key]!;
      activationState.value = DragActivationState.ACTIVE;

      haptics.medium();
      stableOnDragStart({
        fromIndex: dragStartIndex.value,
        key
      });
    },
    [
      updateStartScrollOffset,
      stableOnDragStart,
      activationState,
      activeItemKey,
      dragStartIndex,
      keyToIndex,
      haptics
    ]
  );

  const handleDragEnd = useCallback(
    (key: string, pressProgress: SharedValue<number>) => {
      'worklet';
      prevActiveItemKey.value = activeItemKey.value;
      activeItemKey.value = null;
      startTouch.value = null;
      touchTranslation.value = null;
      touchStartItemPosition.value = null;
      dragStartTouchTranslation.value = null;
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
      prevActiveItemKey,
      dragStartTouchTranslation,
      indexToKey,
      touchStartItemPosition,
      startTouch,
      touchTranslation,
      activationTimeoutId,
      activeItemDropped,
      activeAnimationProgress,
      activationState,
      inactiveAnimationProgress,
      dropAnimationDuration,
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
      pressProgress: SharedValue<number>,
      onActivate: () => void
    ) => {
      'worklet';
      const firstTouch = e.allTouches[0];
      if (!firstTouch) {
        return;
      }

      if (!canSwitchToAbsoluteLayout.value) {
        tryMeasureContainerHeight?.();
      }

      activationState.value = DragActivationState.TOUCHED;
      clearAnimatedTimeout(activationTimeoutId.value);
      // Start handling touch after a delay to prevent accidental activation
      // e.g. while scrolling the ScrollView
      activationTimeoutId.value = setAnimatedTimeout(() => {
        maybeUpdateSnapDimensions(key);
        updateLayer?.(LayerState.Focused);

        onActivate();
        activeAnimationProgress.value = 0;
        activeItemDropped.value = false;
        prevActiveItemKey.value = activeItemKey.value;
        activeItemKey.value = key;
        startTouch.value = firstTouch;
        touchStartItemPosition.value = itemPositions.value[key] ?? null;
        activationState.value = DragActivationState.ACTIVATING;

        const hasInactiveAnimation =
          inactiveItemOpacity.value !== 1 || inactiveItemScale.value !== 1;

        const animate = (callback?: (finished?: boolean) => void) =>
          withTiming(1, { duration: activeAnimationDuration.value }, callback);

        inactiveAnimationProgress.value = hasInactiveAnimation ? animate() : 0;
        activeAnimationProgress.value = animate();
        pressProgress.value = animate(finished => {
          if (
            finished &&
            e.state !== State.CANCELLED &&
            e.state !== State.END
          ) {
            if (activeItemKey.value === key && itemPositions.value[key]) {
              handleDragStart(key);
            } else {
              handleDragEnd(key, pressProgress);
            }
          }
        });
      }, dragActivationDelay.value);
    },
    [
      prevActiveItemKey,
      startTouch,
      activeItemKey,
      itemPositions,
      activationTimeoutId,
      touchStartItemPosition,
      activationState,
      activeAnimationProgress,
      activeItemDropped,
      inactiveAnimationProgress,
      inactiveItemOpacity,
      inactiveItemScale,
      updateLayer,
      handleDragStart,
      handleDragEnd,
      maybeUpdateSnapDimensions,
      tryMeasureContainerHeight,
      canSwitchToAbsoluteLayout,
      dragActivationDelay,
      activeAnimationDuration
    ]
  );

  const handleTouchesMove = useCallback(
    (e: GestureTouchEvent, onFail: () => void) => {
      'worklet';
      if (!startTouch.value || activeItemKey.value === null) {
        return;
      }

      const firstTouch = e.allTouches[0];
      if (!firstTouch) {
        onFail();
        return;
      }

      const dX = firstTouch.absoluteX - startTouch.value.absoluteX;
      const dY = firstTouch.absoluteY - startTouch.value.absoluteY;

      // Cancel touch if the touch moved too far from the initial position
      // before the item activation animation starts
      const r = Math.sqrt(dX * dX + dY * dY);
      if (
        // activeItemKeyis set after the drag activation delay passes
        // and we don't want to cancel the touch anymore after this time
        activeItemKey.value === null &&
        r >= dragActivationFailOffset.value
      ) {
        onFail();
        return;
      }

      touchTranslation.value = { x: dX, y: dY };
    },
    [startTouch, touchTranslation, activeItemKey, dragActivationFailOffset]
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
      handleOrderChange,
      handleTouchStart,
      handleTouchesMove
    }
  };
});

export { DragProvider, useDragContext };
