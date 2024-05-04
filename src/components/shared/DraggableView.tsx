import { useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useItemPosition, useMeasurementsContext } from '../../contexts/shared';

type DraggableViewProps = {
  itemKey: string;
} & ViewProps;

export default function DraggableView({
  children,
  itemKey: key,
  style,
  ...viewProps
}: DraggableViewProps) {
  const { measureItem, removeItem } = useMeasurementsContext();
  const itemPosition = useItemPosition(key);

  useEffect(() => {
    return () => removeItem(key);
  }, [key, removeItem]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!itemPosition.value) {
      return {
        position: 'relative'
      };
    }

    return {
      left: itemPosition.value.x,
      position: 'absolute',
      top: itemPosition.value.y
    };
  });

  return (
    <Animated.View
      {...viewProps}
      style={[style, animatedStyle]}
      onLayout={({
        nativeEvent: {
          layout: { height, width }
        }
      }) => {
        measureItem(key, { height, width });
      }}>
      {children}
    </Animated.View>
  );
}
