import type { PropsWithChildren } from 'react';
import {
  type LayoutChangeEvent,
  Platform,
  StyleSheet,
  type ViewStyle
} from 'react-native';
import type {
  AnimatedStyle,
  SharedValue,
  TransformArrayItem
} from 'react-native-reanimated';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { HIDDEN_X_OFFSET, IS_WEB, isPaper } from '../../../constants';
import type {
  AnimatedStyleProp,
  LayoutAnimation
} from '../../../integrations/reanimated';
import { useCommonValuesContext, useItemDecoration } from '../../../providers';
import AnimatedOnLayoutView from '../AnimatedOnLayoutView';

type TransformsArray = Array<TransformArrayItem>;

export type ItemCellProps = PropsWithChildren<{
  itemKey: string;
  isActive: SharedValue<boolean>;
  activationAnimationProgress: SharedValue<number>;
  baseStyle: AnimatedStyleProp;
  layoutStyleValue: SharedValue<ViewStyle>;
  hidden?: boolean;
  entering?: LayoutAnimation;
  exiting?: LayoutAnimation;
  onLayout?: (event: LayoutChangeEvent) => void;
}>;

export default function ItemCell({
  activationAnimationProgress,
  baseStyle,
  children,
  entering,
  exiting,
  hidden,
  isActive,
  itemKey,
  layoutStyleValue,
  onLayout
}: ItemCellProps) {
  const { overriddenCellDimensions } = useCommonValuesContext();

  const decorationStyleValue = useItemDecoration(
    itemKey,
    isActive,
    activationAnimationProgress
  );

  const animatedCellStyle = useAnimatedStyle(() => ({
    ...decorationStyleValue.value,
    ...layoutStyleValue.value,
    transform: [
      ...((layoutStyleValue.value.transform ?? []) as TransformsArray),
      ...((decorationStyleValue.value.transform ?? []) as TransformsArray)
    ],
    ...(!IS_WEB && overriddenCellDimensions.value)
  }));

  let innerAnimatedStyle: AnimatedStyle<ViewStyle> | undefined;
  if (IS_WEB) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    innerAnimatedStyle = useAnimatedStyle(() => overriddenCellDimensions.value);
  }

  return (
    <Animated.View style={[baseStyle, styles.decoration, animatedCellStyle]}>
      <AnimatedOnLayoutView
        entering={entering}
        exiting={exiting}
        style={[
          styles.inner,
          innerAnimatedStyle,
          hidden && {
            left: isPaper() ? HIDDEN_X_OFFSET : undefined,
            opacity: 0
          }
        ]}
        onLayout={onLayout}>
        {children}
      </AnimatedOnLayoutView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  decoration: Platform.select<ViewStyle>({
    android: {},
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
  inner: Platform.select<ViewStyle>({
    default: {},
    web: { flex: 1 }
  })
});
