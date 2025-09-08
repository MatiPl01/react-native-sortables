import { memo, useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { runOnUI, useAnimatedStyle } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_FLEX_PROPS } from '../constants';
import type { RequiredBy } from '../helperTypes';
import type { PropsWithDefaults } from '../hooks';
import { useDragEndHandler, usePropsWithDefaults } from '../hooks';
import { useStableCallbackValues } from '../integrations/reanimated';
import {
  FLEX_STRATEGIES,
  FlexProvider,
  ItemsProvider,
  useCommonValuesContext,
  useMeasurementsContext,
  useOrderUpdater,
  useStrategyKey
} from '../providers';
import type {
  DragEndCallback,
  SortableFlexProps,
  SortableFlexStyle
} from '../types';
import { orderItems, processChildren } from '../utils';
import { SortableContainer } from './shared';

function SortableFlex(props: SortableFlexProps) {
  const {
    children,
    onActiveItemDropped,
    onDragEnd: _onDragEnd,
    onDragMove,
    onDragStart,
    onOrderChange,
    strategy,
    ...rest
  } = usePropsWithDefaults(props, DEFAULT_SORTABLE_FLEX_PROPS);

  const items = processChildren(children);

  const callbacks = useStableCallbackValues({
    onActiveItemDropped,
    onDragMove,
    onDragStart,
    onOrderChange
  });

  const onDragEnd = useDragEndHandler(_onDragEnd, {
    order: params =>
      function <I>(data: Array<I>) {
        return orderItems(data, items, params, true);
      }
  });

  return (
    <ItemsProvider items={items}>
      <SortableFlexInner
        {...rest}
        {...callbacks}
        key={useStrategyKey(strategy)}
        strategy={strategy}
        onDragEnd={onDragEnd}
      />
    </ItemsProvider>
  );
}

const CONTROLLED_ITEM_DIMENSIONS = {
  height: false,
  width: false
};

type StyleProps = RequiredBy<
  SortableFlexStyle,
  keyof SortableFlexStyle & keyof typeof DEFAULT_SORTABLE_FLEX_PROPS
>;

type SortableFlexInnerProps = PropsWithDefaults<
  SortableFlexProps,
  typeof DEFAULT_SORTABLE_FLEX_PROPS
> & {
  onDragEnd: DragEndCallback;
};

const SortableFlexInner = memo(function SortableFlexInner({
  alignContent,
  alignItems,
  columnGap,
  debug,
  dimensionsAnimationType,
  DropIndicatorComponent,
  dropIndicatorStyle,
  flexDirection,
  flexWrap,
  gap,
  height,
  itemEntering,
  itemExiting,
  justifyContent,
  maxHeight,
  maxWidth,
  minHeight,
  minWidth,
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
  const isColumn = flexDirection.startsWith('column');

  const controlledContainerDimensions = useMemo(
    () =>
      flexWrap === 'nowrap'
        ? { height: height === undefined, width: width === undefined }
        : {
            height: height === undefined,
            width: isColumn && width === undefined
          },
    [flexWrap, isColumn, height, width]
  );

  const styleProps: StyleProps = {
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

  return (
    <FlexProvider
      {...rest}
      controlledContainerDimensions={controlledContainerDimensions}
      controlledItemDimensions={CONTROLLED_ITEM_DIMENSIONS}
      debug={debug}
      strategy={strategy}
      styleProps={styleProps}>
      <SortableFlexComponent
        debug={debug}
        dimensionsAnimationType={dimensionsAnimationType}
        DropIndicatorComponent={DropIndicatorComponent}
        dropIndicatorStyle={dropIndicatorStyle}
        itemEntering={itemEntering}
        itemExiting={itemExiting}
        overflow={overflow}
        showDropIndicator={showDropIndicator}
        strategy={strategy}
        styleProps={styleProps}
      />
    </FlexProvider>
  );
});

type SortableFlexComponentProps = Pick<
  SortableFlexInnerProps,
  | 'debug'
  | 'dimensionsAnimationType'
  | 'DropIndicatorComponent'
  | 'dropIndicatorStyle'
  | 'itemEntering'
  | 'itemExiting'
  | 'overflow'
  | 'showDropIndicator'
  | 'strategy'
> & {
  styleProps: StyleProps;
};

function SortableFlexComponent({
  strategy,
  styleProps,
  ...rest
}: SortableFlexComponentProps) {
  const { usesAbsoluteLayout } = useCommonValuesContext();
  const { handleContainerMeasurement } = useMeasurementsContext();

  const {
    alignContent,
    alignItems,
    flexDirection,
    flexWrap,
    height,
    justifyContent,
    width
  } = styleProps;

  useOrderUpdater(strategy, FLEX_STRATEGIES);

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
    <SortableContainer
      {...rest}
      containerStyle={[baseContainerStyle, animatedContainerStyle]}
      itemStyle={styles.styleOverride}
      onLayout={runOnUI((w, h) => {
        handleContainerMeasurement(w, h);
      })}
    />
  );
}

const styles = StyleSheet.create({
  styleOverride: {
    // This is needed to prevent items from stretching (which is default behavior)
    alignSelf: 'flex-start'
  }
});

export default SortableFlex;
