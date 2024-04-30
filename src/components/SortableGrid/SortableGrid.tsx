import { View } from 'react-native';

import { MeasurementsProvider } from '../../contexts';
import { defaultKeyExtractor, typedMemo } from '../../utils';
import type { SortableGridRenderItem } from './types';

export type SortableGridProps<I> = {
  data: Array<I>;
  renderItem: SortableGridRenderItem<I>;
  keyExtractor?: (item: I, index: number) => string;
};

function SortableGrid<I>({
  data,
  keyExtractor = defaultKeyExtractor,
  renderItem
}: SortableGridProps<I>) {
  return (
    <MeasurementsProvider>
      <SortableGridInner
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
    </MeasurementsProvider>
  );
}

type SortableGridInnerProps<I> = Required<
  Pick<SortableGridProps<I>, 'data' | 'keyExtractor' | 'renderItem'>
>;

function SortableGridInner<I>({
  data,
  keyExtractor,
  renderItem
}: SortableGridInnerProps<I>) {
  return (
    <View>
      {data.map((item, index) => (
        <View key={keyExtractor(item, index)}>{renderItem({ item })}</View>
      ))}
    </View>
  );
}

export default typedMemo(SortableGrid);
