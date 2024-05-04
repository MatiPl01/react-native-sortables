import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import {
  GridLayoutProvider,
  MeasurementsProvider,
  PositionsProvider,
  useGridLayoutContext,
  useMeasurementsContext
} from '../../contexts';
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
  const { containerHeight } = useMeasurementsContext();
  const { columnWidth } = useGridLayoutContext();

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
          <DraggableView
            itemKey={key}
            key={key}
            style={animatedColumnWidthStyle}>
            {renderItem({ item })}
          </DraggableView>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  }
});

export default typedMemo(SortableGrid);
