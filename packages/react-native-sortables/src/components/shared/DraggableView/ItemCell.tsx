import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, type ViewStyle } from 'react-native';
import type { SharedValue, TransformArrayItem } from 'react-native-reanimated';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { HIDDEN_X_OFFSET } from '../../../constants';
import type {
  AnimatedStyleProp,
  LayoutAnimation
} from '../../../integrations/reanimated';
import { useCommonValuesContext, useItemDecoration } from '../../../providers';
import { componentWithRef } from '../../../utils/react';

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
}>;

const ItemCell = componentWithRef<Animated.View, ItemCellProps>(
  function ItemCell(
    {
      activationAnimationProgress,
      baseStyle,
      children,
      entering,
      exiting,
      hidden,
      isActive,
      itemKey,
      layoutStyleValue
    },
    ref
  ) {
    const { controlledItemDimensionsStyle } = useCommonValuesContext();

    const decorationStyleValue = useItemDecoration(
      itemKey,
      isActive,
      activationAnimationProgress
    );

    const animatedStyle = useAnimatedStyle(() => ({
      ...decorationStyleValue.value,
      ...layoutStyleValue.value,
      transform: [
        ...((layoutStyleValue.value.transform ?? []) as TransformsArray),
        ...((decorationStyleValue.value.transform ?? []) as TransformsArray)
      ]
    }));

    return (
      <Animated.View style={[baseStyle, styles.decoration, animatedStyle]}>
        <Animated.View
          entering={entering}
          exiting={exiting}
          ref={ref}
          style={[controlledItemDimensionsStyle, hidden && styles.hidden]}>
          {children}
        </Animated.View>
      </Animated.View>
    );
  }
);

export default ItemCell;

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
  hidden: {
    // We change the x position to hide items when teleported (we can't use
    // non-layout props like opacity as they are sometimes not updated via
    // Reanimated on the Old Architecture; we also can't use any props that
    // affect item dimensions, etc., so the safest way is to put the item
    // far away from the viewport to hide it)
    left: HIDDEN_X_OFFSET
  }
});
