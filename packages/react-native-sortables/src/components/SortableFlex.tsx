import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_FLEX_PROPS } from '../constants';
import { useDragEndHandler, useStoreItemsUpdater } from '../hooks';
import {
  FLEX_STRATEGIES,
  FlexLayoutProvider,
  OrderUpdaterComponent,
  SharedProvider,
  useFlexLayoutContext,
  useStrategyKey
} from '../providers';
import type { DragEndCallback, SortableFlexProps } from '../types';
import {
  childrenToArray,
  getPropsWithDefaults,
  orderItems,
  typedMemo
} from '../utils';
import { SortableContainer } from './shared';

function SortableFlex({
  children,
  onDragEnd: _onDragEnd,
  ...rest
}: SortableFlexProps) {
  const childrenArray = useMemo(() => childrenToArray(children), [children]);
  const itemKeys = useMemo(
    () => childrenArray.map(([key]) => key),
    [childrenArray]
  );

  const onDragEnd = useDragEndHandler(_onDragEnd, {
    order: params =>
      function <I>(data: Array<I>) {
        return orderItems(data, itemKeys, params, true);
      }
  });

  useStoreItemsUpdater(itemKeys, childrenArray);

  return <SortableFlexInner {...rest} onDragEnd={onDragEnd} />;
}

const SortableFlexInner = typedMemo(function SortableFlexInner(
  props: {
    onDragEnd: DragEndCallback;
  } & Omit<SortableFlexProps, 'children' | 'onDragEnd'>
) {
  const {
    rest: { height, onDragEnd, strategy, width, ...styleProps },
    sharedProps: {
      DropIndicatorComponent,
      dimensionsAnimationType,
      dropIndicatorStyle,
      itemEntering,
      itemExiting,
      itemsLayout,
      overflow,
      reorderTriggerOrigin,
      showDropIndicator,
      ...sharedProps
    }
  } = getPropsWithDefaults(props, DEFAULT_SORTABLE_FLEX_PROPS);

  const { flexDirection, flexWrap } = styleProps;
  const controlledContainerDimensions = useDerivedValue(() => {
    if (flexWrap === 'nowrap') {
      return { height: height === undefined, width: width === undefined };
    }
    return flexDirection.startsWith('row')
      ? { height: height === undefined, width: false }
      : { height: false, width: width === undefined };
  }, [flexWrap, flexDirection, height, width]);

  return (
    <SharedProvider
      {...sharedProps}
      controlledContainerDimensions={controlledContainerDimensions}
      initialItemsStyleOverride={styles.styleOverride}
      onDragEnd={onDragEnd}>
      <FlexLayoutProvider {...styleProps}>
        <OrderUpdaterComponent
          key={useStrategyKey(strategy)}
          predefinedStrategies={FLEX_STRATEGIES}
          strategy={strategy}
          triggerOrigin={reorderTriggerOrigin}
          useAdditionalValues={useFlexLayoutContext}
        />
        <SortableContainer
          dimensionsAnimationType={dimensionsAnimationType}
          DropIndicatorComponent={DropIndicatorComponent}
          dropIndicatorStyle={dropIndicatorStyle}
          itemEntering={itemEntering}
          itemExiting={itemExiting}
          itemsLayout={itemsLayout}
          overflow={overflow}
          showDropIndicator={showDropIndicator}
          style={[
            styleProps,
            {
              height: height === 'fill' ? undefined : height,
              width: width === 'fill' ? undefined : width
            }
          ]}
        />
      </FlexLayoutProvider>
    </SharedProvider>
  );
});

const styles = StyleSheet.create({
  styleOverride: {
    // This is needed to prevent items from stretching (which is default behavior)
    alignSelf: 'flex-start'
  }
});

export default SortableFlex;
