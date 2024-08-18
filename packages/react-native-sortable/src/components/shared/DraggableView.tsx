import { useEffect } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
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
import ItemDecoration from './ItemDecoration';

const RELATIVE_STYLE: ViewStyle = { position: 'relative' };

type DraggableViewProps = {
  itemKey: string;
  reverseXAxis?: boolean;
} & {
  style?: StyleProp<ViewStyle>;
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
  const gesture = useItemPanGesture(key, pressProgress, reverseXAxis);

  useEffect(() => {
    return () => handleItemRemoval(key);
  }, [key, handleItemRemoval]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!canSwitchToAbsoluteLayout.value) {
      return RELATIVE_STYLE;
    }

    const x = position.x.value;
    const y = position.y.value;
    console.log('style', canSwitchToAbsoluteLayout.value, x, y);

    return {
      opacity: x === null || y === null ? 0 : 1,
      position: 'absolute',
      transform: [{ translateX: x ?? 0 }, { translateY: y ?? 0 }],
      zIndex: zIndex.value,
      ...overriddenDimensions.value
    };
  });

  return (
    <Animated.View ref={viewRef} {...viewProps} style={[style, animatedStyle]}>
      <GestureDetector gesture={gesture}>
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
