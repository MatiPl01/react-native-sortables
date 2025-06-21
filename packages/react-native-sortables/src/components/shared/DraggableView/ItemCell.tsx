import type { PropsWithChildren } from 'react';
import {
  type LayoutChangeEvent,
  Platform,
  StyleSheet,
  type ViewStyle
} from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

import type {
  AnimatedStyleProp,
  LayoutAnimation,
  MeasureCallback
} from '../../../types';
import AnimatedOnLayoutView from '../AnimatedOnLayoutView';

export type ItemCellProps = PropsWithChildren<{
  itemsOverridesStyle: AnimatedStyle<ViewStyle>;
  cellStyle: AnimatedStyleProp;
  onMeasure: MeasureCallback;
  hidden?: boolean;
  entering?: LayoutAnimation;
  exiting?: LayoutAnimation;
}>;

export default function ItemCell({
  cellStyle,
  children,
  entering,
  exiting,
  hidden,
  itemsOverridesStyle,
  onMeasure
}: ItemCellProps) {
  const style = [
    styles.decoration,
    cellStyle,
    itemsOverridesStyle,
    hidden && styles.hidden
  ];

  const onLayout = hidden
    ? undefined
    : ({
        nativeEvent: {
          layout: { height, width }
        }
      }: LayoutChangeEvent) => {
        onMeasure(width, height);
      };

  return (
    <AnimatedOnLayoutView style={style} onLayout={onLayout}>
      {/* TODO - remove itemEntering and itemExiting layout animation in sortables v2 */}
      {entering || exiting ? (
        <Animated.View entering={entering} exiting={exiting}>
          {children}
        </Animated.View>
      ) : (
        children
      )}
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
  }),
  hidden: {
    // TODO - find a better way to hide the item
    // (can't use opacity and transform because they are used in animated
    // styles, which take precedence over the js style; can't change dimensions
    // as they trigger layout transition in the child component)
    left: -9999
  }
});
