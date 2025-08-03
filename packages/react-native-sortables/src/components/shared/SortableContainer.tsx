import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';

import { EMPTY_OBJECT, IS_WEB } from '../../constants';
import { DebugOutlet } from '../../debug';
import { useCommonValuesContext } from '../../providers';
import type {
  DimensionsAnimation,
  DropIndicatorSettings,
  Overflow
} from '../../types';
import AnimatedOnLayoutView from './AnimatedOnLayoutView';
import DropIndicator from './DropIndicator';

type AnimatedHeightContainerProps = PropsWithChildren<
  DropIndicatorSettings & {
    dimensionsAnimationType: DimensionsAnimation;
    overflow: Overflow;
    onLayout: (width: number, height: number) => void;
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
  onLayout,
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

    return {
      height: maybeAnimate(
        controlledContainerDimensions.height ? containerHeight.value : null,
        animateWorklet
      ),
      overflow:
        activeItemKey.value !== null || !activeItemDropped.value
          ? 'visible'
          : overflow,
      width: maybeAnimate(
        controlledContainerDimensions.width ? containerWidth.value : null,
        animateWorklet
      )
    };
  }, [dimensionsAnimationType]);

  const innerContainerStyle = useAnimatedStyle(() => ({
    ...(controlledContainerDimensions.height &&
      containerHeight.value !== null && {
        height: containerHeight.value
      }),
    ...(controlledContainerDimensions.width &&
      containerWidth.value !== null && {
        width: containerWidth.value
      })
  }));

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
        style={[style, innerContainerStyle]}
        onLayout={({ nativeEvent: { layout } }) => {
          onLayout(layout.width, layout.height);
        }}>
        {children}
      </AnimatedOnLayoutView>
      {/* Renders an overlay view helpful for debugging */}
      {debug && <DebugOutlet />}
    </Animated.View>
  );
}
