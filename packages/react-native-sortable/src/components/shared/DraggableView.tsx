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
  const { measureItem, overrideItemDimensions, removeItem } =
    useMeasurementsContext();
  const {
    activationProgress,
    activeItemPosition,
    disabled,
    handleDragEnd,
    handleDragStart,
    inactiveAnimationProgress,
    touchedItemKey
  } = useDragContext();
  const { updateStartScrollOffset } = useAutoScrollContext() ?? {};
  const itemPosition = useItemPosition(key);

  const overriddenDimensions = useDerivedValue(
    () => overrideItemDimensions.value[key]
  );

  const isTouched = useDerivedValue(() => touchedItemKey.value === key);
  const pressProgress = useSharedValue(0);
  const dragStartPosition = useSharedValue({ x: 0, y: 0 });

  useEffect(() => {
    return () => removeItem(key);
  }, [key, removeItem]);

  const onDragEnd = useCallback(() => {
    'worklet';
    pressProgress.value = withTiming(0, { duration: TIME_TO_ACTIVATE_PAN });
    handleDragEnd(key);
  }, [key, pressProgress, handleDragEnd]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(TIME_TO_ACTIVATE_PAN)
        .onTouchesDown(() => {
          // Ignore touch if another item is already being touched/activated
          if (touchedItemKey.value !== null) {
            return;
          }
          touchedItemKey.value = key;
          activationProgress.value = 0;
          const delayed = () =>
            withDelay(
              ACTIVATE_PAN_ANIMATION_DELAY,
              withTiming(1, {
                duration: TIME_TO_ACTIVATE_PAN - ACTIVATE_PAN_ANIMATION_DELAY
              })
            );
          pressProgress.value = delayed();
          activationProgress.value = delayed();
          inactiveAnimationProgress.value = delayed();
        })
        .onStart(() => {
          if (!isTouched.value) {
            return;
          }
          dragStartPosition.value = activeItemPosition.value = {
            x: itemPosition.x.value ?? 0,
            y: itemPosition.y.value ?? 0
          };
          updateStartScrollOffset?.();
          handleDragStart(key);
        })
        .onUpdate(e => {
          if (!isTouched.value) {
            return;
          }
          activeItemPosition.value = {
            x:
              dragStartPosition.value.x +
              (reverseXAxis ? -1 : 1) * e.translationX,
            y: dragStartPosition.value.y + e.translationY
          };
        })
        .onFinalize(onDragEnd)
        .onTouchesCancelled(onDragEnd)
        .enabled(!disabled),
    [
      key,
      disabled,
      isTouched,
      reverseXAxis,
      handleDragStart,
      onDragEnd,
      itemPosition,
      activationProgress,
      touchedItemKey,
      activeItemPosition,
      dragStartPosition,
      pressProgress,
      inactiveAnimationProgress,
      updateStartScrollOffset
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
        activeItemPosition.value
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
