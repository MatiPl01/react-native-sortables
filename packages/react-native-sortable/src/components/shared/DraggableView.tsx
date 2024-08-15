import { useCallback, useEffect, useMemo } from 'react';
import { type ViewProps, type ViewStyle } from 'react-native';
import type {
  GestureTouchEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload
} from 'react-native-gesture-handler';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
  useDragContext,
  useItemPosition,
  useItemZIndex,
  useMeasurementsContext
} from '../../contexts';
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
    canSwitchToAbsoluteLayout,
    containerHeight,
    handleItemMeasurement,
    handleItemRemoval,
    overrideItemDimensions,
    tryMeasureContainerHeight,
    updateTouchedItemDimensions
  } = useMeasurementsContext();
  const {
    activationProgress,
    activeItemKey,
    enabled,
    handleDragEnd,
    handleDragStart,
    handleDragUpdate,
    handleTouchStart,
    inactiveAnimationProgress,
    touchedItemKey
  } = useDragContext();
  const { updateStartScrollOffset } = useAutoScrollContext() ?? {};
  const viewRef = useAnimatedRef<Animated.View>();
  const pressProgress = useSharedValue(0);

  const position = useItemPosition(key);
  const zIndex = useItemZIndex(key, pressProgress, position);
  const overriddenDimensions = useDerivedValue(
    () => overrideItemDimensions.value[key]
  );

  useEffect(() => {
    return () => handleItemRemoval(key);
  }, [key, handleItemRemoval]);

  const onDragStart = useCallback(() => {
    'worklet';
    console.log('onDragStart', touchedItemKey.value, activeItemKey.value);
    if (activeItemKey.value !== null || touchedItemKey.value === null) {
      return;
    }
    console.log('onDragStart after check');
    updateStartScrollOffset?.();
    handleDragStart(key);
  }, [
    key,
    touchedItemKey,
    handleDragStart,
    updateStartScrollOffset,
    activeItemKey
  ]);

  const onDragEnd = useCallback(() => {
    'worklet';
    console.log('onDragEnd');
    pressProgress.value = withTiming(0, { duration: TIME_TO_ACTIVATE_PAN });
    updateStartScrollOffset?.(-1);
    handleDragEnd(key);
  }, [key, pressProgress, handleDragEnd, updateStartScrollOffset]);

  const onTouchesDown = useCallback(
    (e: GestureTouchEvent) => {
      'worklet';
      console.log('onTouchesDown', touchedItemKey.value);
      // Ignore touch if another item is already being touched/activated
      if (touchedItemKey.value !== null) {
        return;
      }
      console.log('onTouchesDown after check');
      // This should never happen, but just in case the container height
      // was not measured withing the specified interval and onLayout
      // was not called, we will try to measure it again after the item
      // is touched
      if (containerHeight.value === -1) {
        tryMeasureContainerHeight();
      }

      handleTouchStart(e, key);
      updateTouchedItemDimensions(key);

      const animate = () =>
        withDelay(
          ACTIVATE_PAN_ANIMATION_DELAY,
          withTiming(1, {
            duration: TIME_TO_ACTIVATE_PAN - ACTIVATE_PAN_ANIMATION_DELAY
          })
        );

      // onStart wasn't sometimes called (seems to be a bug in gesture handler)
      // so we will call onDragStart manually after the animation is finished
      // (if the press animation was not cancelled)
      pressProgress.value = animate();
      inactiveAnimationProgress.value = animate();
      activationProgress.value = animate();
    },
    [
      key,
      touchedItemKey,
      containerHeight,
      tryMeasureContainerHeight,
      handleTouchStart,
      updateTouchedItemDimensions,
      pressProgress,
      inactiveAnimationProgress,
      activationProgress
    ]
  );

  const onUpdate = useCallback(
    (e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      'worklet';
      console.log('onUpdate', touchedItemKey.value);
      if (touchedItemKey.value !== key) {
        return;
      }
      console.log('onUpdate after check');
      handleDragUpdate(e, reverseXAxis);
    },
    [key, touchedItemKey, handleDragUpdate, reverseXAxis]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(TIME_TO_ACTIVATE_PAN)
        .shouldCancelWhenOutside(true)
        .onTouchesDown(onTouchesDown)
        .onStart(onDragStart)
        .onUpdate(onUpdate)
        .onFinalize(onDragEnd)
        .onTouchesCancelled(onDragEnd)
        .onTouchesMove(() => {
          console.log('onTouchesMove', touchedItemKey.value);
        })
        .onEnd(() => {
          console.log('onEnd', touchedItemKey.value);
        })
        .onBegin(() => {
          console.log('onBegin', touchedItemKey.value);
        })
        .enabled(enabled),
    [enabled, onTouchesDown, onDragStart, onUpdate, onDragEnd]
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
