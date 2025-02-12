import { type ReactElement } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_FLEX_PROPS } from '../constants';
import { useDragEndHandler } from '../hooks';
import {
  FLEX_STRATEGIES,
  FlexLayoutProvider,
  OrderUpdaterComponent,
  SharedProvider,
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
      animateContainerDimensions,
      dropIndicatorStyle,
      itemEntering,
      itemExiting,
      itemLayout,
      showDropIndicator,
      ...sharedProps
    }
  } = getPropsWithDefaults(props, DEFAULT_SORTABLE_FLEX_PROPS);

  const childrenArray = validateChildren(children);
  const itemKeys = childrenArray.map(([key]) => key);

  const { flexDirection, flexWrap } = styleProps;
  const controlledContainerDimensions = useDerivedValue(() => {
    if (flexWrap === 'nowrap') {
      return { height: true, width: true };
    }
    return flexDirection === 'row'
      ? { height: true, width: false }
      : { height: false, width: true };
  }, [flexWrap, flexDirection]);

  const onDragEnd = useDragEndHandler(_onDragEnd, params => ({
    ...params,
    order<I>(data: Array<I>) {
      return orderItems(data, itemKeys, params, true);
    }
  }));

  return (
    <SharedProvider
      {...sharedProps}
      controlledContainerDimensions={controlledContainerDimensions}
      initialItemsStyleOverride={styles.styleOverride}
      itemKeys={itemKeys}
      onDragEnd={onDragEnd}>
      <FlexLayoutProvider {...styleProps} itemsCount={itemKeys.length}>
        <OrderUpdaterComponent
          key={useStrategyKey(strategy)}
          predefinedStrategies={FLEX_STRATEGIES}
          strategy={strategy}
          useAdditionalValues={useFlexLayoutContext}
        />
        <SortableFlexInner
          animateContainerDimensions={animateContainerDimensions}
          childrenArray={childrenArray}
          DropIndicatorComponent={DropIndicatorComponent}
          dropIndicatorStyle={dropIndicatorStyle}
          itemEntering={itemEntering}
          itemExiting={itemExiting}
          itemLayout={itemLayout}
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
    Pick<
      SortableFlexProps,
      | 'animateContainerDimensions'
      | 'itemEntering'
      | 'itemExiting'
      | 'itemLayout'
    >
  >;

function SortableFlexInner({
  childrenArray,
  itemEntering,
  itemExiting,
  itemLayout,
  style,
  ...containerProps
}: SortableFlexInnerProps) {
  return (
    <SortableContainer {...containerProps} style={style}>
      {childrenArray.map(([key, child]) => (
        <DraggableView
          entering={itemEntering}
          exiting={itemExiting}
          itemKey={key}
          key={key}
          layout={itemLayout}>
          {child}
        </DraggableView>
      ))}
    </SortableContainer>
  );
}

const styles = StyleSheet.create({
  styleOverride: {
    // This is needed to prevent items from stretching (which is default behavior)
    alignSelf: 'flex-start'
  }
});

export default SortableFlex;
