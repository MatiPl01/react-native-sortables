import { useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_GRID_PROPS } from '../constants';
import { useAnimatableValue, useDragEndHandler } from '../hooks';
import {
  GRID_STRATEGIES,
  GridLayoutProvider,
  OrderUpdaterComponent,
  SharedProvider,
  useGridLayoutContext,
  useStrategyKey
} from '../providers';
import type {
  DropIndicatorSettings,
  LayoutAnimation,
  LayoutTransition,
  SortableGridProps,
  SortableGridRenderItem
} from '../types';
import {
  defaultKeyExtractor,
  getPropsWithDefaults,
  orderItems,
  typedMemo,
  zipArrays
} from '../utils';
import { DraggableView, SortableContainer } from './shared';

function SortableGrid<I>(props: SortableGridProps<I>) {
  const {
    rest: {
      columnGap,
      columns,
      data,
      keyExtractor = defaultKeyExtractor,
      onDragEnd: _onDragEnd,
      renderItem,
      rowGap,
      strategy
    },
    sharedProps: {
      DropIndicatorComponent,
      animateHeight,
      animateWidth,
      dropIndicatorStyle,
      itemEntering,
      itemExiting,
      itemLayout,
      showDropIndicator,
      ...sharedProps
    }
  } = getPropsWithDefaults(props, DEFAULT_SORTABLE_GRID_PROPS);

  const columnGapValue = useAnimatableValue(columnGap);
  const rowGapValue = useAnimatableValue(rowGap);
  const controlledContainerDimensions = useSharedValue({
    height: true,
    width: false
  });

  const itemKeys = useMemo(
    () => data.map((item, index) => keyExtractor(item, index)),
    [data, keyExtractor]
  );

  const onDragEnd = useDragEndHandler(_onDragEnd, params => ({
    ...params,
    data: orderItems(data, itemKeys, params, true)
  }));

  return (
    <SharedProvider
      {...sharedProps}
      controlledContainerDimensions={controlledContainerDimensions}
      itemKeys={itemKeys}
      key={columns}
      onDragEnd={onDragEnd}>
      <GridLayoutProvider
        columnGap={columnGapValue}
        columns={columns}
        itemsCount={data.length}
        rowGap={rowGapValue}>
        <OrderUpdaterComponent
          key={useStrategyKey(strategy)}
          predefinedStrategies={GRID_STRATEGIES}
          strategy={strategy}
          useAdditionalValues={useGridLayoutContext}
        />
        <SortableGridInner
          animateHeight={animateHeight}
          animateWidth={animateWidth}
          columnGap={columnGapValue}
          columns={columns}
          data={data}
          DropIndicatorComponent={DropIndicatorComponent}
          dropIndicatorStyle={dropIndicatorStyle}
          itemEntering={itemEntering}
          itemExiting={itemExiting}
          itemKeys={itemKeys}
          itemLayout={itemLayout}
          renderItem={renderItem}
          rowGap={rowGapValue}
          showDropIndicator={showDropIndicator}
        />
      </GridLayoutProvider>
    </SharedProvider>
  );
}

type SortableGridInnerProps<I> = {
  itemKeys: Array<string>;
  rowGap: SharedValue<number>;
  columnGap: SharedValue<number>;
} & DropIndicatorSettings &
  Required<
    Pick<
      SortableGridProps<I>,
      | 'animateHeight'
      | 'animateWidth'
      | 'columns'
      | 'data'
      | 'itemEntering'
      | 'itemExiting'
      | 'itemLayout'
      | 'renderItem'
    >
  >;

function SortableGridInner<I>({
  columnGap,
  columns,
  data,
  itemEntering,
  itemExiting,
  itemKeys,
  itemLayout,
  renderItem,
  rowGap,
  ...containerProps
}: SortableGridInnerProps<I>) {
  const animatedInnerStyle = useAnimatedStyle(() => ({
    marginHorizontal: -columnGap.value / 2,
    marginVertical: -rowGap.value / 2
  }));

  const animatedItemStyle = useAnimatedStyle(() => ({
    flexBasis: `${100 / columns}%`,
    paddingHorizontal: columnGap.value / 2,
    paddingVertical: rowGap.value / 2
  }));

  return (
    <SortableContainer
      {...containerProps}
      style={[styles.gridContainer, animatedInnerStyle]}>
      {zipArrays(data, itemKeys).map(([item, key], index) => (
        <SortableGridItem
          entering={itemEntering}
          exiting={itemExiting}
          index={index}
          item={item}
          itemKey={key}
          key={key}
          layout={itemLayout}
          renderItem={renderItem}
          style={animatedItemStyle}
        />
      ))}
    </SortableContainer>
  );
}

type SortableGridItemProps<I> = {
  index: number;
  itemKey: string;
  item: I;
  renderItem: SortableGridRenderItem<I>;
  entering: LayoutAnimation;
  exiting: LayoutAnimation;
  layout: LayoutTransition;
  style: ViewStyle;
};

function SortableGridItem<I>({
  index,
  item,
  renderItem,
  ...rest
}: SortableGridItemProps<I>) {
  const children = useMemo(
    () => renderItem({ index, item }),
    [renderItem, index, item]
  );

  return <DraggableView {...rest}>{children}</DraggableView>;
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  }
});

export default typedMemo(SortableGrid);
