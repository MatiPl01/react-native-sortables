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
    activeItemKey,
    activeItemPosition,
    disabled,
    handleDragEnd,
    handleDragStart,
    handleDragUpdate,
    touchedItemKey
  } = useDragContext();
  const { updateStartScrollOffset } = useAutoScrollContext() ?? {};
  const itemPosition = useItemPosition(key);

  const itemDimensions = useSharedValue({ height: 0, width: 0 });
  const overriddenDimensions = useDerivedValue(
    () => overrideItemDimensions.value[key]
  );

  const isActive = useDerivedValue(() => activeItemKey.value === key);
  const pressProgress = useSharedValue(0);

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
          pressProgress.value = activationProgress.value = withDelay(
            ACTIVATE_PAN_ANIMATION_DELAY,
            withTiming(1, {
              duration: TIME_TO_ACTIVATE_PAN - ACTIVATE_PAN_ANIMATION_DELAY
            })
          );
          updateTouchedItemDimensions(key);
        })
        .onStart(() => {
          if (touchedItemKey.value === null) {
            return;
          }
          updateStartScrollOffset?.();
          handleDragStart(key);
        })
        .onUpdate(e => {
          if (!isActive.value) {
            return;
          }
          handleDragUpdate(e, reverseXAxis);
        })
        .onFinalize(onDragEnd)
        .onTouchesCancelled(onDragEnd)
        .enabled(!disabled),
    [
      key,
      touchedItemKey,
      reverseXAxis,
      disabled,
      isActive,
      pressProgress,
      activationProgress,
      onDragEnd,
      handleDragStart,
      handleDragUpdate,
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
        isActive.value,
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
          itemDimensions.value = { height, width };
          measureItem(key, { height, width });
        }}>
        <ItemDecoration pressProgress={pressProgress}>
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
