import { useCallback, useEffect, useMemo } from 'react';
import { type ViewProps, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated';

import {
  ACTIVATE_PAN_ANIMATION_DELAY,
  TIME_TO_ACTIVATE_PAN
} from '../../constants';
import {
  useAutoScrollContext,
  useCommonValuesContext,
  useDragContext,
  useItemPosition,
  useItemZIndex,
  useMeasurementsContext
} from '../../providers';
import type { AnimatedViewStyle } from '../../types/reanimated';
import ItemDecoration from './ItemDecoration';

const RELATIVE_STYLE: ViewStyle = { position: 'relative' };

type DraggableViewProps = {
  itemKey: string;
  reverseXAxis?: boolean;
} & {
  style?: AnimatedViewStyle;
} & Omit<ViewProps, 'style'>;

export default function DraggableView({
  children,
  itemKey: key,
  reverseXAxis,
  style,
  ...viewProps
}: DraggableViewProps) {
  const {
    activationProgress,
    activeItemKey,
    canSwitchToAbsoluteLayout,
    containerHeight,
    inactiveAnimationProgress,
    overrideItemDimensions,
    touchStartPosition,
    touchedItemKey
  } = useCommonValuesContext();
  const {
    handleItemMeasurement,
    handleItemRemoval,
    tryMeasureContainerHeight,
    updateTouchedItemDimensions
  } = useMeasurementsContext();
  const { handleDragEnd, handleDragStart, handleDragUpdate, handleTouchStart } =
    useDragContext();
  const { updateStartScrollOffset } = useAutoScrollContext() ?? {};
  const viewRef = useAnimatedRef<Animated.View>();
  const pressProgress = useSharedValue(0);
  const absoluteTouchStartPosition = useSharedValue({ x: 0, y: 0 });

  const position = useItemPosition(key);
  const zIndex = useItemZIndex(key, pressProgress, position);
  const overriddenDimensions = useDerivedValue(
    () => overrideItemDimensions.value[key]
  );

  useEffect(() => {
    return () => handleItemRemoval(key);
  }, [key, handleItemRemoval]);

  const onDragEnd = useCallback(() => {
    'worklet';
    console.log('onDragEnd');
    pressProgress.value = withTiming(0, { duration: TIME_TO_ACTIVATE_PAN });
    updateStartScrollOffset?.(-1);
    handleDragEnd(key);
  }, [key, pressProgress, handleDragEnd, updateStartScrollOffset]);

  const panGesture = useMemo(
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
          console.log('onTouchesCancelled');
          manager.fail();
        })
        .onTouchesUp((_, manager) => {
          console.log('onTouchesUp');
          manager.end();
        })
        .onTouchesMove((e, manager) => {
          console.log('onTouchesMove', e.state);

          const firstTouch = e.allTouches[0];
          const startPosition = absoluteTouchStartPosition.value;
          if (!firstTouch || !startPosition) {
            return;
          }

          const dX = firstTouch.absoluteX - startPosition.x;
          const dY = firstTouch.absoluteY - startPosition.y;

          if (e.state !== State.ACTIVE && e.state !== State.BEGAN) {
            if (dX ** 2 + dY ** 2 >= 9) {
              console.log('manager.fail()', e, dX, dY);
              manager.fail();
            } else if (touchStartPosition.value) {
              absoluteTouchStartPosition.value = {
                x: firstTouch.absoluteX,
                y: firstTouch.absoluteY
              };
              touchStartPosition.value = {
                x: touchStartPosition.value.x + dX,
                y: touchStartPosition.value.y + dY
              };
            }
          }

          if (activeItemKey.value !== key) {
            console.log(
              'activeItemKey.value !== key',
              activeItemKey.value,
              key
            );
            manager.fail();
            return;
          }

          console.log({
            start: startPosition,
            x: firstTouch.x,
            y: firstTouch.y
          });

          handleDragUpdate({ x: dX, y: dY }, reverseXAxis);
        })
        .onFinalize(onDragEnd),
    [
      key,
      reverseXAxis,
      activationProgress,
      pressProgress,
      absoluteTouchStartPosition,
      containerHeight,
      inactiveAnimationProgress,
      handleTouchStart,
      touchedItemKey,
      handleDragUpdate,
      handleDragStart,
      onDragEnd,
      tryMeasureContainerHeight,
      updateStartScrollOffset,
      updateTouchedItemDimensions
    ]
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (!canSwitchToAbsoluteLayout.value) {
      return RELATIVE_STYLE;
    }

    const x = position.x.value;
    const y = position.y.value;

    if (x === null || y === null) {
      return RELATIVE_STYLE;
    }

    return {
      position: 'absolute',
      transform: [{ translateX: x }, { translateY: y }],
      zIndex: zIndex.value,
      ...overriddenDimensions.value
    };
  });

  return (
    <Animated.View ref={viewRef} {...viewProps} style={[style, animatedStyle]}>
      <GestureDetector gesture={panGesture}>
        <ItemDecoration
          itemKey={key}
          pressProgress={pressProgress}
          // Keep onLayout the closest to the children to measure the real item size
          // (without paddings or other style changes made to the wrapper component)
          onLayout={({ nativeEvent: { layout } }) =>
            handleItemMeasurement(key, {
              height: layout.height,
              width: layout.width
            })
          }>
          {children}
        </ItemDecoration>
      </GestureDetector>
    </Animated.View>
  );
}
