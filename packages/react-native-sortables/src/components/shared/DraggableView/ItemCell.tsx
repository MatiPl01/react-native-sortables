import type { PropsWithChildren } from 'react';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

import type {
  AnimatedStyleProp,
  LayoutAnimation,
  MeasureCallback
} from '../../../types';
import AnimatedOnLayoutView from '../AnimatedOnLayoutView';

export type ItemCellProps = PropsWithChildren<{
  decorationStyles: AnimatedStyleProp;
  itemsOverridesStyle: AnimatedStyle<ViewStyle>;
  cellStyle: AnimatedStyleProp;
  onMeasure?: MeasureCallback;
  entering?: LayoutAnimation;
  exiting?: LayoutAnimation;
}>;

export default function ItemCell({
  cellStyle,
  children,
  decorationStyles,
  entering,
  exiting,
  itemsOverridesStyle,
  onMeasure
}: ItemCellProps) {
  const maybeOnLayout = onMeasure
    ? ({
        nativeEvent: {
          layout: { height, width }
        }
      }: LayoutChangeEvent) => {
        onMeasure(width, height);
      }
    : undefined;

  return (
    <Animated.View style={cellStyle}>
      <AnimatedOnLayoutView
        entering={entering}
        exiting={exiting}
        style={[itemsOverridesStyle, decorationStyles]}
        onLayout={maybeOnLayout}>
        {children}
      </AnimatedOnLayoutView>
    </Animated.View>
  );
}
