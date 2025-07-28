import type { PropsWithChildren } from 'react';
import {
  type LayoutChangeEvent,
  Platform,
  StyleSheet,
  type ViewStyle
} from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

import type {
  AnimatedStyleProp,
  LayoutAnimation
} from '../../../integrations/reanimated';
import { useItemDecorationStyle } from '../../../providers';
import AnimatedOnLayoutView from '../AnimatedOnLayoutView';

export type ItemCellProps = PropsWithChildren<{
  itemKey: string;
  isActive: SharedValue<boolean>;
  activationAnimationProgress: SharedValue<number>;
  cellStyle: AnimatedStyleProp;
  onLayout: (event: LayoutChangeEvent) => void;
  hidden?: boolean;
  entering?: LayoutAnimation;
  exiting?: LayoutAnimation;
}>;

export default function ItemCell({
  activationAnimationProgress,
  cellStyle,
  children,
  entering,
  exiting,
  hidden,
  isActive,
  itemKey,
  onLayout
}: ItemCellProps) {
  const decorationStyle = useItemDecorationStyle(
    itemKey,
    isActive,
    activationAnimationProgress
  );

  return (
    <Animated.View style={cellStyle}>
      <AnimatedOnLayoutView
        entering={entering}
        exiting={exiting}
        style={[
          styles.fill,
          styles.decoration,
          decorationStyle,
          hidden && styles.hidden
        ]}
        onLayout={hidden ? undefined : onLayout}>
        {children}
      </AnimatedOnLayoutView>
    </Animated.View>
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
  fill: {
    flex: 1
  },
  hidden: {
    left: -9999
  }
});
