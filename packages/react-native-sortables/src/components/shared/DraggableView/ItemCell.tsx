import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';
import Animated, {
  useAnimatedStyle,
  useDerivedValue
} from 'react-native-reanimated';

import { IS_WEB } from '../../../constants';
import { useCommonValuesContext } from '../../../providers';
import type {
  Dimensions,
  LayoutAnimation,
  LayoutTransition
} from '../../../types';
import AnimatedOnLayoutView from '../AnimatedOnLayoutView';

type ItemCellProps = {
  itemKey: string;
  cellStyle: StyleProp<AnimatedStyle<ViewStyle>>;
} & (
  | {
      children: ReactNode;
      decorationStyle: StyleProp<AnimatedStyle<ViewStyle>>;
      itemsOverridesStyle: AnimatedStyle<ViewStyle>;
      entering?: LayoutAnimation;
      exiting?: LayoutAnimation;
      layout?: LayoutTransition;
      handleItemMeasurement: (key: string, dimensions: Dimensions) => void;
    }
  | {
      children?: undefined;
      decorationStyle?: never;
      entering?: never;
      exiting?: never;
      handleItemMeasurement?: never;
      itemsOverridesStyle?: never;
      layout?: never;
    }
);

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
  return (
    <Animated.View layout={IS_WEB ? undefined : layout} style={cellStyle}>
      {children ? (
        <AnimatedOnLayoutView
          entering={entering}
          exiting={exiting}
          style={[itemsOverridesStyle, decorationStyle]}
          onLayout={({
            nativeEvent: {
              layout: { height, width }
            }
          }) => {
            handleItemMeasurement(itemKey, {
              height,
              width
            });
          }}>
          {children}
        </AnimatedOnLayoutView>
      ) : (
        <Animated.View style={itemsOverridesStyle}>
          <PlaceholderItem itemKey={itemKey} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

type PlaceholderItemProps = {
  itemKey: string;
};

function PlaceholderItem({ itemKey }: PlaceholderItemProps) {
  const { itemDimensions } = useCommonValuesContext();

  const dimensions = useDerivedValue(() => itemDimensions.value[itemKey]);

  const animatedPlaceholderStyle = useAnimatedStyle(
    () => dimensions.value ?? {}
  );

  return <Animated.View style={animatedPlaceholderStyle} />;
}
