import { useEffect, useMemo } from 'react';
import type { ViewProps, ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { EMPTY_OBJECT, IS_WEB } from '../../constants';
import {
  ItemContextProvider,
  useCommonValuesContext,
  useItemLayout,
  useItemPanGesture,
  useItemZIndex,
  useMeasurementsContext
} from '../../providers';
import type { LayoutAnimation } from '../../types';
import ItemDecoration from './ItemDecoration';

const RELATIVE_STYLE: ViewStyle = {
  height: undefined,
  left: undefined,
  opacity: 1,
  position: 'relative',
  top: undefined,
  transform: [],
  width: undefined,
  zIndex: 0
};

const NO_TRANSLATION_STYLE: ViewStyle = {
  ...RELATIVE_STYLE,
  opacity: 0,
  position: 'absolute',
  zIndex: -1
};

type DraggableViewProps = {
  itemKey: string;
  entering?: LayoutAnimation;
  exiting?: LayoutAnimation;
} & ViewProps;

export default function DraggableView({
  children,
  entering,
  exiting,
  itemKey: key,
  style,
  ...viewProps
}: DraggableViewProps) {
  const { canSwitchToAbsoluteLayout, shouldAnimateLayout, touchedItemKey } =
    useCommonValuesContext();
  const { handleItemMeasurement, handleItemRemoval } = useMeasurementsContext();

  const isBeingActivated = useDerivedValue(() => touchedItemKey.value === key);
  const pressProgress = useSharedValue(0);
  const gesture = useItemPanGesture(key, pressProgress);

  const { layoutX, layoutY, translateX, translateY } = useItemLayout(
    key,
    pressProgress
  );
  const layoutPosition = useMemo(
    () => ({ x: layoutX, y: layoutY }),
    [layoutX, layoutY]
  );
  const zIndex = useItemZIndex(key, pressProgress);

  useEffect(() => {
    return () => handleItemRemoval(key);
  }, [key, handleItemRemoval]);

  const animatedTranslationStyle = useAnimatedStyle(() => {
    if (!canSwitchToAbsoluteLayout.value) {
      return RELATIVE_STYLE;
    }

    if (translateX.value === null || translateY.value === null) {
      return NO_TRANSLATION_STYLE;
    }

    return {
      opacity: 1,
      position: 'absolute',
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value }
      ],
      zIndex: zIndex.value
    };
  });

  const animatedLayoutStyle = useAnimatedStyle(() => {
    if (!canSwitchToAbsoluteLayout.value) {
      return EMPTY_OBJECT;
    }

    const x = layoutX.value;
    const y = layoutY.value;
    let left = x;
    let top = y;

    if (shouldAnimateLayout.value) {
      left = x !== null ? withTiming(x) : x;
      top = y !== null ? withTiming(y) : y;
    }

    return {
      left,
      top
    };
  });

  return (
    <Animated.View
      {...viewProps}
      layout={IS_WEB ? undefined : LinearTransition}
      style={[style, animatedTranslationStyle, animatedLayoutStyle]}>
      <Animated.View entering={entering} exiting={exiting}>
        <GestureDetector gesture={gesture}>
          <ItemDecoration
            isBeingActivated={isBeingActivated}
            itemKey={key}
            pressProgress={pressProgress}
            // Keep onLayout the closest to the children to measure the real item size
            // (without paddings or other style changes made to the wrapper component)
            onLayout={({ nativeEvent: { layout } }) => {
              handleItemMeasurement(key, {
                height: layout.height,
                width: layout.width
              });
            }}>
            <ItemContextProvider
              isBeingActivated={isBeingActivated}
              itemKey={key}
              position={layoutPosition}
              pressProgress={pressProgress}
              zIndex={zIndex}>
              {children}
            </ItemContextProvider>
          </ItemDecoration>
        </GestureDetector>
      </Animated.View>
    </Animated.View>
  );
}
