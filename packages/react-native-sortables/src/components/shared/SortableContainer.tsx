import type { PropsWithChildren } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';

import { IS_WEB } from '../../constants';
import { DebugOutlet } from '../../debug';
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
  showDropIndicator,
  style
}: AnimatedHeightContainerProps) {
  const {
    activeItemDropped,
    activeItemKey,
    canSwitchToAbsoluteLayout,
    containerHeight,
    shouldAnimateLayout
  } = useCommonValuesContext();

  const outerContainerStyle = useAnimatedStyle(() => {
    if (!canSwitchToAbsoluteLayout.value) {
      return {};
    }
    return {
      height:
        animateHeight &&
        (!IS_WEB || shouldAnimateLayout.value) &&
        containerHeight.value !== null
          ? withTiming(containerHeight.value)
          : containerHeight.value,
      overflow:
        activeItemKey.value !== null || !activeItemDropped.value
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
    <Animated.View
      // @ts-expect-error - contain is a correct CSS prop on web
      style={[outerContainerStyle, IS_WEB && { contain: 'layout' }]}>
      {showDropIndicator && (
        <DropIndicator
          DropIndicatorComponent={DropIndicatorComponent}
          style={dropIndicatorStyle}
        />
      )}
      <Animated.View style={[style, innerContainerStyle]}>
        {children}
      </Animated.View>
      {/* Renders an overlay view helpful for debugging */}
      <DebugOutlet />
    </Animated.View>
  );
}
