import type { PropsWithChildren } from 'react';
import {
  Dimensions,
  type StyleProp,
  StyleSheet,
  type ViewStyle
} from 'react-native';
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';

import { EMPTY_OBJECT, IS_WEB } from '../../constants';
import { DebugOutletProvider } from '../../debug';
import {
  MultiZoneOutlet,
  useCommonValuesContext,
  useMeasurementsContext,
  useMultiZoneContext
} from '../../providers';
import type {
  DimensionsAnimation,
  DropIndicatorSettings,
  Overflow
} from '../../types';
import AnimatedOnLayoutView from './AnimatedOnLayoutView';
import DropIndicator from './DropIndicator';

const SCREEN_DIMENSIONS = Dimensions.get('screen');

type AnimatedHeightContainerProps = PropsWithChildren<
  DropIndicatorSettings & {
    dimensionsAnimationType: DimensionsAnimation;
    overflow: Overflow;
    debug?: boolean;
    style?: StyleProp<ViewStyle>;
  }
>;

export default function SortableContainer({
  children,
  debug,
  dimensionsAnimationType,
  DropIndicatorComponent,
  dropIndicatorStyle,
  overflow,
  showDropIndicator,
  style
}: AnimatedHeightContainerProps) {
  const {
    activeItemDropped,
    activeItemKey,
    containerHeight,
    containerRef,
    containerWidth,
    controlledContainerDimensions,
    shouldAnimateLayout,
    usesAbsoluteLayout
  } = useCommonValuesContext();
  const { handleHelperContainerMeasurement } = useMeasurementsContext();
  const multiZoneContext = useMultiZoneContext();

  const animateWorklet = dimensionsAnimationType === 'worklet';
  const animateLayout = dimensionsAnimationType === 'layout';

  const outerContainerStyle = useAnimatedStyle(() => {
    if (!usesAbsoluteLayout.value) {
      return EMPTY_OBJECT;
    }

    const maybeAnimate = (value: null | number, animate: boolean) =>
      animate && shouldAnimateLayout.value && value !== null
        ? withTiming(value)
        : value;

    const ctrl = controlledContainerDimensions.value;

    return {
      height: maybeAnimate(
        ctrl.height ? containerHeight.value : null,
        animateWorklet
      ),
      overflow:
        activeItemKey.value !== null || !activeItemDropped.value
          ? 'visible'
          : overflow,
      width: maybeAnimate(
        ctrl.width ? containerWidth.value : null,
        animateWorklet
      )
    };
  }, [dimensionsAnimationType]);

  const innerContainerStyle = useAnimatedStyle(() => {
    if (!usesAbsoluteLayout.value) {
      return EMPTY_OBJECT;
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
    const height = ctrl.height ? containerHeight.value : undefined;
    const width = ctrl.width ? containerWidth.value : undefined;

    if (!height && !width) {
      return EMPTY_OBJECT;
    }

    return { height, width };
  });

  return (
    <Animated.View
      layout={animateLayout ? LinearTransition : undefined}
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
        {multiZoneContext && <MultiZoneOutlet />}
        {debug && <DebugOutletProvider />}
      </Animated.View>
      {/* Renders an overlay view helpful for debugging */}
    </Animated.View>
  );
}
