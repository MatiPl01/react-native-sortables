import { useLayoutEffect, useMemo, useRef } from 'react';
import type { DimensionValue } from 'react-native';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { runOnUI, useAnimatedStyle } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_GRID_PROPS, IS_WEB } from '../constants';
import type { PropsWithDefaults } from '../hooks';
import { useDragEndHandler, usePropsWithDefaults } from '../hooks';
import { useAnimatableValue } from '../integrations/reanimated';
import {
  GRID_STRATEGIES,
  GridProvider,
  ItemsProvider,
  useGridLayoutContext,
  useMeasurementsContext,
  useOrderUpdater,
  useStrategyKey
} from '../providers';
import type { DragEndCallback, SortableGridProps } from '../types';
import { defaultKeyExtractor, error, orderItems, typedMemo } from '../utils';
import { SortableContainer } from './shared';

function SortableGrid<I>(props: SortableGridProps<I>) {
  const {
    columns,
    data,
    keyExtractor = defaultKeyExtractor,
    onDragEnd: _onDragEnd,
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

  const onDragEnd = useDragEndHandler(_onDragEnd, {
    data: params => orderItems(data, items, params, true)
  });

  return (
    <ItemsProvider items={items} renderItem={renderItem}>
      <SortableGridInner
        {...rest}
        groups={groups}
        isVertical={isVertical}
        key={useStrategyKey(strategy)}
        rowHeight={rowHeight} // must be specified for horizontal grids
        strategy={strategy}
        onDragEnd={onDragEnd}
      />
    </ItemsProvider>
  );
}

type SortableGridInnerProps<I> = PropsWithDefaults<
  Omit<
    SortableGridProps<I>,
    'columns' | 'data' | 'keyExtractor' | 'onDragEnd' | 'renderItem'
  >,
  typeof DEFAULT_SORTABLE_GRID_PROPS
> & {
  groups: number;
  isVertical: boolean;
  onDragEnd: DragEndCallback;
};

const SortableGridInner = typedMemo(function SortableGridInner<I>({
  columnGap: _columnGap,
  debug,
  dimensionsAnimationType,
  DropIndicatorComponent,
  dropIndicatorStyle,
  groups,
  isVertical,
  itemEntering,
  itemExiting,
  overflow,
  rowGap: _rowGap,
  rowHeight,
  showDropIndicator,
  strategy,
  ...rest
}: SortableGridInnerProps<I>) {
  const columnGap = useAnimatableValue(_columnGap);
  const rowGap = useAnimatableValue(_rowGap);

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

  return (
    <GridProvider
      {...rest}
      columnGap={columnGap}
      controlledContainerDimensions={controlledContainerDimensions}
      controlledItemDimensions={controlledItemDimensions}
      debug={debug}
      isVertical={isVertical}
      numGroups={groups}
      rowGap={rowGap}
      rowHeight={rowHeight}
      strategy={strategy}>
      <SortableGridComponent
        columnGap={columnGap}
        debug={debug}
        dimensionsAnimationType={dimensionsAnimationType}
        DropIndicatorComponent={DropIndicatorComponent}
        dropIndicatorStyle={dropIndicatorStyle}
        groups={groups}
        isVertical={isVertical}
        itemEntering={itemEntering}
        itemExiting={itemExiting}
        overflow={overflow}
        rowGap={rowGap}
        rowHeight={rowHeight}
        showDropIndicator={showDropIndicator}
        strategy={strategy}
      />
    </GridProvider>
  );
});

type SortableGridComponentProps<I> = Pick<
  SortableGridInnerProps<I>,
  | 'debug'
  | 'dimensionsAnimationType'
  | 'DropIndicatorComponent'
  | 'dropIndicatorStyle'
  | 'groups'
  | 'isVertical'
  | 'itemEntering'
  | 'itemExiting'
  | 'overflow'
  | 'rowHeight'
  | 'showDropIndicator'
  | 'strategy'
> & {
  columnGap: SharedValue<number>;
  rowGap: SharedValue<number>;
};

function SortableGridComponent<I>({
  columnGap,
  groups,
  isVertical,
  rowGap,
  rowHeight,
  strategy,
  ...rest
}: SortableGridComponentProps<I>) {
  const { handleContainerMeasurement, resetMeasurements } =
    useMeasurementsContext();
  const { mainGroupSize } = useGridLayoutContext();

  const isFirstRenderRef = useRef(true);

  useOrderUpdater(strategy, GRID_STRATEGIES);

  useLayoutEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    resetMeasurements();
  }, [groups, resetMeasurements]);

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
          height: groups * ((rowHeight ?? 0) + rowGap.value) - rowGap.value,
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
    <SortableContainer
      {...rest}
      containerStyle={[styles.gridContainer, animatedInnerStyle]}
      itemStyle={itemStyle}
      onLayout={runOnUI((w, h) => {
        handleContainerMeasurement(
          w - (isVertical && !IS_WEB ? columnGap.value : 0),
          h
        );
      })}
    />
  );
}

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
