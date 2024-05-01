import { useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import {
  GridLayoutProvider,
  MeasurementsProvider,
  PositionsProvider
} from '../../contexts/shared';
import { defaultKeyExtractor, typedMemo } from '../../utils';
import { DraggableView } from '../shared';
import type { SortableGridRenderItem } from './types';

type OrientationProps = {
  orientation?: 'vertical'; // for now, just support vertical orientation
  columns?: number;
};

export type SortableGridProps<I> = {
  data: Array<I>;
  renderItem: SortableGridRenderItem<I>;
  keyExtractor?: (item: I, index: number) => string;
} & OrientationProps;

function SortableGrid<I>({
  columns = 1,
  data,
  keyExtractor = defaultKeyExtractor,
  orientation = 'vertical',
  renderItem
}: SortableGridProps<I>) {
  const itemKeys = useMemo(() => data.map(keyExtractor), [data, keyExtractor]);

  return (
    <MeasurementsProvider itemsCount={data.length}>
      <PositionsProvider itemKeys={itemKeys}>
        <GridLayoutProvider
          columns={columns}
          orientation={orientation}
          rows={-1}>
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
  const style: ViewStyle = {
    width: `${100 / columns}%`
  };

  return (
    <View style={styles.gridContainer}>
      {data.map((item, index) => {
        const id = keyExtractor(item, index);
        return (
          <DraggableView id={id} key={id} style={style}>
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
