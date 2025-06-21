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
  const controlledContainerDimensions = useDerivedValue(() => ({
    height: isVertical, // height is controlled for vertical grids
    width: !isVertical // width is controlled for horizontal grids
  }));

  const itemKeys = useMemo(() => data.map(keyExtractor), [data, keyExtractor]);

  const onDragEnd = useDragEndHandler(_onDragEnd, {
    data: params => orderItems(data, itemKeys, params, true)
  });

  return (
    <SharedProvider
      {...sharedProps}
      controlledContainerDimensions={controlledContainerDimensions}
      debug={debug}
      itemKeys={itemKeys}
      onDragEnd={onDragEnd}>
      <GridLayoutProvider
        columnGap={columnGapValue}
        isVertical={isVertical}
        numGroups={groups}
        numItems={data.length}
        rowGap={rowGapValue}
        rowHeight={rowHeight} // horizontal grid only
      >
        <OrderUpdaterComponent
          key={useStrategyKey(strategy)}
          predefinedStrategies={GRID_STRATEGIES}
          strategy={strategy}
          triggerOrigin={reorderTriggerOrigin}
          useAdditionalValues={useGridLayoutContext}
        />
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
      </GridLayoutProvider>
    </SharedProvider>
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
  const { mainGroupSize } = useGridLayoutContext();

  const animatedInnerStyle = useAnimatedStyle(() => ({
    flexDirection: isVertical ? 'row' : 'column',
    height: isVertical ? undefined : groups * (rowHeight + rowGap.value),
    ...(mainGroupSize.value
      ? {
          columnGap: columnGap.value,
          marginHorizontal: 0,
          marginVertical: 0,
          rowGap: rowGap.value
        }
      : {
          marginHorizontal: -columnGap.value / 2,
          marginVertical: -rowGap.value / 2
        })
  }));

  const animatedItemStyle = useAnimatedStyle(() => {
    if (!mainGroupSize.value) {
      return {
        flexBasis: `${100 / groups}%`,
        paddingHorizontal: columnGap.value / 2,
        paddingVertical: rowGap.value / 2
      };
    }

    return {
      flexBasis: 'auto',
      [isVertical ? 'width' : 'height']: mainGroupSize.value,
      paddingHorizontal: 0,
      paddingVertical: 0
    };
  });

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
          renderItem={renderItem}
          style={[
            animatedItemStyle,
            !isVertical && styles.horizontalStyleOverride
          ]}
        />
      ))}
    </SortableContainer>
  );
}

type SortableGridItemProps<I> = DraggableViewProps & {
  index: number;
  item: I;
  renderItem: SortableGridRenderItem<I>;
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
