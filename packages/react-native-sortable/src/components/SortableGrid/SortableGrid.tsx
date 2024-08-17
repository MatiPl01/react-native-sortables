import { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_GRID_PROPS } from '../../constants';
import {
  isInternalFunction,
  useAnimatableValue,
  useStableCallback
} from '../../hooks';
import {
  GridLayoutProvider,
  SharedProvider,
  useGridOrderUpdater
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

  const animatedContainerStyle = useAnimatedStyle(() => ({
    marginHorizontal: -columnGapValue.value / 2,
    marginVertical: -rowGapValue.value / 2
  }));

  const animatedItemWrapperStyle = useAnimatedStyle(() => ({
    paddingHorizontal: columnGapValue.value / 2,
    paddingVertical: rowGapValue.value / 2
  }));

  const itemStyle = useMemo<StyleProp<ViewStyle>>(
    () => [{ flexBasis: `${100 / columns}%` }, animatedItemWrapperStyle],
    [animatedItemWrapperStyle, columns]
  );

  return (
    <SharedProvider
      {...sharedProps}
      itemKeys={itemKeys}
      key={columns}
      onDragEnd={onDragEnd}>
      <GridLayoutProvider
        columnGap={columnGapValue}
        columns={columns}
        rowGap={rowGapValue}>
        <SortableGridInner
          columns={columns}
          data={data}
          itemKeys={itemKeys}
          itemStyle={itemStyle}
          renderItem={renderItem}
          style={animatedContainerStyle}
        />
      </GridLayoutProvider>
    </SharedProvider>
  );
}

type SortableGridInnerProps<I> = {
  itemKeys: Array<string>;
  itemStyle: StyleProp<ViewStyle>;
  style: StyleProp<ViewStyle>;
} & Required<Pick<SortableGridProps<I>, 'columns' | 'data' | 'renderItem'>>;

function SortableGridInner<I>({
  columns,
  data,
  itemKeys,
  itemStyle,
  style,
  ...rest
}: SortableGridInnerProps<I>) {
  useGridOrderUpdater(columns);

  return (
    <Animated.View style={[styles.gridContainer, style]}>
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
