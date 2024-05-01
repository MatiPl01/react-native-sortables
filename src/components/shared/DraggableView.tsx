import { useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { useMeasurementsContext } from '../../contexts/shared';

type DraggableViewProps = {
  id: string;
} & ViewProps;

export default function DraggableView({
  children,
  id,
  ...viewProps
}: DraggableViewProps) {
  const { measureItem, removeItem } = useMeasurementsContext();

  useEffect(() => {
    return () => removeItem(id);
  }, [id, removeItem]);

  return (
    <Animated.View
      {...viewProps}
      onLayout={({
        nativeEvent: {
          layout: { height, width }
        }
      }) => {
        measureItem(id, { height, width });
      }}>
      {children}
    </Animated.View>
  );
}
