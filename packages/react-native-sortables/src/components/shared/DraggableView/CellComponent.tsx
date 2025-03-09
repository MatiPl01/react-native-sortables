/* eslint-disable import/no-unused-modules */
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import type { AnimatedStyle, SharedValue } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

import { IS_WEB } from '../../../constants';
import type {
  Dimensions,
  LayoutAnimation,
  LayoutTransition
} from '../../../types';
import AnimatedOnLayoutView from '../AnimatedOnLayoutView';

export type CellComponentProps = {
  itemKey: string;
  cellStyle: StyleProp<AnimatedStyle<ViewStyle>>;
  decorationStyle: StyleProp<AnimatedStyle<ViewStyle>>;
  itemsOverridesStyle: AnimatedStyle<ViewStyle>;
  entering?: LayoutAnimation;
  exiting?: LayoutAnimation;
  layout?: LayoutTransition;
  handleItemMeasurement: (key: string, dimensions: Dimensions) => void;
} & Omit<ViewProps, 'style'>;

export function CellComponent({
  cellStyle,
  children,
  decorationStyle,
  entering,
  exiting,
  handleItemMeasurement,
  itemKey,
  itemsOverridesStyle,
  layout,
  ...viewProps
}: CellComponentProps) {
  return (
    <Animated.View
      {...viewProps}
      layout={IS_WEB ? undefined : layout}
      style={cellStyle}>
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
    </Animated.View>
  );
}

type EmptyCellComponentProps = {
  itemKey: string;
  itemDimensions: SharedValue<Record<string, Dimensions>>;
} & ViewProps;

export function EmptyCellComponent() {}
