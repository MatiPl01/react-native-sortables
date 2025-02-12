import type { PropsWithChildren } from 'react';
import { Dimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';

import { IS_WEB } from '../../constants';
import { DebugOutlet } from '../../debug';
import { useCommonValuesContext } from '../../providers';
import type { DropIndicatorSettings } from '../../types';
import DropIndicator from './DropIndicator';

const SCREEN_DIMENSIONS = Dimensions.get('screen');

type AnimatedHeightContainerProps = PropsWithChildren<
  {
    animateContainerDimensions: boolean;
    style?: StyleProp<ViewStyle>;
  } & DropIndicatorSettings
>;

export default function SortableContainer({
  DropIndicatorComponent,
  animateContainerDimensions,
  children,
  dropIndicatorStyle,
  showDropIndicator,
  style
}: AnimatedHeightContainerProps) {
  const {
    activeItemDropped,
    activeItemKey,
    appliedContainerDimensions,
    canSwitchToAbsoluteLayout,
    shouldAnimateLayout
  } = useCommonValuesContext();

  const outerContainerStyle = useAnimatedStyle(() => {
    if (!canSwitchToAbsoluteLayout.value || !appliedContainerDimensions.value) {
      return {};
    }

    const maybeAnimate = (value: number | undefined) =>
      animateContainerDimensions &&
      (!IS_WEB || shouldAnimateLayout.value) &&
      value !== undefined
        ? withTiming(value)
        : value;

    const height = maybeAnimate(appliedContainerDimensions.value.height);
    const width = maybeAnimate(appliedContainerDimensions.value.width);
    const overflow =
      activeItemKey.value !== null || !activeItemDropped.value
        ? 'visible'
        : 'hidden';

    return { height, overflow, width };
  }, [animateContainerDimensions]);

  const innerContainerStyle = useAnimatedStyle(() => {
    if (!canSwitchToAbsoluteLayout.value || !appliedContainerDimensions.value) {
      return {};
    }

    const minHeight =
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      appliedContainerDimensions.value.height || SCREEN_DIMENSIONS.height;
    const minWidth =
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      appliedContainerDimensions.value.width || SCREEN_DIMENSIONS.width;

    return {
      minHeight,
      minWidth
    };
  });

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
