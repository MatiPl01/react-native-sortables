import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

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
import { type DraggableViewProps } from './shared';

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
      rows,
      strategy
    },
    sharedProps: {
      DropIndicatorComponent,
      animateHeight,
      animateWidth,
      dropIndicatorStyle,
      itemEntering,
      itemExiting,
      itemsLayout,
      reorderTriggerOrigin,
      showDropIndicator,
      ...sharedProps
    }
  } = getPropsWithDefaults(props, DEFAULT_SORTABLE_GRID_PROPS);

  const isVertical = rows === undefined;
  const groups = rows ?? columns;

  // this allows changing the number of columns/rows while developing
  // code with no necessity to reload the app
  // (state of the grid must be reset when this param changes)
  const key = (groups << 1) | (isVertical ? 1 : 0);

  const columnGapValue = useAnimatableValue(columnGap);
  const rowGapValue = useAnimatableValue(rowGap);
  const controlledContainerDimensions = useDerivedValue(() => ({
    height: isVertical, // height is controlled for vertical grids
    width: !isVertical // width is controlled for horizontal grids
  }));

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
      key={key}
      onDragEnd={onDragEnd}>
      <GridLayoutProvider
        columnGap={columnGapValue}
        isVertical={isVertical}
        numGroups={groups}
        numItems={data.length}
        rowGap={rowGapValue}>
        <OrderUpdaterComponent
          key={useStrategyKey(strategy)}
          predefinedStrategies={GRID_STRATEGIES}
          strategy={strategy}
          triggerOrigin={reorderTriggerOrigin}
          useAdditionalValues={useGridLayoutContext}
        />
        <SortableGridInner
          animateHeight={animateHeight}
          animateWidth={animateWidth}
          columnGap={columnGapValue}
          data={data}
          DropIndicatorComponent={DropIndicatorComponent}
          dropIndicatorStyle={dropIndicatorStyle}
          groups={groups}
          isVertical={isVertical}
          itemEntering={itemEntering}
          itemExiting={itemExiting}
          itemKeys={itemKeys}
          itemsLayout={itemsLayout}
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
  groups: number;
  isVertical: boolean;
} & DropIndicatorSettings &
  Required<
    Pick<
      SortableGridProps<I>,
      | 'animateHeight'
      | 'animateWidth'
      | 'data'
      | 'itemEntering'
      | 'itemExiting'
      | 'itemsLayout'
      | 'renderItem'
    >
  >;

function SortableGridInner<I>({
  columnGap,
  data,
  groups,
  isVertical,
  itemEntering,
  itemExiting,
  itemKeys,
  itemsLayout,
  renderItem,
  rowGap,
  ...containerProps
}: SortableGridInnerProps<I>) {
  const animatedInnerStyle = useAnimatedStyle(() => ({
    flexDirection: isVertical ? 'row' : 'column',
    marginHorizontal: -columnGap.value / 2,
    marginVertical: -rowGap.value / 2
  }));

  const animatedItemStyle = useAnimatedStyle(() => ({
    flexBasis: `${100 / groups}%`,
    paddingHorizontal: columnGap.value / 2,
    paddingVertical: rowGap.value / 2
  }));

  return (
    <SortableContainer
      {...containerProps}
      style={[styles.gridContainer, animatedInnerStyle]}>
      {zipArrays(data, itemKeys).map(([item, key], index) => (
        <SortableGridItem
          entering={itemEntering ?? undefined}
          exiting={itemExiting ?? undefined}
          index={index}
          item={item}
          itemKey={key}
          key={key}
          layout={itemsLayout ?? undefined}
          renderItem={renderItem}
          style={animatedItemStyle}
        />
      ))}
    </SortableContainer>
  );
}

type SortableGridItemProps<I> = {
  index: number;
  item: I;
  renderItem: SortableGridRenderItem<I>;
} & DraggableViewProps;

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
    flexWrap: 'wrap'
  }
});

export default typedMemo(SortableGrid);
