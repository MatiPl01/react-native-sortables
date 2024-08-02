import { useCallback, useEffect, useMemo } from 'react';
import {
  type LayoutChangeEvent,
  StyleSheet,
  type ViewProps
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
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
  useMeasurementsContext
} from '../../contexts';
import { getItemZIndex } from '../../utils';
import ItemDecoration from './ItemDecoration';

type DraggableViewProps = {
  itemKey: string;
  reverseXAxis?: boolean;
} & ViewProps;

export default function DraggableView({
  children,
  itemKey: key,
  reverseXAxis,
  style,
  ...viewProps
}: DraggableViewProps) {
  const {
    measureItem,
    overrideItemDimensions,
    removeItem,
    updateTouchedItemDimensions
  } = useMeasurementsContext();
  const {
    activationProgress,
    enabled,
    handleDragEnd,
    handleDragStart,
    handleDragUpdate,
    handleTouchStart,
    inactiveAnimationProgress,
    touchedItemKey,
    touchedItemPosition
  } = useDragContext();
  const { updateStartScrollOffset } = useAutoScrollContext() ?? {};
  const itemPosition = useItemPosition(key);

  const overriddenDimensions = useDerivedValue(
    () => overrideItemDimensions.value[key]
  );

  const isTouched = useDerivedValue(() => touchedItemKey.value === key);
  const pressProgress = useSharedValue(0);

  useEffect(() => {
    return () => removeItem(key);
  }, [key, removeItem]);

  const onDragEnd = useCallback(() => {
    'worklet';
    pressProgress.value = withTiming(0, { duration: TIME_TO_ACTIVATE_PAN });
    updateStartScrollOffset?.(-1);
    handleDragEnd(key);
  }, [key, pressProgress, handleDragEnd, updateStartScrollOffset]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(TIME_TO_ACTIVATE_PAN)
        .onTouchesDown(e => {
          // Ignore touch if another item is already being touched/activated
          if (touchedItemKey.value !== null) {
            return;
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
          pressProgress.value = animate();
          activationProgress.value = animate();
          inactiveAnimationProgress.value = animate();
        })
        .onStart(() => {
          if (touchedItemKey.value === null) {
            return;
          }
          updateStartScrollOffset?.();
          handleDragStart(key);
        })
        .onUpdate(e => {
          if (!isTouched.value) {
            return;
          }
          handleDragUpdate(e, reverseXAxis);
        })
        .onFinalize(onDragEnd)
        .onTouchesCancelled(onDragEnd)
        .enabled(enabled),
    [
      key,
      enabled,
      isTouched,
      reverseXAxis,
      activationProgress,
      touchedItemKey,
      pressProgress,
      inactiveAnimationProgress,
      handleTouchStart,
      handleDragUpdate,
      handleDragStart,
      onDragEnd,
      updateStartScrollOffset,
      updateTouchedItemDimensions
    ]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const x = itemPosition.x.value;
    const y = itemPosition.y.value;

    if (x === null || y === null) {
      return {
        position: 'relative'
      };
    }

    return {
      position: 'absolute',
      transform: [{ translateX: x }, { translateY: y }],
      zIndex: getItemZIndex(
        isTouched.value,
        pressProgress.value,
        { x, y },
        touchedItemPosition.value
      ),
      ...overriddenDimensions.value
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        {...viewProps}
        style={[styles.draggableView, style, animatedStyle]}
        onLayout={({
          nativeEvent: {
            layout: { height, width }
          }
        }: LayoutChangeEvent) => {
          measureItem(key, { height, width });
        }}>
        <ItemDecoration itemKey={key} pressProgress={pressProgress}>
          {children}
        </ItemDecoration>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  draggableView: {
    left: 0,
    top: 0
  }
});
