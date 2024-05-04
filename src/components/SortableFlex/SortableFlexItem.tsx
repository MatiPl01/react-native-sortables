import type { ReactElement } from 'react';
import { cloneElement, isValidElement, useEffect } from 'react';
import { type LayoutChangeEvent, View, type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue
} from 'react-native-reanimated';

import {
  useFlexLayoutContext,
  useItemPosition,
  useMeasurementsContext
} from '../../contexts';

type SortableFlexItemProps = {
  itemKey: string;
} & ViewProps;

export default function SortableFlexItem({
  children,
  itemKey: key,
  style,
  ...viewProps
}: SortableFlexItemProps) {
  const { measureItem, removeItem } = useMeasurementsContext();
  const { overrideItemDimensions, stretch } = useFlexLayoutContext();
  const itemPosition = useItemPosition(key);

  const overriddenDimensions = useDerivedValue(
    () => overrideItemDimensions.value[key]
  );

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
      top: itemPosition.value.y,
      ...overriddenDimensions.value
    };
  });

  return (
    <Animated.View
      {...viewProps}
      style={[style, animatedStyle, { backgroundColor: 'red' }]}>
      <View
        onLayout={({
          nativeEvent: {
            layout: { height, width }
          }
        }: LayoutChangeEvent) => {
          measureItem(key, { height, width });
        }}>
        {isValidElement(children) &&
          cloneElement(children as ReactElement, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            style: [children.props?.style, stretch && { flexGrow: 1 }]
          })}
      </View>
    </Animated.View>
  );
}
