import { useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import {
  GridLayoutProvider,
  SharedProvider,
  useGridOrderUpdater
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

  const itemWrapperStyle = useMemo<ViewStyle>(
    () => ({
      flexBasis: `${100 / columns}%`,
      paddingHorizontal: columnGap / 2,
      paddingVertical: rowGap / 2
    }),
    [columns, columnGap, rowGap]
  );

  return (
    <SharedProvider
      {...providerProps}
      itemKeys={itemKeys}
      itemWrapperStyle={itemWrapperStyle}
      key={columns}>
      <GridLayoutProvider
        columnGap={columnGap}
        columns={columns}
        rowGap={rowGap}>
        <SortableGridInner
          columns={columns}
          containerSpacingStyle={containerSpacingStyle}
          data={data}
          itemKeys={itemKeys}
          renderItem={renderItem}
          reorderStrategy={reorderStrategy}
          style={itemWrapperStyle}
        />
      </GridLayoutProvider>
    </SharedProvider>
  );
}

type SortableGridInnerProps<I> = {
  containerSpacingStyle: ViewStyle;
  itemKeys: Array<string>;
  style: ViewStyle;
} & Required<
  Pick<
    SortableGridProps<I>,
    'columns' | 'data' | 'renderItem' | 'reorderStrategy'
  >
>;

function SortableGridInner<I>({
  columns,
  containerSpacingStyle,
  data,
  itemKeys,
  reorderStrategy,
  ...rest
}: SortableGridInnerProps<I>) {
  useGridOrderUpdater(columns, reorderStrategy);

  return (
    <View style={[styles.gridContainer, containerSpacingStyle]}>
      {zipArrays(data, itemKeys).map(([item, key]) => (
        <SortableGridItem item={item} itemKey={key} key={key} {...rest} />
      ))}
    </View>
  );
}

type SortableGridItemProps<I> = {
  itemKey: string;
  item: I;
  renderItem: SortableGridRenderItem<I>;
  style: ViewStyle;
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
