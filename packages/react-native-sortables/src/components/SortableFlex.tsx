import type { ReactElement } from 'react';
import { memo, useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { runOnUI, useAnimatedStyle } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_FLEX_PROPS } from '../constants';
import type { RequiredBy } from '../helperTypes';
import type { PropsWithDefaults } from '../hooks';
import { useDragEndHandler, usePropsWithDefaults } from '../hooks';
import {
  DataProvider,
  FLEX_STRATEGIES,
  FlexProvider,
  useCommonValuesContext,
  useMeasurementsContext,
  useOrderUpdater,
  useStrategyKey
} from '../providers';
import type { SortableFlexProps, SortableFlexStyle } from '../types';
import { orderItems, processChildren } from '../utils';
import { SortableContainer } from './shared';

const CONTROLLED_ITEM_DIMENSIONS = {
  height: false,
  width: false
};

function SortableFlex(props: SortableFlexProps) {
  const { children, strategy, ...rest } = usePropsWithDefaults(
    props,
    DEFAULT_SORTABLE_FLEX_PROPS
  );

  const items = processChildren(children);

  return (
    <DataProvider items={items}>
      <SortableFlexInner
        {...rest}
        items={items}
        key={useStrategyKey(strategy)}
        strategy={strategy}
      />
    </DataProvider>
  );
}

type SortableFlexInnerProps = PropsWithDefaults<
  SortableFlexProps,
  typeof DEFAULT_SORTABLE_FLEX_PROPS
> & {
  items: Array<[string, ReactElement]>;
};

const SortableFlexInner = memo(function SortableFlexInner({
  alignContent,
  alignItems,
  columnGap,
  dimensionsAnimationType,
  DropIndicatorComponent,
  dropIndicatorStyle,
  flexDirection,
  flexWrap,
  gap,
  height,
  itemEntering,
  itemExiting,
  items,
  justifyContent,
  maxHeight,
  maxWidth,
  minHeight,
  minWidth,
  onDragEnd: _onDragEnd,
  overflow,
  padding,
  paddingBottom,
  paddingHorizontal,
  paddingLeft,
  paddingRight,
  paddingTop,
  paddingVertical,
  rowGap,
  showDropIndicator,
  strategy,
  width,
  ...rest
}: SortableFlexInnerProps) {
  const { usesAbsoluteLayout } = useCommonValuesContext();
  const { handleContainerMeasurement } = useMeasurementsContext();

  const isColumn = flexDirection.startsWith('column');

  useOrderUpdater(strategy, FLEX_STRATEGIES);

  const controlledContainerDimensions = useMemo(() => {
    if (flexWrap === 'nowrap') {
      return { height: height === undefined, width: width === undefined };
    }
    return {
      height: height === undefined,
      width: isColumn && width === undefined
    };
  }, [flexWrap, isColumn, height, width]);

  const onDragEnd = useDragEndHandler(_onDragEnd, {
    order: params =>
      function <I>(data: Array<I>) {
        return orderItems(data, items, params, true);
      }
  });

  const styleProps: RequiredBy<
    SortableFlexStyle,
    keyof SortableFlexStyle & keyof typeof DEFAULT_SORTABLE_FLEX_PROPS
  > = {
    alignContent,
    alignItems,
    columnGap,
    flexDirection,
    flexWrap,
    gap,
    height,
    justifyContent,
    maxHeight,
    maxWidth,
    minHeight,
    minWidth,
    padding,
    paddingBottom,
    paddingHorizontal,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingVertical,
    rowGap,
    width
  } as const;

  const baseContainerStyle: ViewStyle = {
    ...styleProps,
    height: height === 'fill' ? undefined : height,
    width: width === 'fill' ? undefined : width
  };

  const animatedContainerStyle = useAnimatedStyle(() =>
    usesAbsoluteLayout.value
      ? {
          // We need to override them to prevent react-native flex layout
          // positioning from interfering with our absolute layout
          alignContent: 'flex-start',
          alignItems: 'flex-start',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
          paddingTop: 0
        }
      : {
          alignContent,
          alignItems,
          flexDirection,
          flexWrap,
          justifyContent
        }
  );

  return (
    <FlexProvider
      {...rest}
      controlledContainerDimensions={controlledContainerDimensions}
      controlledItemDimensions={CONTROLLED_ITEM_DIMENSIONS}
      strategy={strategy}
      styleProps={styleProps}
      onDragEnd={onDragEnd}>
      <SortableContainer
        containerStyle={[baseContainerStyle, animatedContainerStyle]}
        dimensionsAnimationType={dimensionsAnimationType}
        DropIndicatorComponent={DropIndicatorComponent}
        dropIndicatorStyle={dropIndicatorStyle}
        itemEntering={itemEntering}
        itemExiting={itemExiting}
        itemStyle={styles.styleOverride}
        overflow={overflow}
        showDropIndicator={showDropIndicator}
        onLayout={runOnUI((w, h) => {
          handleContainerMeasurement(w, h);
        })}
      />
    </FlexProvider>
  );
});

const styles = StyleSheet.create({
  styleOverride: {
    // This is needed to prevent items from stretching (which is default behavior)
    alignSelf: 'flex-start'
  }
});

export default SortableFlex;
