import type { PropsWithChildren } from 'react';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';
import Animated, {
  useAnimatedStyle,
  useDerivedValue
} from 'react-native-reanimated';

import { IS_WEB } from '../../../constants';
import { useCommonValuesContext } from '../../../providers';
import type {
  AnimatedStyleProp,
  Dimensions,
  LayoutAnimation,
  LayoutTransition
} from '../../../types';
import AnimatedOnLayoutView from '../AnimatedOnLayoutView';

export type ItemCellProps = PropsWithChildren<{
  itemKey: string;
  decorationStyle: AnimatedStyleProp;
  itemsOverridesStyle: AnimatedStyle<ViewStyle>;
  cellStyle: AnimatedStyleProp;
  entering?: LayoutAnimation;
  exiting?: LayoutAnimation;
  layout?: LayoutTransition;
  visible?: boolean;
  handleItemMeasurement: (key: string, dimensions: Dimensions) => void;
}>;

export default function ItemCell({
  cellStyle,
  children,
  decorationStyle,
  entering,
  exiting,
  handleItemMeasurement,
  itemKey,
  itemsOverridesStyle,
  layout
}: ItemCellProps) {
  console.log('>>>> has children', !!children);

  const onLayout = children
    ? ({
        nativeEvent: {
          layout: { height, width }
        }
      }: LayoutChangeEvent) => {
        console.log('>>>> onLayout', itemKey, height, width);
        handleItemMeasurement(itemKey, { height, width });
      }
    : undefined;

  return (
    <Animated.View layout={IS_WEB ? undefined : layout} style={cellStyle}>
      <AnimatedOnLayoutView
        entering={entering}
        exiting={exiting}
        style={[itemsOverridesStyle, decorationStyle]}
        onLayout={onLayout}>
        {children ?? <PlaceholderItem itemKey={itemKey} />}
      </AnimatedOnLayoutView>
    </Animated.View>
  );
}

type PlaceholderItemProps = {
  itemKey: string;
};

function PlaceholderItem({ itemKey }: PlaceholderItemProps) {
  const { itemDimensions } = useCommonValuesContext();
  console.log('>>>> placeholder item', itemKey);

  const dimensions = useDerivedValue(() => itemDimensions.value[itemKey]);

  const animatedPlaceholderStyle = useAnimatedStyle(
    () => dimensions.value ?? {}
  );

  return <Animated.View style={animatedPlaceholderStyle} />;
}
