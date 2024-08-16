import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_GRID_PROPS } from '../../constants';
import { useAnimatableValue } from '../../hooks';
import {
  GridLayoutProvider,
  SharedProvider,
  useGridOrderUpdater
} from '../../providers';
import type { SortableGridProps, SortableGridRenderItem } from '../../types';
import type { AnimatedViewStyle } from '../../types/reanimated';
import {
  defaultKeyExtractor,
  getPropsWithDefaults,
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
    sharedProps
  } = getPropsWithDefaults(props, DEFAULT_SORTABLE_GRID_PROPS);

  const columnGapValue = useAnimatableValue(columnGap);
  const rowGapValue = useAnimatableValue(rowGap);

  const itemKeys = useMemo(
    () => data.map((item, index) => keyExtractor(item, index)),
    [data, keyExtractor]
  );

  const animatedContainerStyle = useAnimatedStyle(() => ({
    marginHorizontal: -columnGapValue.value / 2,
    marginVertical: -rowGapValue.value / 2
  }));

  const animatedItemWrapperStyle = useAnimatedStyle(() => ({
    paddingHorizontal: columnGapValue.value / 2,
    paddingVertical: rowGapValue.value / 2
  }));

  return (
    <SharedProvider {...sharedProps} itemKeys={itemKeys} key={columns}>
      <GridLayoutProvider
        columnGap={columnGapValue}
        columns={columns}
        rowGap={rowGapValue}>
        <SortableGridInner
          columns={columns}
          data={data}
          itemKeys={itemKeys}
          renderItem={renderItem}
          style={animatedContainerStyle}
          itemStyle={[
            { flexBasis: `${100 / columns}%` },
            animatedItemWrapperStyle
          ]}
        />
      </GridLayoutProvider>
    </SharedProvider>
  );
}

type SortableGridInnerProps<I> = {
  itemKeys: Array<string>;
  itemStyle: AnimatedViewStyle;
  style: AnimatedViewStyle;
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
  style: AnimatedViewStyle;
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
