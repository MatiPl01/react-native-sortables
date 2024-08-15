import { useMemo } from 'react';
import { Gesture, State } from 'react-native-gesture-handler';
import {
  type SharedValue,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated';

import {
  ACTIVATE_PAN_ANIMATION_DELAY,
  TIME_TO_ACTIVATE_PAN
} from '../../../constants';
import { useAutoScrollContext } from '../AutoScrollProvider';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { useDragContext } from '../DragProvider';
import { useMeasurementsContext } from '../MeasurementsProvider';

export default function useItemPanGesture(
  key: string,
  pressProgress: SharedValue<number>,
  reverseXAxis?: boolean
) {
  const {
    activationProgress,
    activeItemKey,
    containerHeight,
    inactiveAnimationProgress,
    touchStartPosition,
    touchedItemKey
  } = useCommonValuesContext();
  const { tryMeasureContainerHeight, updateTouchedItemDimensions } =
    useMeasurementsContext();
  const { handleDragEnd, handleDragStart, handleDragUpdate, handleTouchStart } =
    useDragContext();
  const { updateStartScrollOffset } = useAutoScrollContext() ?? {};

  const absoluteTouchStartPosition = useSharedValue({ x: 0, y: 0 });

  return useMemo(
    () =>
      Gesture.Manual()
        .onTouchesDown((e, manager) => {
          const firstTouch = e.allTouches[0];
          if (!firstTouch) {
            return;
          }

          // Ignore touch if another item is already being touched/activated
          if (touchedItemKey.value !== null) {
            manager.fail();
            return;
          }

          // This should never happen, but just in case the container height
          // was not measured withing the specified interval and onLayout
          // was not called, we will try to measure it again after the item
          // is touched
          if (containerHeight.value === -1) {
            tryMeasureContainerHeight();
          }

          handleTouchStart(e, key);
          updateTouchedItemDimensions(key);

          const animate = (callback?: (finished?: boolean) => void) =>
            withDelay(
              ACTIVATE_PAN_ANIMATION_DELAY,
              withTiming(
                1,
                {
                  duration: TIME_TO_ACTIVATE_PAN - ACTIVATE_PAN_ANIMATION_DELAY
                },
                callback
              )
            );

          inactiveAnimationProgress.value = animate();
          activationProgress.value = animate();
          pressProgress.value = animate(finished => {
            if (
              finished &&
              e.state !== State.CANCELLED &&
              e.state !== State.END &&
              touchedItemKey.value === key
            ) {
              absoluteTouchStartPosition.value = {
                x: firstTouch.absoluteX,
                y: firstTouch.absoluteY
              };
              manager.activate();
              updateStartScrollOffset?.();
              handleDragStart(key);
            }
          });
        })
        .onTouchesCancelled((_, manager) => {
          manager.fail();
        })
        .onTouchesUp((_, manager) => {
          manager.end();
        })
        .onTouchesMove((e, manager) => {
          const firstTouch = e.allTouches[0];
          const startPosition = absoluteTouchStartPosition.value;
          if (!firstTouch || !startPosition) {
            return;
          }

          const dX = firstTouch.absoluteX - startPosition.x;
          const dY = firstTouch.absoluteY - startPosition.y;

          // Change the touch start position if the finger was moved
          // slightly to prevent content jumping to the new translation
          // after the pressed item becomes active
          if (
            e.state !== State.ACTIVE &&
            e.state !== State.BEGAN &&
            touchStartPosition.value
          ) {
            absoluteTouchStartPosition.value = {
              x: firstTouch.absoluteX,
              y: firstTouch.absoluteY
            };
            touchStartPosition.value = {
              x: touchStartPosition.value.x + dX,
              y: touchStartPosition.value.y + dY
            };
          }

          if (activeItemKey.value !== key) {
            manager.fail();
            return;
          }

          handleDragUpdate({ x: dX, y: dY }, reverseXAxis);
        })
        .onFinalize(() => {
          pressProgress.value = withTiming(0, {
            duration: TIME_TO_ACTIVATE_PAN
          });
          updateStartScrollOffset?.(-1);
          handleDragEnd(key);
        }),
    [
      key,
      reverseXAxis,
      activationProgress,
      pressProgress,
      absoluteTouchStartPosition,
      containerHeight,
      inactiveAnimationProgress,
      touchStartPosition,
      touchedItemKey,
      activeItemKey,
      handleTouchStart,
      handleDragUpdate,
      handleDragStart,
      handleDragEnd,
      tryMeasureContainerHeight,
      updateStartScrollOffset,
      updateTouchedItemDimensions
    ]
  );
}
