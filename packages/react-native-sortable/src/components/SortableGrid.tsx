import { useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedStyle } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_GRID_PROPS } from '../constants';
import { useAnimatableValue, useStableCallback } from '../hooks';
import {
  GridLayoutProvider,
  GridOrderUpdater,
  SharedProvider,
  useCommonValuesContext
} from '../providers';
import type {
  DragEndCallback,
  DropIndicatorSettings,
  LayoutAnimation,
  SortableGridProps,
  SortableGridRenderItem,
  SortableGridStrategy
} from '../types';
import {
  defaultKeyExtractor,
  getPropsWithDefaults,
  isInternalFunction,
  reorderOnDragEnd,
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
      renderItem,
      rowGap,
      strategy
    },
    sharedProps: {
      DropIndicatorComponent,
      animateHeight,
      dropIndicatorStyle,
      itemEntering,
      itemExiting,
      onDragEnd: _onDragEnd,
      showDropIndicator,
      ...sharedProps
    }
  } = getPropsWithDefaults(props, DEFAULT_SORTABLE_GRID_PROPS);

  const columnGapValue = useAnimatableValue(columnGap);
  const rowGapValue = useAnimatableValue(rowGap);

  const itemKeys = useMemo(
    () => data.map((item, index) => keyExtractor(item, index)),
    [data, keyExtractor]
  );

  const onDragEnd = useStableCallback<DragEndCallback>(params => {
    if (!_onDragEnd) {
      return;
    }
    // For cases when user provides onOrderChange created via a helper
    // useOrderChangeHandler hook
    if (isInternalFunction(_onDragEnd, 'DragEndCallback')) {
      return (_onDragEnd as DragEndCallback)(params);
    }
    // Add the data property for the sortable grid if a custom user callback is provided
    _onDragEnd({
      ...params,
      data: reorderOnDragEnd(data, params, true)
    });
  });

  return (
    <SharedProvider
      {...sharedProps}
      itemKeys={itemKeys}
      key={columns}
      onDragEnd={onDragEnd}>
      <GridLayoutProvider
        columnGap={columnGapValue}
        columns={columns}
        itemsCount={data.length}
        rowGap={rowGapValue}>
        <SortableGridInner
          animateHeight={animateHeight}
          columnGap={columnGapValue}
          columns={columns}
          data={data}
          DropIndicatorComponent={DropIndicatorComponent}
          dropIndicatorStyle={dropIndicatorStyle}
          itemEntering={itemEntering}
          itemExiting={itemExiting}
          itemKeys={itemKeys}
          renderItem={renderItem}
          rowGap={rowGapValue}
          showDropIndicator={showDropIndicator}
          strategy={strategy}
        />
      </GridLayoutProvider>
    </SharedProvider>
  );
}

type SortableGridInnerProps<I> = {
  itemKeys: Array<string>;
  rowGap: SharedValue<number>;
  columnGap: SharedValue<number>;
  strategy: SortableGridStrategy;
} & DropIndicatorSettings &
  Required<
    Pick<
      SortableGridProps<I>,
      | 'animateHeight'
      | 'columns'
      | 'data'
      | 'itemEntering'
      | 'itemExiting'
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
  renderItem,
  rowGap,
  strategy,
  ...containerProps
}: SortableGridInnerProps<I>) {
  const { canSwitchToAbsoluteLayout } = useCommonValuesContext();

  const animatedOuterStyle = useAnimatedStyle(() => ({
    marginBottom: canSwitchToAbsoluteLayout.value ? -rowGap.value : 0
  }));

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
      innerStyle={[styles.gridContainer, animatedInnerStyle]}
      outerStyle={animatedOuterStyle}>
      <GridOrderUpdater strategy={strategy} />
      {zipArrays(data, itemKeys).map(([item, key]) => (
        <SortableGridItem
          entering={itemEntering}
          exiting={itemExiting}
          item={item}
          itemKey={key}
          key={key}
          renderItem={renderItem}
          style={animatedItemStyle}
        />
      ))}
    </SortableContainer>
  );
}

type SortableGridItemProps<I> = {
  itemKey: string;
  item: I;
  renderItem: SortableGridRenderItem<I>;
  entering: LayoutAnimation;
  exiting: LayoutAnimation;
  style: ViewStyle;
};

const SortableGridItem = typedMemo(function <I>({
  item,
  renderItem,
  ...rest
}: SortableGridItemProps<I>) {
  return <DraggableView {...rest}>{renderItem({ item })}</DraggableView>;
});

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  }
});

export default typedMemo(SortableGrid);
