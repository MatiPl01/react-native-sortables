import { memo, useSyncExternalStore } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';

import { EMPTY_OBJECT, IS_WEB } from '../../constants';
import { DebugOutlet } from '../../debug';
import type { AnimatedStyleProp } from '../../integrations/reanimated';
import { useCommonValuesContext, useItemsContext } from '../../providers';
import type {
  DimensionsAnimation,
  DropIndicatorSettings,
  Overflow
} from '../../types';
import AnimatedOnLayoutView from './AnimatedOnLayoutView';
import type { DraggableViewProps } from './DraggableView';
import { DraggableView } from './DraggableView';
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
      style={[
        outerContainerStyle,
        !controlledContainerDimensions.width && { minWidth: '100%' },
        // @ts-expect-error - contain is a correct CSS prop on web
        IS_WEB && { contain: 'layout' }
      ]}>
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
        <ItemsOutlet
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

type ItemsOutletProps = Pick<
  DraggableViewProps,
  'itemEntering' | 'itemExiting'
> & {
  itemStyle?: AnimatedStyleProp;
};

const ItemsOutlet = memo(function ItemsOutlet({
  itemStyle,
  ...rest
}: ItemsOutletProps) {
  const { getKeys, subscribeKeys } = useItemsContext();

  // Re-render the list of cells only if the keys array changes
  const keys = useSyncExternalStore(
    subscribeKeys,
    getKeys,
    getKeys // SSR fallback
  );

  return keys.map(key => (
    <DraggableView {...rest} itemKey={key} key={key} style={itemStyle} />
  ));
});
