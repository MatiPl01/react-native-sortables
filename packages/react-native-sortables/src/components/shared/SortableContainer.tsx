import type { PropsWithChildren } from 'react';
import {
  Dimensions,
  type StyleProp,
  StyleSheet,
  type ViewStyle
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';

import { IS_WEB } from '../../constants';
import { DebugOutlet } from '../../debug';
import {
  useCommonValuesContext,
  useMeasurementsContext
} from '../../providers';
import type { DropIndicatorSettings } from '../../types';
import AnimatedOnLayoutView from './AnimatedOnLayoutView';
import DropIndicator from './DropIndicator';

const SCREEN_DIMENSIONS = Dimensions.get('screen');

type AnimatedHeightContainerProps = PropsWithChildren<
  {
    animateHeight: boolean;
    animateWidth: boolean;
    style?: StyleProp<ViewStyle>;
  } & DropIndicatorSettings
>;

export default function SortableContainer({
  DropIndicatorComponent,
  animateHeight,
  animateWidth,
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
    containerRef,
    containerWidth,
    controlledContainerDimensions,
    shouldAnimateLayout
  } = useCommonValuesContext();
  const { handleHelperContainerMeasurement } = useMeasurementsContext();

  const outerContainerStyle = useAnimatedStyle(() => {
    if (!canSwitchToAbsoluteLayout.value) {
      return {};
    }

    const maybeAnimate = (value: null | number, animate: boolean) =>
      animate && (!IS_WEB || shouldAnimateLayout.value) && value !== null
        ? withTiming(value)
        : value;

    const ctrl = controlledContainerDimensions.value;

    const height = maybeAnimate(
      ctrl.height ? containerHeight.value : null,
      animateHeight
    );
    const width = maybeAnimate(
      ctrl.width ? containerWidth.value : null,
      animateWidth
    );
    const overflow =
      activeItemKey.value !== null || !activeItemDropped.value
        ? 'visible'
        : 'hidden';

    return { height, overflow, width };
  }, [animateHeight, animateWidth]);

  const innerContainerStyle = useAnimatedStyle(() => {
    if (!canSwitchToAbsoluteLayout.value) {
      return {};
    }

    const minHeight =
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      containerHeight.value || SCREEN_DIMENSIONS.height;
    const minWidth =
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      containerWidth.value || SCREEN_DIMENSIONS.width;

    return {
      minHeight,
      minWidth
    };
  });

  const animatedMeasurementsContainerStyle = useAnimatedStyle(() => {
    const ctrl = controlledContainerDimensions.value;

    return {
      minHeight: ctrl.height ? containerHeight.value : undefined,
      minWidth: ctrl.width ? containerWidth.value : undefined
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
      <AnimatedOnLayoutView
        ref={containerRef}
        style={[StyleSheet.absoluteFill, animatedMeasurementsContainerStyle]}
        onLayout={handleHelperContainerMeasurement}
      />
      <Animated.View style={[style, innerContainerStyle]}>
        {children}
      </Animated.View>
      {/* Renders an overlay view helpful for debugging */}
      <DebugOutlet />
    </Animated.View>
  );
}
