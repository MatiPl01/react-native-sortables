import { type ReactElement } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_FLEX_PROPS } from '../constants';
import { useDragEndHandler } from '../hooks';
import {
  FLEX_STRATEGIES,
  FlexLayoutProvider,
  LayerProvider,
  OrderUpdaterComponent,
  SharedProvider,
  useCommonValuesContext,
  useFlexLayoutContext,
  useStrategyKey
} from '../providers';
import type {
  Dimensions,
  DropIndicatorSettings,
  SortableFlexProps
} from '../types';
import {
  extractFlexContainerProps,
  getPropsWithDefaults,
  orderItems,
  validateChildren
} from '../utils';
import { DraggableView, SortableContainer } from './shared';

function SortableFlex(props: SortableFlexProps) {
  const {
    rest: {
      children,
      onDragEnd: _onDragEnd,
      onLayout,
      strategy,
      style,
      ...viewProps
    },
    sharedProps: {
      DropIndicatorComponent,
      animateHeight,
      dropIndicatorStyle,
      itemEntering,
      itemExiting,

      showDropIndicator,
      ...sharedProps
    }
  } = getPropsWithDefaults(props, DEFAULT_SORTABLE_FLEX_PROPS);

  const parentDimensions = useSharedValue<Dimensions | null>(null);

  const childrenArray = validateChildren(children);
  const itemKeys = childrenArray.map(([key]) => key);

  const onDragEnd = useDragEndHandler(_onDragEnd, params => ({
    ...params,
    order<I>(data: Array<I>) {
      return orderItems(data, itemKeys, params, true);
    }
  }));

  const [flexStyle, restStyle] = extractFlexContainerProps(style);

  return (
    <LayerProvider>
      <View
        {...viewProps}
        style={restStyle}
        onLayout={event => {
          onLayout?.(event);
          const layout = event.nativeEvent.layout;
          parentDimensions.value = {
            height: layout.height,
            width: layout.width
          };
        }}>
        <SharedProvider
          {...sharedProps}
          itemKeys={itemKeys}
          onDragEnd={onDragEnd}>
          <FlexLayoutProvider itemsCount={itemKeys.length} style={style}>
            <OrderUpdaterComponent
              key={useStrategyKey(strategy)}
              predefinedStrategies={FLEX_STRATEGIES}
              strategy={strategy}
              useAdditionalValues={useFlexLayoutContext}
            />
            <SortableFlexInner
              animateHeight={animateHeight}
              childrenArray={childrenArray}
              DropIndicatorComponent={DropIndicatorComponent}
              dropIndicatorStyle={dropIndicatorStyle}
              flexStyle={flexStyle}
              itemEntering={itemEntering}
              itemExiting={itemExiting}
              showDropIndicator={showDropIndicator}
            />
          </FlexLayoutProvider>
        </SharedProvider>
      </View>
    </LayerProvider>
  );
}

type SortableFlexInnerProps = {
  childrenArray: Array<[string, ReactElement]>;
  flexStyle: ViewStyle;
} & DropIndicatorSettings &
  Required<
    Pick<SortableFlexProps, 'animateHeight' | 'itemEntering' | 'itemExiting'>
  >;

function SortableFlexInner({
  childrenArray,
  flexStyle,
  itemEntering,
  itemExiting,
  ...containerProps
}: SortableFlexInnerProps) {
  const { canSwitchToAbsoluteLayout } = useCommonValuesContext();
  const { flexDirection } = useFlexLayoutContext();

  const animatedFlexStyle = useAnimatedStyle(() =>
    canSwitchToAbsoluteLayout.value
      ? {
          alignContent: 'flex-start',
          alignItems: 'flex-start',
          justifyContent: 'flex-start'
        }
      : {}
  );

  return (
    <SortableContainer
      {...containerProps}
      innerStyle={[flexStyle, animatedFlexStyle]}>
      {childrenArray.map(([key, child]) => (
        <DraggableView
          entering={itemEntering}
          exiting={itemExiting}
          itemKey={key}
          key={key}
          // When flexDirection is row-reverse, we need to reverse the x-axis
          // because right offset in absolute position is calculated from the right edge
          reverseXAxis={flexDirection === 'row-reverse'}>
          {child}
        </DraggableView>
      ))}
    </SortableContainer>
  );
}

export default SortableFlex;
