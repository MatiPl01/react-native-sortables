import { useMemo } from 'react';
import type { ViewProps, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import {
  GridLayoutProvider,
  SharedProvider,
  useGridOrderUpdater,
  useMeasurementsContext
} from '../../contexts';
import type { Prettify, SharedProps } from '../../types';
import {
  defaultKeyExtractor,
  getPropsWithDefaults,
  typedMemo,
  zipArrays
} from '../../utils';
import { DraggableView } from '../shared';
import type { SortableGridRenderItem } from './types';

export type SortableGridProps<I> = Prettify<
  {
    data: Array<I>;
    renderItem: SortableGridRenderItem<I>;
    columnGap?: number;
    rowGap?: number;
    columns?: number;
    keyExtractor?: (item: I, index: number) => string;
  } & SharedProps
>;

function SortableGrid<I>(props: SortableGridProps<I>) {
  const {
    rest: {
      columnGap = 0,
      columns = 2,
      data,
      keyExtractor = defaultKeyExtractor,
      renderItem,
      rowGap = 0
    },
    sharedProps: { reorderStrategy, ...providerProps }
  } = getPropsWithDefaults(props);

  const itemKeys = useMemo(
    () => data.map((item, index) => `${keyExtractor(item, index)}-${columns}`),
    [data, columns, keyExtractor]
  );

  const containerSpacingStyle = {
    marginHorizontal: -columnGap / 2,
    marginVertical: -rowGap / 2
  };

  return (
    <SharedProvider
      {...providerProps}
      dropIndicatorStyle={containerSpacingStyle}
      itemKeys={itemKeys}
      key={columns}>
      <GridLayoutProvider columnCount={columns} columnGap={columnGap}>
        <SortableGridInner
          columnGap={columnGap}
          columns={columns}
          containerSpacingStyle={containerSpacingStyle}
          data={data}
          itemKeys={itemKeys}
          renderItem={renderItem}
          reorderStrategy={reorderStrategy}
          rowGap={rowGap}
        />
      </GridLayoutProvider>
    </SharedProvider>
  );
}

type SortableGridInnerProps<I> = {
  containerSpacingStyle: ViewStyle;
  itemKeys: Array<string>;
} & Required<
  Pick<
    SortableGridProps<I>,
    | 'columnGap'
    | 'columns'
    | 'data'
    | 'renderItem'
    | 'reorderStrategy'
    | 'rowGap'
  >
>;

function SortableGridInner<I>({
  columnGap,
  columns,
  containerSpacingStyle,
  data,
  itemKeys,
  renderItem,
  reorderStrategy,
  rowGap
}: SortableGridInnerProps<I>) {
  const { containerHeight } = useMeasurementsContext();
  useGridOrderUpdater(columns, reorderStrategy);

  const columnWidthStyle = useMemo<ViewStyle>(
    () => ({
      flexBasis: `${100 / columns}%`
    }),
    [columns]
  );

  const animatedContainerHeightStyle = useAnimatedStyle(() => ({
    height: containerHeight.value === -1 ? 'auto' : containerHeight.value
  }));

  return (
    <Animated.View
      style={[
        styles.gridContainer,
        containerSpacingStyle,
        animatedContainerHeightStyle
      ]}>
      {zipArrays(data, itemKeys).map(([item, key]) => (
        <SortableGridItem
          columnGap={columnGap}
          item={item}
          itemKey={key}
          key={key}
          renderItem={renderItem}
          rowGap={rowGap}
          style={columnWidthStyle}
        />
      ))}
    </Animated.View>
  );
}

type SortableGridItemProps<I> = {
  columnGap: number;
  rowGap: number;
  itemKey: string;
  item: I;
  renderItem: SortableGridRenderItem<I>;
  style: ViewStyle;
} & ViewProps;

const SortableGridItem = typedMemo(function <I>({
  columnGap,
  item,
  renderItem,
  rowGap,
  style,
  ...rest
}: SortableGridItemProps<I>) {
  const itemSpacingStyle = useMemo(
    () => ({
      flexShrink: 1,
      paddingHorizontal: columnGap / 2,
      paddingVertical: rowGap / 2
    }),
    [columnGap, rowGap]
  );

  return (
    <DraggableView
      key={rest.itemKey}
      style={[itemSpacingStyle, style]}
      {...rest}>
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
