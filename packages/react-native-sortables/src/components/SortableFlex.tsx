import { type ReactElement } from 'react';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_FLEX_PROPS } from '../constants';
import { useDragEndHandler } from '../hooks';
import {
  FLEX_STRATEGIES,
  FlexLayoutProvider,
  OrderUpdaterComponent,
  SharedProvider,
  useFlexLayoutContext,
  useStrategyKey
} from '../providers';
import type { DropIndicatorSettings, SortableFlexProps } from '../types';
import { getPropsWithDefaults, orderItems, validateChildren } from '../utils';
import { DraggableView, SortableContainer } from './shared';

function SortableFlex(props: SortableFlexProps) {
  const {
    rest: {
      children,
      height,
      onDragEnd: _onDragEnd,
      strategy,
      width,
      ...styleProps
    },
    sharedProps: {
      DropIndicatorComponent,
      animateHeight,
      animateWidth,
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

  const childrenArray = validateChildren(children);
  const itemKeys = childrenArray.map(([key]) => key);

  const { flexDirection, flexWrap } = styleProps;
  const controlledContainerDimensions = useDerivedValue(() => {
    if (flexWrap === 'nowrap') {
      return { height: height === undefined, width: width === undefined };
    }
    return flexDirection.startsWith('row')
      ? { height: height === undefined, width: false }
      : { height: false, width: width === undefined };
  }, [flexWrap, flexDirection, height, width]);

  const onDragEnd = useDragEndHandler(_onDragEnd, params => ({
    ...params,
    order<I>(data: Array<I>) {
      return orderItems(data, itemKeys, params, true);
    }
  }));

  return (
    <SharedProvider
      {...sharedProps}
      controlledContainerDimensions={controlledContainerDimensions}
      initialItemsStyleOverride={styles.styleOverride}
      itemKeys={itemKeys}
      sortableKeys={itemKeys}
      onDragEnd={onDragEnd}>
      <FlexLayoutProvider {...styleProps} itemsCount={itemKeys.length}>
        <OrderUpdaterComponent
          key={useStrategyKey(strategy)}
          predefinedStrategies={FLEX_STRATEGIES}
          strategy={strategy}
          triggerOrigin={reorderTriggerOrigin}
          useAdditionalValues={useFlexLayoutContext}
        />
        <SortableFlexInner
          animateHeight={animateHeight}
          animateWidth={animateWidth}
          childrenArray={childrenArray}
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
}

type SortableFlexInnerProps = {
  childrenArray: Array<[string, ReactElement]>;
  style: StyleProp<ViewStyle>;
} & DropIndicatorSettings &
  Required<
    Pick<
      SortableFlexProps,
      | 'animateHeight'
      | 'animateWidth'
      | 'itemEntering'
      | 'itemExiting'
      | 'itemsLayout'
      | 'overflow'
    >
  >;

function SortableFlexInner({
  childrenArray,
  itemEntering,
  itemExiting,
  itemsLayout,
  style,
  ...containerProps
}: SortableFlexInnerProps) {
  return (
    <SortableContainer {...containerProps} style={style}>
      {childrenArray.map(([key, child]) => (
        <DraggableView
          entering={itemEntering ?? undefined}
          exiting={itemExiting ?? undefined}
          itemKey={key}
          key={key}
          layout={itemsLayout ?? undefined}>
          {child}
        </DraggableView>
      ))}
    </SortableContainer>
  );
}

const styles = StyleSheet.create({
  styleOverride: {
    // This is needed to prevent items from stretching (which is default behavior)
    alignSelf: 'flex-start'
  }
});

export default SortableFlex;
