import { type ReactElement } from 'react';
import type { ViewStyle } from 'react-native';
import { useAnimatedStyle } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_FLEX_PROPS } from '../constants';
import { useDragEndHandler } from '../hooks';
import {
  FLEX_STRATEGIES,
  FlexLayoutProvider,
  OrderUpdaterComponent,
  SharedProvider,
  useCommonValuesContext,
  useFlexLayoutContext,
  useStrategyKey
} from '../providers';
import type { DropIndicatorSettings, SortableFlexProps } from '../types';
import { getPropsWithDefaults, orderItems, validateChildren } from '../utils';
import { DraggableView, SortableContainer } from './shared';

function SortableFlex(props: SortableFlexProps) {
  const {
    rest: { children, onDragEnd: _onDragEnd, strategy, ...styleProps },
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

  const childrenArray = validateChildren(children);
  const itemKeys = childrenArray.map(([key]) => key);

  const onDragEnd = useDragEndHandler(_onDragEnd, params => ({
    ...params,
    order<I>(data: Array<I>) {
      return orderItems(data, itemKeys, params, true);
    }
  }));

  return (
    <SharedProvider {...sharedProps} itemKeys={itemKeys} onDragEnd={onDragEnd}>
      <FlexLayoutProvider {...styleProps} itemsCount={itemKeys.length}>
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
          itemEntering={itemEntering}
          itemExiting={itemExiting}
          showDropIndicator={showDropIndicator}
          style={styleProps}
        />
      </FlexLayoutProvider>
    </SharedProvider>
  );
}

type SortableFlexInnerProps = {
  childrenArray: Array<[string, ReactElement]>;
  style: ViewStyle;
} & DropIndicatorSettings &
  Required<
    Pick<SortableFlexProps, 'animateHeight' | 'itemEntering' | 'itemExiting'>
  >;

function SortableFlexInner({
  childrenArray,
  itemEntering,
  itemExiting,
  style,
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
    <SortableContainer {...containerProps} style={[style, animatedFlexStyle]}>
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
