import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';

import { EMPTY_OBJECT, IS_WEB } from '../../constants';
import { DebugOutlet } from '../../debug';
import type { AnimatedStyleProp } from '../../integrations/reanimated';
import { DataOutlet, useCommonValuesContext } from '../../providers';
import type {
  DimensionsAnimation,
  DropIndicatorSettings,
  Overflow
} from '../../types';
import type { DraggableViewProps } from '..';
import AnimatedOnLayoutView from './AnimatedOnLayoutView';
import DropIndicator from './DropIndicator';

export type SortableContainerProps = DropIndicatorSettings &
  Pick<DraggableViewProps, 'itemEntering' | 'itemExiting'> & {
    dimensionsAnimationType: DimensionsAnimation;
    overflow: Overflow;
    itemStyle?: AnimatedStyleProp;
    debug?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
    onLayout: (width: number, height: number) => void;
  };

export default function SortableContainer({
  containerStyle,
  debug,
  dimensionsAnimationType,
  DropIndicatorComponent,
  dropIndicatorStyle,
  itemEntering,
  itemExiting,
  itemStyle,
  onLayout,
  overflow,
  showDropIndicator
}: SortableContainerProps) {
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
  });

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
      {/* Drop indicator */}
      {showDropIndicator && (
        <DropIndicator
          DropIndicatorComponent={DropIndicatorComponent}
          style={dropIndicatorStyle}
        />
      )}

      {/* Sortable component data */}
      <AnimatedOnLayoutView
        ref={containerRef}
        style={[containerStyle, innerContainerStyle]}
        onLayout={({ nativeEvent: { layout } }) => {
          onLayout(layout.width, layout.height);
        }}>
        <DataOutlet
          itemEntering={itemEntering}
          itemExiting={itemExiting}
          itemStyle={itemStyle}
        />
      </AnimatedOnLayoutView>

      {/* Debug overlay */}
      {debug && <DebugOutlet />}
    </Animated.View>
  );
}
