import { type PropsWithChildren, useEffect } from 'react';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';
import Animated, {
  useAnimatedStyle,
  useDerivedValue
} from 'react-native-reanimated';

import { IS_WEB } from '../../../constants';
import { useCommonValuesContext, usePortalContext } from '../../../providers';
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
  const onLayout = children
    ? ({
        nativeEvent: {
          layout: { height, width }
        }
      }: LayoutChangeEvent) => {
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
  const { teleport } = usePortalContext()!;
  const { itemDimensions } = useCommonValuesContext();

  const dimensions = useDerivedValue(() => itemDimensions.value[itemKey]);

  useEffect(() => {
    return () => {
      // We can safely remove the teleported item only when the the
      // placeholder item is not needed anymore, because the item is
      // already rendered in the sortable container
      teleport(itemKey, null);
    };
  }, [itemKey, teleport]);

  const animatedPlaceholderStyle = useAnimatedStyle(
    () => dimensions.value ?? {}
  );

  return <Animated.View style={animatedPlaceholderStyle} />;
}
