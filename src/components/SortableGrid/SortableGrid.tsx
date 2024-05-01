import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { MeasurementsProvider } from '../../contexts';
import { defaultKeyExtractor, typedMemo } from '../../utils';
import { DraggableView } from '../shared';
import type { SortableGridRenderItem } from './types';

export type SortableGridProps<I> = {
  data: Array<I>;
  numColumns: number;
  renderItem: SortableGridRenderItem<I>;
  keyExtractor?: (item: I, index: number) => string;
};

function SortableGrid<I>({
  data,
  keyExtractor = defaultKeyExtractor,
  numColumns,
  renderItem
}: SortableGridProps<I>) {
  return (
    <MeasurementsProvider itemsCount={data.length}>
      <SortableGridInner
        data={data}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        renderItem={renderItem}
      />
    </MeasurementsProvider>
  );
}

type SortableGridInnerProps<I> = Required<
  Pick<
    SortableGridProps<I>,
    'data' | 'keyExtractor' | 'numColumns' | 'renderItem'
  >
>;

function SortableGridInner<I>({
  data,
  keyExtractor,
  numColumns,
  renderItem
}: SortableGridInnerProps<I>) {
  const style: ViewStyle = {
    width: `${100 / numColumns}%`
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
