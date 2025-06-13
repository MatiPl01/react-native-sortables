import { type PropsWithChildren } from 'react';
import { type ViewStyle } from 'react-native';
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
  onMeasure: MeasureCallback;
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
  return (
    <Animated.View style={cellStyle}>
      <AnimatedOnLayoutView
        entering={entering}
        exiting={exiting}
        style={[itemsOverridesStyle, decorationStyles]}
        onLayout={({
          nativeEvent: {
            layout: { height, width }
          }
        }) => {
          onMeasure(width, height);
        }}>
        {children}
      </AnimatedOnLayoutView>
    </Animated.View>
  );
}
