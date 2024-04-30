import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import Animated from 'react-native-reanimated';

import { useMeasurementsContext } from '../../contexts';

type DraggableItemProps = PropsWithChildren<{
  id: string;
}>;

export default function DraggableItem({ children, id }: DraggableItemProps) {
  const { measureItem, removeItem } = useMeasurementsContext();

  useEffect(() => {
    return () => removeItem(id);
  }, [id, removeItem]);

  return (
    <Animated.View
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
