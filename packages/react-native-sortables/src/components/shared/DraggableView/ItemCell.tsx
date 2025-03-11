import { type PropsWithChildren } from 'react';
import {
  type LayoutChangeEvent,
  StyleSheet,
  type ViewStyle
} from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

import { IS_WEB } from '../../../constants';
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
  displayed?: boolean;
  handleItemMeasurement: (key: string, dimensions: Dimensions) => void;
}>;

export default function ItemCell({
  cellStyle,
  children,
  decorationStyle,
  displayed = true,
  entering,
  exiting,
  handleItemMeasurement,
  itemKey,
  itemsOverridesStyle,
  layout
}: ItemCellProps) {
  const onLayout = displayed
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
        style={[
          itemsOverridesStyle,
          decorationStyle,
          !displayed && styles.hidden
        ]}
        onLayout={onLayout}>
        {children}
      </AnimatedOnLayoutView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    maxHeight: 0,
    maxWidth: 0,
    overflow: 'hidden',
    pointerEvents: 'none'
  }
});
