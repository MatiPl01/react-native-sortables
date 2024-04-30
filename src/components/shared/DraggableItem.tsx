import { PropsWithChildren, useEffect } from "react";
import { useMeasurementsContext } from "../../contexts";
import Animated from "react-native-reanimated";

type DraggableItemProps = PropsWithChildren<{
  id: string;
}>;

export default function DraggableItem({ id, children }: DraggableItemProps) {
  const { measureItem, removeItem } = useMeasurementsContext();

  useEffect(() => {
    return () => removeItem(id);
  }, []);

  return (
    <Animated.View
      onLayout={({
        nativeEvent: {
          layout: { height, width }
        }
      }) => {
        measureItem(id, { width, height });
      }}>
      {children}
    </Animated.View>
  );
}
