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
  useItemZIndex,
  useMeasurementsContext
} from '../../contexts';
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
    touchedItemKey
  } = useDragContext();
  const { updateStartScrollOffset } = useAutoScrollContext() ?? {};

  const pressProgress = useSharedValue(0);

  const position = useItemPosition(key);
  const zIndex = useItemZIndex(key, pressProgress, position);
  const overriddenDimensions = useDerivedValue(
    () => overrideItemDimensions.value[key]
  );

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
          if (touchedItemKey.value !== key) {
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
    const x = position.x.value;
    const y = position.y.value;

    if (x === null || y === null) {
      return {
        position: 'relative'
      };
    }

    return {
      position: 'absolute',
      transform: [{ translateX: x }, { translateY: y }],
      zIndex: zIndex.value,
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
