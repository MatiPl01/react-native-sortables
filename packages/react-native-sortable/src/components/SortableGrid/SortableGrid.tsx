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
    columns?: number;
    keyExtractor?: (item: I, index: number) => string;
  } & SharedProps
>;

function SortableGrid<I>(props: SortableGridProps<I>) {
  const {
    rest: { columns = 1, data, keyExtractor = defaultKeyExtractor, renderItem },
    sharedProps: { reorderStrategy, ...providerProps }
  } = getPropsWithDefaults(props);

  const itemKeys = useMemo(() => data.map(keyExtractor), [data, keyExtractor]);

  return (
    <SharedProvider {...providerProps} itemKeys={itemKeys}>
      <GridLayoutProvider columnsCount={columns}>
        <SortableGridInner
          columns={columns}
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          reorderStrategy={reorderStrategy}
        />
      </GridLayoutProvider>
    </SharedProvider>
  );
}

type SortableGridInnerProps<I> = Required<
  Pick<
    SortableGridProps<I>,
    'columns' | 'data' | 'keyExtractor' | 'renderItem' | 'reorderStrategy'
  >
>;

function SortableGridInner<I>({
  columns,
  data,
  keyExtractor,
  renderItem,
  reorderStrategy
}: SortableGridInnerProps<I>) {
  const { containerHeight } = useMeasurementsContext();
  const { columnWidth } = useGridLayoutContext();

  useGridOrderUpdater(columns, reorderStrategy);

  const animatedColumnWidthStyle = useAnimatedStyle(() => ({
    width: columnWidth.value === -1 ? `${100 / columns}%` : columnWidth.value
  }));

  const animatedContainerHeightStyle = useAnimatedStyle(() => ({
    height: containerHeight.value === -1 ? 'auto' : containerHeight.value
  }));

  return (
    <Animated.View style={[styles.gridContainer, animatedContainerHeightStyle]}>
      {data.map((item, index) => {
        const key = keyExtractor(item, index);
        return (
          <SortableGridItem
            item={item}
            itemKey={key}
            key={key}
            renderItem={renderItem}
            style={animatedColumnWidthStyle}
          />
        );
      })}
    </Animated.View>
  );
}

type SortableGridItemProps<I> = {
  itemKey: string;
  item: I;
  renderItem: SortableGridRenderItem<I>;
} & ViewProps;

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
