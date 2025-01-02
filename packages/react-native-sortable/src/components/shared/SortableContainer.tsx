import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';

import { useCommonValuesContext } from '../../providers';
import type { DropIndicatorSettings } from '../../types';
import DropIndicator from './DropIndicator';

type AnimatedHeightContainerProps = PropsWithChildren<
  {
    animateHeight: boolean;
    style?: StyleProp<ViewStyle>;
  } & DropIndicatorSettings
>;

export default function SortableContainer({
  DropIndicatorComponent,
  animateHeight,
  children,
  dropIndicatorStyle,
  style,
  showDropIndicator
}: AnimatedHeightContainerProps) {
  const {
    activeItemDropped,
    canSwitchToAbsoluteLayout,
    containerHeight,
    touchedItemKey
  } = useCommonValuesContext();

  const outerContainerStyle = useAnimatedStyle(() => {
    if (!canSwitchToAbsoluteLayout.value) {
      return {};
    }
    return {
      height: animateHeight
        ? withTiming(containerHeight.value)
        : containerHeight.value,
      overflow:
        touchedItemKey.value !== null || !activeItemDropped.value
          ? 'visible'
          : 'hidden',
      width: '100%'
    };
  }, [animateHeight]);

  const innerContainerStyle = useAnimatedStyle(() =>
    canSwitchToAbsoluteLayout.value
      ? {
          minHeight: containerHeight.value === 0 ? 9999 : containerHeight.value
        }
      : {}
  );

  return (
    <Animated.View style={[outerContainerStyle, styles.grow]}>
      {showDropIndicator && (
        <DropIndicator
          DropIndicatorComponent={DropIndicatorComponent}
          style={dropIndicatorStyle}
        />
      )}
      <Animated.View style={[style, innerContainerStyle, styles.grow]}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  grow: {
    flexGrow: 1
  }
});
