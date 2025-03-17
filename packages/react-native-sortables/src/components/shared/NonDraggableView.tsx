import { memo, useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { IS_WEB } from '../../constants';
import {
  ItemContextProvider,
  useItemLayoutStyles,
  useMeasurementsContext
} from '../../providers';
import type { LayoutTransition } from '../../types';
import ItemDecoration from './ItemDecoration';

type NonDraggableViewProps = {
  itemKey: string;
  layout: LayoutTransition | undefined;
} & ViewProps;

function NonDraggableView({
  children,
  itemKey: key,
  layout,
  style,
  ...viewProps
}: NonDraggableViewProps) {
  const { handleItemMeasurement, handleItemRemoval } = useMeasurementsContext();

  const activationAnimationProgress = useSharedValue(0);
  const isActive = useDerivedValue(() => false);
  const layoutStyles = useItemLayoutStyles(key, activationAnimationProgress);

  useEffect(() => {
    return () => handleItemRemoval(key);
  }, [key, handleItemRemoval]);

  const innerComponent = (
    <ItemDecoration
      activationAnimationProgress={activationAnimationProgress}
      isActive={isActive}
      itemKey={key}
      // Keep onLayout the closest to the children to measure the real item size
      // (without paddings or other style changes made to the wrapper component)
      pointerEvents='none'
      onLayout={({
        nativeEvent: {
          layout: { height, width }
        }
      }) => {
        handleItemMeasurement(key, {
          height,
          width
        });
      }}>
      {children}
    </ItemDecoration>
  );

  return (
    <Animated.View
      {...viewProps}
      layout={IS_WEB ? undefined : layout}
      style={[style, layoutStyles]}>
      <ItemContextProvider
        activationAnimationProgress={activationAnimationProgress}
        isActive={isActive}
        itemKey={key}>
        <Animated.View>{innerComponent}</Animated.View>
      </ItemContextProvider>
    </Animated.View>
  );
}

export default memo(NonDraggableView);
