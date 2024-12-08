import { useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_GRID_PROPS } from '../constants';
import { useAnimatableValue, useStableCallback } from '../hooks';
import {
  GridLayoutProvider,
  SharedProvider,
  useCommonValuesContext,
  useContainerOverflow,
  useGridOrderUpdater
} from '../providers';
import type {
  DragEndCallback,
  LayoutAnimation,
  SortableGridProps,
  SortableGridRenderItem
} from '../types';
import {
  defaultKeyExtractor,
  getPropsWithDefaults,
  isInternalFunction,
  reorderOnDragEnd,
  typedMemo,
  zipArrays
} from '../utils';
import { DraggableView } from './shared';

function SortableGrid<I>(props: SortableGridProps<I>) {
  const {
    rest: {
      columnGap,
      columns,
      data,
      keyExtractor = defaultKeyExtractor,
      renderItem,
      rowGap
    },
    sharedProps: {
      itemEntering,
      itemExiting,
      onDragEnd: _onDragEnd,
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
          columnGap={columnGapValue}
          columns={columns}
          data={data}
          itemEntering={itemEntering}
          itemExiting={itemExiting}
          itemKeys={itemKeys}
          renderItem={renderItem}
          rowGap={rowGapValue}
        />
      </GridLayoutProvider>
    </SharedProvider>
  );
}

type SortableGridInnerProps<I> = {
  itemKeys: Array<string>;
  rowGap: SharedValue<number>;
  columnGap: SharedValue<number>;
} & Required<
  Pick<
    SortableGridProps<I>,
    'columns' | 'data' | 'itemEntering' | 'itemExiting' | 'renderItem'
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
  rowGap
}: SortableGridInnerProps<I>) {
  const { canSwitchToAbsoluteLayout, containerHeight } =
    useCommonValuesContext();
  const overflow = useContainerOverflow();

  useGridOrderUpdater(columns);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    marginHorizontal: -columnGap.value / 2,
    marginVertical: -rowGap.value / 2,
    height: canSwitchToAbsoluteLayout.value ? containerHeight.value : undefined,
    overflow: overflow.value
  }));

  const animatedItemStyle = useAnimatedStyle(() => ({
    flexBasis: `${100 / columns}%`,
    paddingHorizontal: columnGap.value / 2,
    paddingVertical: rowGap.value / 2
  }));

  return (
    <View style={styles.outerContainer}>
      <Animated.View style={[styles.gridContainer, animatedContainerStyle]}>
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
      </Animated.View>
    </View>
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
  },
  outerContainer: {
    width: '100%'
  }
});

export default typedMemo(SortableGrid);
