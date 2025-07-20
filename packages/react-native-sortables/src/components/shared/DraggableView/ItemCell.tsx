import type { PropsWithChildren } from 'react';
import {
  type LayoutChangeEvent,
  Platform,
  StyleSheet,
  type ViewStyle
} from 'react-native';
import Animated from 'react-native-reanimated';

import type {
  AnimatedStyleProp,
  LayoutAnimation
} from '../../../integrations/reanimated';
import type { MeasureCallback } from '../../../types';
import AnimatedOnLayoutView from '../AnimatedOnLayoutView';

export type ItemCellProps = PropsWithChildren<{
  cellStyle: AnimatedStyleProp;
  onMeasure?: MeasureCallback;
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
  onMeasure
}: ItemCellProps) {
  const onLayout =
    !onMeasure || hidden
      ? undefined
      : ({
          nativeEvent: {
            layout: { height, width }
          }
        }: LayoutChangeEvent) => {
          onMeasure(width, height);
        };

  return (
    <AnimatedOnLayoutView
      style={[styles.decoration, cellStyle, hidden && styles.hidden]}
      onLayout={onLayout}>
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
    // (we use top and left on paper for the initial item absolute position
    // so we have to use something else to hide the item here)
    marginLeft: -9999
  }
});
