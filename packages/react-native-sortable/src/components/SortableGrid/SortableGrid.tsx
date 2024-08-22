import { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_GRID_PROPS } from '../../constants';
import { isInternalFunction, useStableCallback } from '../../hooks';
import {
  GridLayoutProvider,
  SharedProvider,
  useGridLayoutContext
} from '../../providers';
import type {
  DragEndCallback,
  SortableGridProps,
  SortableGridRenderItem
} from '../../types';
import {
  defaultKeyExtractor,
  getPropsWithDefaults,
  reorderOnDragEnd,
  typedMemo,
  zipArrays
} from '../../utils';
import { DraggableView } from '../shared';
import GridLayoutDebugView from './GridLayoutDebugView';

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
    sharedProps: { onDragEnd: _onDragEnd, ...sharedProps }
  } = getPropsWithDefaults(props, DEFAULT_SORTABLE_GRID_PROPS);

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
        columnGap={columnGap}
        columns={columns}
        rowGap={rowGap}>
        <SortableGridInner
          columns={columns}
          data={data}
          itemKeys={itemKeys}
          renderItem={renderItem}
        />
        {/* TODO: Make this configurable (add a way to toggle debug mode) */}
        <GridLayoutDebugView columns={columns} itemsCount={data.length} />
      </GridLayoutProvider>
    </SharedProvider>
  );
}

type SortableGridInnerProps<I> = {
  itemKeys: Array<string>;
} & Required<Pick<SortableGridProps<I>, 'columns' | 'data' | 'renderItem'>>;

function SortableGridInner<I>({
  columns,
  data,
  itemKeys,
  ...rest
}: SortableGridInnerProps<I>) {
  const { columnGap, rowGap } = useGridLayoutContext();

  const animatedContainerStyle = useAnimatedStyle(() => ({
    marginHorizontal: -columnGap.value / 2,
    marginVertical: -rowGap.value / 2
  }));

  const animatedItemWrapperStyle = useAnimatedStyle(() => ({
    paddingHorizontal: columnGap.value / 2,
    paddingVertical: rowGap.value / 2
  }));

  const itemStyle = useMemo<StyleProp<ViewStyle>>(
    () => [{ flexBasis: `${100 / columns}%` }, animatedItemWrapperStyle],
    [animatedItemWrapperStyle, columns]
  );

  return (
    <Animated.View style={[styles.gridContainer, animatedContainerStyle]}>
      {zipArrays(data, itemKeys).map(([item, key]) => (
        <SortableGridItem
          item={item}
          itemKey={key}
          key={key}
          style={itemStyle}
          {...rest}
        />
      ))}
    </Animated.View>
  );
}

type SortableGridItemProps<I> = {
  itemKey: string;
  item: I;
  renderItem: SortableGridRenderItem<I>;
  style: StyleProp<ViewStyle>;
};

const SortableGridItem = typedMemo(function <I>({
  item,
  itemKey,
  renderItem,
  style
}: SortableGridItemProps<I>) {
  return (
    <DraggableView itemKey={itemKey} key={itemKey} style={style}>
      {renderItem({ item })}
    </DraggableView>
  );
});

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  }
});

export default typedMemo(SortableGrid);
