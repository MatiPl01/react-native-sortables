import { useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedStyle } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_GRID_PROPS } from '../constants';
import { useAnimatableValue, useDragEndHandler } from '../hooks';
import {
  GRID_STRATEGIES,
  GridLayoutProvider,
  LayerProvider,
  OrderUpdaterComponent,
  SharedProvider,
  useCommonValuesContext,
  useGridLayoutContext,
  useStrategyKey
} from '../providers';
import type {
  DropIndicatorSettings,
  LayoutAnimation,
  SortableGridProps,
  SortableGridRenderItem
} from '../types';
import {
  defaultKeyExtractor,
  getPropsWithDefaults,
  orderItems,
  typedMemo,
  zipArrays
} from '../utils';
import { DraggableView, SortableContainer } from './shared';

function SortableGrid<I>(props: SortableGridProps<I>) {
  const {
    rest: {
      columnGap,
      columns,
      data,
      keyExtractor = defaultKeyExtractor,
      onDragEnd: _onDragEnd,
      renderItem,
      rowGap,
      strategy
    },
    sharedProps: {
      DropIndicatorComponent,
      animateHeight,
      dropIndicatorStyle,
      itemEntering,
      itemExiting,
      showDropIndicator,
      ...sharedProps
    }
  } = getPropsWithDefaults(props, DEFAULT_SORTABLE_GRID_PROPS);

  const columnGapValue = useAnimatableValue(columnGap);
  const rowGapValue = useAnimatableValue(rowGap);

  const itemKeys = useMemo(
    () => data.map((item, index) => keyExtractor(item, index)),
    [data, keyExtractor]
  );

  const onDragEnd = useDragEndHandler(_onDragEnd, params => ({
    ...params,
    data: orderItems(data, itemKeys, params, true)
  }));

  return (
    <LayerProvider>
      <SharedProvider
        {...sharedProps}
        itemKeys={itemKeys}
        key={columns}
        onDragEnd={onDragEnd}>
        <GridLayoutProvider
          columnGap={columnGapValue}
          columns={columns}
          itemsCount={data.length}
          rowGap={rowGapValue}>
          <OrderUpdaterComponent
            key={useStrategyKey(strategy)}
            predefinedStrategies={GRID_STRATEGIES}
            strategy={strategy}
            useAdditionalValues={useGridLayoutContext}
          />
          <SortableGridInner
            animateHeight={animateHeight}
            columnGap={columnGapValue}
            columns={columns}
            data={data}
            DropIndicatorComponent={DropIndicatorComponent}
            dropIndicatorStyle={dropIndicatorStyle}
            itemEntering={itemEntering}
            itemExiting={itemExiting}
            itemKeys={itemKeys}
            renderItem={renderItem}
            rowGap={rowGapValue}
            showDropIndicator={showDropIndicator}
          />
        </GridLayoutProvider>
      </SharedProvider>
    </LayerProvider>
  );
}

type SortableGridInnerProps<I> = {
  itemKeys: Array<string>;
  rowGap: SharedValue<number>;
  columnGap: SharedValue<number>;
} & DropIndicatorSettings &
  Required<
    Pick<
      SortableGridProps<I>,
      | 'animateHeight'
      | 'columns'
      | 'data'
      | 'itemEntering'
      | 'itemExiting'
      | 'renderItem'
    >
  >;

function SortableGridInner<I>({
  columnGap,
  columns,
  data,
  itemEntering,
  itemExiting,
  itemKeys,
  renderItem,
  rowGap,
  ...containerProps
}: SortableGridInnerProps<I>) {
  const { canSwitchToAbsoluteLayout } = useCommonValuesContext();

  const animatedOuterStyle = useAnimatedStyle(() => ({
    marginBottom: canSwitchToAbsoluteLayout.value ? -rowGap.value : 0
  }));

  const animatedInnerStyle = useAnimatedStyle(() => ({
    marginHorizontal: -columnGap.value / 2,
    marginVertical: -rowGap.value / 2
  }));

  const animatedItemStyle = useAnimatedStyle(() => ({
    flexBasis: `${100 / columns}%`,
    paddingHorizontal: columnGap.value / 2,
    paddingVertical: rowGap.value / 2
  }));

  return (
    <SortableContainer
      {...containerProps}
      innerStyle={[styles.gridContainer, animatedInnerStyle]}
      outerStyle={animatedOuterStyle}>
      {zipArrays(data, itemKeys).map(([item, key]) => (
        <SortableGridItem
          entering={itemEntering}
          exiting={itemExiting}
          item={item}
          itemKey={key}
          key={key}
          renderItem={renderItem}
          style={animatedItemStyle}
        />
      ))}
    </SortableContainer>
  );
}

type SortableGridItemProps<I> = {
  itemKey: string;
  item: I;
  renderItem: SortableGridRenderItem<I>;
  entering: LayoutAnimation;
  exiting: LayoutAnimation;
  style: ViewStyle;
};

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
