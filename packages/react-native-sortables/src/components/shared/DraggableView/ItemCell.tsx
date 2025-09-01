import type { PropsWithChildren } from 'react';
import { type LayoutChangeEvent, StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

import { HIDDEN_X_OFFSET } from '../../../constants';
import type {
  AnimatedStyleProp,
  LayoutAnimation
} from '../../../integrations/reanimated';
import { useItemDecorationStyles } from '../../../providers';
import AnimatedOnLayoutView from '../AnimatedOnLayoutView';

export type ItemCellProps = PropsWithChildren<{
  itemKey: string;
  isActive: SharedValue<boolean>;
  activationAnimationProgress: SharedValue<number>;
  innerCellStyle: AnimatedStyleProp;
  cellStyle: AnimatedStyleProp;
  hidden?: boolean;
  entering?: LayoutAnimation;
  exiting?: LayoutAnimation;
  onLayout?: (event: LayoutChangeEvent) => void;
}>;

export default function ItemCell({
  activationAnimationProgress,
  cellStyle,
  children,
  entering,
  exiting,
  hidden,
  innerCellStyle,
  isActive,
  itemKey,
  onLayout
}: ItemCellProps) {
  const decorationStyles = useItemDecorationStyles(
    itemKey,
    isActive,
    activationAnimationProgress
  );

  return (
    <Animated.View style={cellStyle}>
      <AnimatedOnLayoutView
        entering={entering}
        exiting={exiting}
        style={[decorationStyles, innerCellStyle, hidden && styles.hidden]}
        onLayout={onLayout}>
        {children}
      </AnimatedOnLayoutView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    // We change the x position to hide items when teleported (we can't use
    // non-layout props like opacity as they are sometimes not updated via
    // Reanimated on the Old Architecture; we also can't use any props that
    // affect item dimensions, etc., so the safest way is to put the item
    // far away from the viewport to hide it)
    left: HIDDEN_X_OFFSET
  }
});
