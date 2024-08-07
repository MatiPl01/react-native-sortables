import { useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_GRID_PROPS } from '../../constants';
import {
  GridLayoutProvider,
  SharedProvider,
  useGridOrderUpdater
} from '../../contexts';
import { useAnimatableValue } from '../../hooks';
import type { SortableGridProps, SortableGridRenderItem } from '../../types';
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
    sharedProps: { reorderStrategy, ...providerProps }
  } = getPropsWithDefaults(props, DEFAULT_SORTABLE_GRID_PROPS);

  const columnGapValue = useAnimatableValue(columnGap);
  const rowGapValue = useAnimatableValue(rowGap);

  const itemKeys = useMemo(
    () => data.map((item, index) => `${keyExtractor(item, index)}-${columns}`),
    [data, columns, keyExtractor]
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
    <SharedProvider {...providerProps} itemKeys={itemKeys} key={columns}>
      <GridLayoutProvider
        columnGap={columnGapValue}
        columns={columns}
        rowGap={rowGapValue}>
        <SortableGridInner
          columns={columns}
          data={data}
          itemKeys={itemKeys}
          renderItem={renderItem}
          reorderStrategy={reorderStrategy}
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
  itemStyle: AnimatedStyle<ViewStyle> | Array<AnimatedStyle<ViewStyle>>;
  style: AnimatedStyle<ViewStyle>;
} & Required<
  Pick<
    SortableGridProps<I>,
    'columns' | 'data' | 'renderItem' | 'reorderStrategy'
  >
>;

function SortableGridInner<I>({
  columns,
  data,
  itemKeys,
  itemStyle,
  reorderStrategy,
  style,
  ...rest
}: SortableGridInnerProps<I>) {
  useGridOrderUpdater(columns, reorderStrategy);

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
  style: AnimatedStyle<ViewStyle> | Array<AnimatedStyle<ViewStyle>>;
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
