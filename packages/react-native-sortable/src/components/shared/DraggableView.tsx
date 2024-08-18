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
  ItemContextProvider,
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
  const { canSwitchToAbsoluteLayout, overrideItemDimensions, touchedItemKey } =
    useCommonValuesContext();
  const { handleItemMeasurement, handleItemRemoval } = useMeasurementsContext();

  const viewRef = useAnimatedRef<Animated.View>();
  const isTouched = useDerivedValue(() => touchedItemKey.value === key);
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
      <GestureDetector gesture={gesture}>
        <ItemDecoration
          isTouched={isTouched}
          pressProgress={pressProgress}
          // Keep onLayout the closest to the children to measure the real item size
          // (without paddings or other style changes made to the wrapper component)
          onLayout={({ nativeEvent: { layout } }) =>
            handleItemMeasurement(key, {
              height: layout.height,
              width: layout.width
            })
          }>
          <ItemContextProvider
            isTouched={isTouched}
            itemKey={key}
            position={position}
            pressProgress={pressProgress}
            zIndex={zIndex}>
            {children}
          </ItemContextProvider>
        </ItemDecoration>
      </GestureDetector>
    </Animated.View>
  );
}
