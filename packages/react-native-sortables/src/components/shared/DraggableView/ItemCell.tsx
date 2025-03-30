import { type PropsWithChildren } from 'react';
import { type ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

import { IS_WEB } from '../../../constants';
import type {
  AnimatedStyleProp,
  LayoutAnimation,
  LayoutTransition,
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
  layout?: LayoutTransition;
  itemStyle?: AnimatedStyleProp;
}>;

export default function ItemCell({
  cellStyle,
  children,
  decorationStyles,
  entering,
  exiting,
  itemStyle,
  itemsOverridesStyle,
  layout,
  onMeasure
}: ItemCellProps) {
  return (
    <Animated.View layout={!IS_WEB ? layout : undefined} style={cellStyle}>
      <AnimatedOnLayoutView
        entering={entering}
        exiting={exiting}
        style={[itemsOverridesStyle, decorationStyles, itemStyle]}
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
