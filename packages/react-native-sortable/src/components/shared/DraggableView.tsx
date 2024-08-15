import { useEffect } from 'react';
import { type ViewProps, type ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import {
  useCommonValuesContext,
  useItemPanGesture,
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
  const { canSwitchToAbsoluteLayout, overrideItemDimensions } =
    useCommonValuesContext();
  const { handleItemMeasurement, handleItemRemoval } = useMeasurementsContext();

  const viewRef = useAnimatedRef<Animated.View>();
  const pressProgress = useSharedValue(0);

  const position = useItemPosition(key);
  const zIndex = useItemZIndex(key, pressProgress, position);
  const overriddenDimensions = useDerivedValue(
    () => overrideItemDimensions.value[key]
  );
  const panGesture = useItemPanGesture(key, pressProgress, reverseXAxis);

  useEffect(() => {
    return () => handleItemRemoval(key);
  }, [key, handleItemRemoval]);

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
