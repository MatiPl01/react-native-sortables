import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAnimatedStyle } from 'react-native-reanimated';

import {
  GridLayoutProvider,
  MeasurementsProvider,
  PositionsProvider,
  useGridLayoutContext
} from '../../contexts/shared';
import { defaultKeyExtractor, typedMemo } from '../../utils';
import { DraggableView } from '../shared';
import type { SortableGridRenderItem } from './types';

export type SortableGridProps<I> = {
  data: Array<I>;
  columns?: number;
  renderItem: SortableGridRenderItem<I>;
  keyExtractor?: (item: I, index: number) => string;
};

function SortableGrid<I>({
  columns = 1,
  data,
  keyExtractor = defaultKeyExtractor,
  renderItem
}: SortableGridProps<I>) {
  const itemKeys = useMemo(() => data.map(keyExtractor), [data, keyExtractor]);

  return (
    <MeasurementsProvider itemsCount={data.length}>
      <PositionsProvider itemKeys={itemKeys}>
        <GridLayoutProvider columnsCount={columns}>
          <SortableGridInner
            columns={columns}
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
          />
        </GridLayoutProvider>
      </PositionsProvider>
    </MeasurementsProvider>
  );
}

type SortableGridInnerProps<I> = Required<
  Pick<SortableGridProps<I>, 'columns' | 'data' | 'keyExtractor' | 'renderItem'>
>;

function SortableGridInner<I>({
  columns,
  data,
  keyExtractor,
  renderItem
}: SortableGridInnerProps<I>) {
  const { columnWidth } = useGridLayoutContext();

  const animatedStyle = useAnimatedStyle(() => ({
    width: columnWidth.value === -1 ? `${100 / columns}%` : columnWidth.value
  }));

  return (
    <View style={styles.gridContainer}>
      {data.map((item, index) => {
        const key = keyExtractor(item, index);
        return (
          <DraggableView itemKey={key} key={key} style={animatedStyle}>
            {renderItem({ item })}
          </DraggableView>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  }
});

export default typedMemo(SortableGrid);
