import { useEffect } from 'react';
import type { ViewProps } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  LinearTransition,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { IS_WEB } from '../../constants';
import {
  ItemContextProvider,
  useCommonValuesContext,
  useItemLayoutStyles,
  useItemPanGesture,
  useMeasurementsContext
} from '../../providers';
import type { LayoutAnimation } from '../../types';
import ItemDecoration from './ItemDecoration';

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
  const { touchedItemKey } = useCommonValuesContext();
  const { handleItemMeasurement, handleItemRemoval } = useMeasurementsContext();

  const isBeingActivated = useDerivedValue(() => touchedItemKey.value === key);
  const pressProgress = useSharedValue(0);
  const gesture = useItemPanGesture(key, pressProgress);
  const layoutStyles = useItemLayoutStyles(key, pressProgress);

  useEffect(() => {
    return () => handleItemRemoval(key);
  }, [key, handleItemRemoval]);

  return (
    <Animated.View
      {...viewProps}
      layout={IS_WEB ? undefined : LinearTransition}
      style={[style, layoutStyles]}>
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
              pressProgress={pressProgress}>
              {children}
            </ItemContextProvider>
          </ItemDecoration>
        </GestureDetector>
      </Animated.View>
    </Animated.View>
  );
}
