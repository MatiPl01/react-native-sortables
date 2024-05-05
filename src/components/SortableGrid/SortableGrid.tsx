import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import {
  GridLayoutProvider,
  SharedProvider,
  useGridLayoutContext
} from '../../contexts';
import type { SharedProps } from '../../types';
import {
  defaultKeyExtractor,
  getPropsWithDefaults,
  typedMemo
} from '../../utils';
import { DraggableView } from '../shared';
import type { SortableGridRenderItem } from './types';

export type SortableGridProps<I> = {
  data: Array<I>;
  renderItem: SortableGridRenderItem<I>;
  columns?: number;
  keyExtractor?: (item: I, index: number) => string;
} & SharedProps;

function SortableGrid<I>(props: SortableGridProps<I>) {
  const {
    rest: { columns = 1, data, keyExtractor = defaultKeyExtractor, renderItem },
    sharedProps
  } = getPropsWithDefaults(props);

  const itemKeys = useMemo(() => data.map(keyExtractor), [data, keyExtractor]);

  return (
    <SharedProvider {...sharedProps} itemKeys={itemKeys}>
      <GridLayoutProvider columnsCount={columns}>
        <SortableGridInner
          columns={columns}
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
        />
      </GridLayoutProvider>
    </SharedProvider>
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
  const { columnWidth, containerHeight } = useGridLayoutContext();

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
