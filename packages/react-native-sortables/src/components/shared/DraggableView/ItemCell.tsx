import type { PropsWithChildren } from 'react';
import {
  type LayoutChangeEvent,
  Platform,
  StyleSheet,
  type ViewStyle
} from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';

import type {
  AnimatedStyleProp,
  LayoutAnimation,
  MeasureCallback
} from '../../../types';
import AnimatedOnLayoutView from '../AnimatedOnLayoutView';

export type ItemCellProps = PropsWithChildren<{
  itemsOverridesStyle: AnimatedStyle<ViewStyle>;
  cellStyle: AnimatedStyleProp;
  onMeasure?: MeasureCallback;
  entering?: LayoutAnimation;
  exiting?: LayoutAnimation;
}>;

export default function ItemCell({
  cellStyle,
  children,
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
    <AnimatedOnLayoutView
      entering={entering}
      exiting={exiting}
      style={[styles.decoration, cellStyle, itemsOverridesStyle]}
      onLayout={maybeOnLayout}>
      {children}
    </AnimatedOnLayoutView>
  );
}

const styles = StyleSheet.create({
  decoration: Platform.select<ViewStyle>({
    android: {
      elevation: 5
    },
    default: {},
    native: {
      shadowOffset: {
        height: 0,
        width: 0
      },
      shadowOpacity: 1,
      shadowRadius: 5
    }
  })
});
