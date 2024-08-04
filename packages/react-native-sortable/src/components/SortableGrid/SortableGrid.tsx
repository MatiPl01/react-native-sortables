import { useMemo } from 'react';
import type { ViewProps } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import {
  GridLayoutProvider,
  SharedProvider,
  useGridLayoutContext,
  useGridOrderUpdater,
  useMeasurementsContext
} from '../../contexts';
import type { Prettify, SharedProps } from '../../types';
import {
  defaultKeyExtractor,
  getPropsWithDefaults,
  typedMemo
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

  const itemKeys = useMemo(() => data.map(keyExtractor), [data, keyExtractor]);

  return (
    <SharedProvider {...providerProps} itemKeys={itemKeys}>
      <GridLayoutProvider columnCount={columns} columnGap={columnGap}>
        <SortableGridInner
          columnGap={columnGap}
          columns={columns}
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          reorderStrategy={reorderStrategy}
          rowGap={rowGap}
        />
      </GridLayoutProvider>
    </SharedProvider>
  );
}

type SortableGridInnerProps<I> = Required<
  Pick<
    SortableGridProps<I>,
    | 'columnGap'
    | 'columns'
    | 'data'
    | 'keyExtractor'
    | 'renderItem'
    | 'reorderStrategy'
    | 'rowGap'
  >
>;

function SortableGridInner<I>({
  columnGap,
  columns,
  data,
  keyExtractor,
  renderItem,
  reorderStrategy,
  rowGap
}: SortableGridInnerProps<I>) {
  const { containerHeight } = useMeasurementsContext();
  const { columnWidth } = useGridLayoutContext();
  useGridOrderUpdater(columns, reorderStrategy);

  const animatedColumnWidthStyle = useAnimatedStyle(() => {
    return columnWidth.value === -1
      ? {
          flexBasis: `${100 / columns}%`
        }
      : { width: columnWidth.value };
  });

  const animatedContainerHeightStyle = useAnimatedStyle(() => ({
    height: containerHeight.value === -1 ? 'auto' : containerHeight.value
  }));

  const containerSpacingStyle = {
    marginHorizontal: -columnGap / 2,
    marginVertical: -rowGap / 2
  };

  return (
    <Animated.View
      style={[
        styles.gridContainer,
        containerSpacingStyle,
        animatedContainerHeightStyle
      ]}>
      {data.map((item, index) => {
        const key = keyExtractor(item, index);
        return (
          <SortableGridItem
            columnGap={columnGap}
            item={item}
            itemKey={key}
            key={key}
            renderItem={renderItem}
            rowGap={rowGap}
            style={animatedColumnWidthStyle}
          />
        );
      })}
    </Animated.View>
  );
}

type SortableGridItemProps<I> = {
  columnGap: number;
  rowGap: number;
  itemKey: string;
  item: I;
  renderItem: SortableGridRenderItem<I>;
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
    <DraggableView style={[itemSpacingStyle, style]} {...rest}>
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
