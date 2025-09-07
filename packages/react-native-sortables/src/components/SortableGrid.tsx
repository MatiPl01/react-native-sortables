import { useLayoutEffect, useMemo, useRef } from 'react';
import type { DimensionValue } from 'react-native';
import { StyleSheet } from 'react-native';
import { runOnUI, useAnimatedStyle } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_GRID_PROPS, IS_WEB } from '../constants';
import type { PropsWithDefaults } from '../hooks';
import { useDragEndHandler, usePropsWithDefaults } from '../hooks';
import { useAnimatableValue } from '../integrations/reanimated';
import {
  DataProvider,
  GRID_STRATEGIES,
  GridProvider,
  useGridLayoutContext,
  useMeasurementsContext,
  useOrderUpdater,
  useStrategyKey
} from '../providers';
import type { SortableGridProps } from '../types';
import { defaultKeyExtractor, error, orderItems, typedMemo } from '../utils';
import { SortableContainer } from './shared';

function SortableGrid<I>(props: SortableGridProps<I>) {
  const {
    columns,
    data,
    keyExtractor = defaultKeyExtractor,
    renderItem,
    rowHeight,
    rows,
    strategy,
    ...rest
  } = usePropsWithDefaults(props, DEFAULT_SORTABLE_GRID_PROPS);

  const isVertical = rows === undefined;
  const groups = rows ?? columns;

  if (!isVertical && !rowHeight) {
    throw error('rowHeight is required for horizontal Sortable.Grid');
  }
  if (columns !== undefined && columns < 1) {
    throw error('columns must be greater than 0');
  }
  if (rows !== undefined && rows < 1) {
    throw error('rows must be greater than 0');
  }

  const items = useMemo<Array<[string, I]>>(
    () => data.map(item => [keyExtractor(item), item]),
    [data, keyExtractor]
  );

  return (
    <DataProvider items={items}>
      <SortableGridInner
        {...rest}
        data={data}
        groups={groups}
        isVertical={isVertical}
        items={items}
        key={useStrategyKey(strategy)}
        renderItem={renderItem}
        rowHeight={rowHeight} // must be specified for horizontal grids
        strategy={strategy}
      />
    </DataProvider>
  );
}

type SortableGridInnerProps<I> = PropsWithDefaults<
  Omit<SortableGridProps<I>, 'columns' | 'keyExtractor'>,
  typeof DEFAULT_SORTABLE_GRID_PROPS
> & {
  items: Array<[string, I]>;
  groups: number;
  isVertical: boolean;
};

const SortableGridInner = typedMemo(function SortableGridInner<I>({
  columnGap: _columnGap,
  data,
  dimensionsAnimationType,
  DropIndicatorComponent,
  dropIndicatorStyle,
  groups,
  isVertical,
  itemEntering,
  itemExiting,
  items,
  onDragEnd: _onDragEnd,
  overflow,
  renderItem,
  rowGap: _rowGap,
  rowHeight = 0,
  showDropIndicator,
  strategy,
  ...rest
}: SortableGridInnerProps<I>) {
  const { handleContainerMeasurement, resetMeasurements } =
    useMeasurementsContext();
  const { mainGroupSize } = useGridLayoutContext();
  const isFirstRenderRef = useRef(true);

  const columnGap = useAnimatableValue(_columnGap);
  const rowGap = useAnimatableValue(_rowGap);

  useOrderUpdater(strategy, GRID_STRATEGIES);

  useLayoutEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    resetMeasurements();
  }, [groups, resetMeasurements]);

  const controlledContainerDimensions = useMemo(
    () => ({
      height: isVertical, // height is controlled for vertical grids
      width: !isVertical // width is controlled for horizontal grids
    }),
    [isVertical]
  );
  const controlledItemDimensions = useMemo(
    () => ({
      height: !isVertical, // height is controlled for horizontal grids
      width: isVertical // width is controlled for vertical grids
    }),
    [isVertical]
  );

  const onDragEnd = useDragEndHandler(_onDragEnd, {
    data: params => orderItems(data, items, params, true)
  });

  const animatedInnerStyle = useAnimatedStyle(() =>
    isVertical
      ? {
          columnGap: IS_WEB ? columnGap.value : 0,
          flexDirection: 'row',
          marginHorizontal: IS_WEB ? 0 : -columnGap.value / 2,
          rowGap: rowGap.value
        }
      : {
          columnGap: columnGap.value,
          flexDirection: 'column',
          height: groups * (rowHeight + rowGap.value) - rowGap.value,
          rowGap: rowGap.value
        }
  );

  const animatedItemStyle = useAnimatedStyle(() =>
    isVertical
      ? IS_WEB
        ? {
            width:
              `calc((100% - ${columnGap.value * (groups - 1)}px) / ${groups})` as DimensionValue
          }
        : {
            flexBasis: mainGroupSize.value ? undefined : `${100 / groups}%`,
            paddingHorizontal: columnGap.value / 2,
            width: mainGroupSize.value
              ? mainGroupSize.value + columnGap.value
              : undefined
          }
      : { height: rowHeight }
  );

  const itemStyle = useMemo(
    () => [animatedItemStyle, !isVertical && styles.horizontalStyleOverride],
    [animatedItemStyle, isVertical]
  );

  return (
    <GridProvider
      {...rest}
      columnGap={columnGap}
      controlledContainerDimensions={controlledContainerDimensions}
      controlledItemDimensions={controlledItemDimensions}
      isVertical={isVertical}
      numGroups={groups}
      rowGap={rowGap}
      strategy={strategy}
      onDragEnd={onDragEnd}>
      <SortableContainer
        containerStyle={[styles.gridContainer, animatedInnerStyle]}
        dimensionsAnimationType={dimensionsAnimationType}
        DropIndicatorComponent={DropIndicatorComponent}
        dropIndicatorStyle={dropIndicatorStyle}
        itemEntering={itemEntering}
        itemExiting={itemExiting}
        itemStyle={itemStyle}
        overflow={overflow}
        showDropIndicator={showDropIndicator}
        onLayout={runOnUI((w, h) => {
          handleContainerMeasurement(
            w - (isVertical && !IS_WEB ? columnGap.value : 0),
            h
          );
        })}
      />
    </GridProvider>
  );
});

const styles = StyleSheet.create({
  gridContainer: {
    flexWrap: 'wrap'
  },
  horizontalStyleOverride: {
    // This is needed to properly adjust the wrapper size to the item width
    alignSelf: 'flex-start'
  }
});

export default typedMemo(SortableGrid);
