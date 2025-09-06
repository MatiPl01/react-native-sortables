import { useLayoutEffect, useMemo, useRef } from 'react';
import type { DimensionValue } from 'react-native';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { runOnUI, useAnimatedStyle } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_GRID_PROPS, IS_WEB } from '../constants';
import { useDragEndHandler } from '../hooks';
import { useAnimatableValue } from '../integrations/reanimated';
import {
  GridProvider,
  useAutoOffsetAdjustmentContext,
  useGridLayoutContext,
  useMeasurementsContext
} from '../providers';
import type {
  DropIndicatorSettings,
  SortableGridProps,
  SortableGridRenderItem
} from '../types';
import {
  defaultKeyExtractor,
  error,
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
      autoAdjustOffsetDuringDrag,
      autoAdjustOffsetResetTimeout,
      autoAdjustOffsetScrollPadding,
      columnGap,
      columns,
      data,
      keyExtractor = defaultKeyExtractor,
      onDragEnd: _onDragEnd,
      renderItem,
      rowGap,
      rowHeight,
      rows,
      strategy
    },
    sharedProps: {
      debug,
      dimensionsAnimationType,
      DropIndicatorComponent,
      dropIndicatorStyle,
      itemEntering,
      itemExiting,
      overflow,
      reorderTriggerOrigin,
      showDropIndicator,
      ...sharedProps
    }
  } = getPropsWithDefaults(props, DEFAULT_SORTABLE_GRID_PROPS);

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

  const columnGapValue = useAnimatableValue(columnGap);
  const rowGapValue = useAnimatableValue(rowGap);

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

  const itemKeys = useMemo(() => data.map(keyExtractor), [data, keyExtractor]);

  const onDragEnd = useDragEndHandler(_onDragEnd, {
    data: params => orderItems(data, itemKeys, params, true)
  });

  return (
    <GridProvider
      {...sharedProps}
      autoAdjustOffsetDuringDrag={autoAdjustOffsetDuringDrag}
      autoAdjustOffsetResetTimeout={autoAdjustOffsetResetTimeout}
      autoAdjustOffsetScrollPadding={autoAdjustOffsetScrollPadding}
      columnGap={columnGapValue}
      controlledContainerDimensions={controlledContainerDimensions}
      controlledItemDimensions={controlledItemDimensions}
      debug={debug}
      isVertical={isVertical}
      itemKeys={itemKeys}
      numGroups={groups}
      numItems={data.length}
      reorderTriggerOrigin={reorderTriggerOrigin}
      rowGap={rowGapValue}
      rowHeight={rowHeight} // must be specified for horizontal grids
      strategy={strategy}
      onDragEnd={onDragEnd}>
      <SortableGridInner
        columnGap={columnGapValue}
        data={data}
        debug={debug}
        dimensionsAnimationType={dimensionsAnimationType}
        DropIndicatorComponent={DropIndicatorComponent}
        dropIndicatorStyle={dropIndicatorStyle}
        groups={groups}
        isVertical={isVertical}
        itemEntering={itemEntering}
        itemExiting={itemExiting}
        itemKeys={itemKeys}
        overflow={overflow}
        renderItem={renderItem}
        rowGap={rowGapValue}
        rowHeight={rowHeight!} // must be specified for horizontal grids
        showDropIndicator={showDropIndicator}
      />
    </GridProvider>
  );
}

type SortableGridInnerProps<I> = DropIndicatorSettings &
  Required<
    Pick<
      SortableGridProps<I>,
      | 'data'
      | 'debug'
      | 'dimensionsAnimationType'
      | 'itemEntering'
      | 'itemExiting'
      | 'overflow'
      | 'renderItem'
      | 'rowHeight'
    >
  > & {
    itemKeys: Array<string>;
    rowGap: SharedValue<number>;
    columnGap: SharedValue<number>;
    groups: number;
    isVertical: boolean;
  };

function SortableGridInner<I>({
  columnGap,
  data,
  groups,
  isVertical,
  itemEntering,
  itemExiting,
  itemKeys,
  renderItem,
  rowGap,
  rowHeight,
  ...containerProps
}: SortableGridInnerProps<I>) {
  const { handleContainerMeasurement, resetMeasurements } =
    useMeasurementsContext();
  const { mainGroupSize } = useGridLayoutContext();
  const { layoutUpdateProgress } = useAutoOffsetAdjustmentContext() ?? {};

  const isFirstRenderRef = useRef(true);

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

  const sharedItemProps = {
    itemEntering,
    itemExiting,
    itemKeys,
    renderItem,
    style: itemStyle
  };

  return (
    <SortableContainer
      {...containerProps}
      style={[styles.gridContainer, animatedInnerStyle]}
      onLayout={runOnUI((width, height) => {
        handleContainerMeasurement(
          width - (isVertical && !IS_WEB ? columnGap.value : 0),
          height
        );
      })}>
      {zipArrays(data, itemKeys).map(([item, key], index) => (
        <SortableGridItem
          {...sharedItemProps}
          index={index}
          item={item}
          itemKey={key}
          key={key}
          layoutUpdateProgress={layoutUpdateProgress}
        />
      ))}
    </SortableContainer>
  );
}

type SortableGridItemProps<I> = DraggableViewProps & {
  index: number;
  item: I;
  renderItem: SortableGridRenderItem<I>;
  layoutUpdateProgress: SharedValue<null | number> | undefined;
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
    flexWrap: 'wrap'
  },
  horizontalStyleOverride: {
    // This is needed to properly adjust the wrapper size to the item width
    alignSelf: 'flex-start'
  }
});

export default typedMemo(SortableGrid);
