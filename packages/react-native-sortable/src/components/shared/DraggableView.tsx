import { useCallback, useEffect, useMemo } from 'react';
import {
  type LayoutChangeEvent,
  StyleSheet,
  type ViewProps
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  interpolateColor,
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
    activeItemDropped,
    activeItemKey,
    activeItemOpacity,
    activeItemPosition,
    activeItemScale,
    activeItemShadowOpacity,
    enabled,
    inactiveItemOpacity,
    inactiveItemScale,
    touchedItemKey
  } = useDragContext();
  const { updateStartScrollOffset } = useAutoScrollContext() ?? {};
  const itemPosition = useItemPosition(key);

  const overriddenDimensions = useDerivedValue(
    () => overrideItemDimensions.value[key]
  );

  const isActive = useDerivedValue(() => activeItemKey.value === key);
  const pressProgress = useSharedValue(0);
  const dragStartPosition = useSharedValue({ x: 0, y: 0 });

  useEffect(() => {
    return () => removeItem(key);
  }, [key, removeItem]);

  const handleDragEnd = useCallback(() => {
    'worklet';
    touchedItemKey.value = null;
    activeItemKey.value = null;
    pressProgress.value = withTiming(0, { duration: TIME_TO_ACTIVATE_PAN });
    activationProgress.value = withTiming(
      0,
      { duration: TIME_TO_ACTIVATE_PAN },
      () => {
        activeItemDropped.value = true;
      }
    );
  }, [
    activationProgress,
    activeItemKey,
    activeItemDropped,
    touchedItemKey,
    pressProgress
  ]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(TIME_TO_ACTIVATE_PAN)
        .onTouchesDown(() => {
          const progress = withDelay(
            ACTIVATE_PAN_ANIMATION_DELAY,
            withTiming(1, {
              duration: TIME_TO_ACTIVATE_PAN - ACTIVATE_PAN_ANIMATION_DELAY
            })
          );
          touchedItemKey.value = key;
          pressProgress.value = progress;
          activationProgress.value = progress;
        })
        .onStart(() => {
          if (touchedItemKey.value === null) {
            return;
          }
          updateStartScrollOffset?.();
          dragStartPosition.value = activeItemPosition.value = {
            x: itemPosition.x.value ?? 0,
            y: itemPosition.y.value ?? 0
          };
          activeItemKey.value = key;
          activeItemDropped.value = false;
        })
        .onUpdate(e => {
          if (!isActive.value) {
            return;
          }
          activeItemPosition.value = {
            x:
              dragStartPosition.value.x +
              (reverseXAxis ? -1 : 1) * e.translationX,
            y: dragStartPosition.value.y + e.translationY
          };
        })
        .onFinalize(handleDragEnd)
        .enabled(enabled),
    [
      key,
      enabled,
      reverseXAxis,
      handleDragEnd,
      isActive,
      itemPosition,
      activationProgress,
      activeItemKey,
      touchedItemKey,
      activeItemPosition,
      activeItemDropped,
      dragStartPosition,
      pressProgress,
      updateStartScrollOffset
    ]
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (itemPosition.x.value === null || itemPosition.y.value === null) {
      return {
        position: 'relative'
      };
    }

    const x = itemPosition.x.value;
    const y = itemPosition.y.value;

    return {
      left: itemPosition.x.value,
      position: 'absolute',
      top: itemPosition.y.value,
      zIndex: getItemZIndex(
        isActive.value,
        pressProgress.value,
        { x, y },
        activeItemPosition.value
      ),
      ...overriddenDimensions.value
    };
  });

  const animatedDecorationStyle = useAnimatedStyle(() => {
    const resultantProgress =
      2 * pressProgress.value - activationProgress.value;

    return {
      opacity: interpolate(
        resultantProgress,
        [-1, 0, 1],
        [inactiveItemOpacity.value, 1, activeItemOpacity.value]
      ),
      shadowColor: interpolateColor(
        resultantProgress,
        [-1, 0, 1],
        [
          'transparent',
          'transparent',
          `rgba(0, 0, 0, ${activeItemShadowOpacity.value})`
        ]
      ),
      shadowOpacity: interpolate(resultantProgress, [-1, 0, 1], [0, 0, 1]),
      transform: [
        {
          scale: interpolate(
            resultantProgress,
            [-1, 0, 1],
            [inactiveItemScale.value, 1, activeItemScale.value]
          )
        }
      ]
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        {...viewProps}
        style={[
          styles.decoration,
          style,
          animatedStyle,
          animatedDecorationStyle
        ]}
        onLayout={({
          nativeEvent: {
            layout: { height, width }
          }
        }: LayoutChangeEvent) => {
          measureItem(key, { height, width });
        }}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  decoration: {
    elevation: 5,
    shadowOffset: {
      height: 0,
      width: 0
    },
    shadowRadius: 5
  }
});
