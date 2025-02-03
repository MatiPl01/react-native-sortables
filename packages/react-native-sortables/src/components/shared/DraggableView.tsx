import { useEffect } from 'react';
import type { ViewProps, ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { IS_WEB } from '../../constants';
import {
  ItemContextProvider,
  useCommonValuesContext,
  useItemLayoutPosition,
  useItemPanGesture,
  useItemTranslation,
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

  const layoutPosition = useItemLayoutPosition(key, pressProgress);
  const translation = useItemTranslation(key, layoutPosition, pressProgress);
  const zIndex = useItemZIndex(key, pressProgress);
  const gesture = useItemPanGesture(key, pressProgress);

  useEffect(() => {
    return () => handleItemRemoval(key);
  }, [key, handleItemRemoval]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!canSwitchToAbsoluteLayout.value) {
      return RELATIVE_STYLE;
    }

    const layoutX = layoutPosition.x.value;
    const layoutY = layoutPosition.y.value;
    const translateX = translation.x.value;
    const translateY = translation.y.value;

    if (translateX === null || translateY === null) {
      return NO_TRANSLATION_STYLE;
    }

    let left = layoutX;
    let top = layoutY;

    if (shouldAnimateLayout.value) {
      left = layoutX !== null ? withTiming(layoutX) : layoutX;
      top = layoutY !== null ? withTiming(layoutY) : layoutY;
    }

    return {
      left,
      opacity: 1,
      position: 'absolute',
      top,
      transform: [{ translateX }, { translateY }],
      zIndex: zIndex.value
    };
  });

  return (
    <Animated.View
      {...viewProps}
      layout={IS_WEB ? undefined : LinearTransition}
      style={[style, animatedStyle]}>
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
