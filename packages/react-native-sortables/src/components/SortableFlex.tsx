import { type ReactElement, useMemo } from 'react';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import { runOnUI, useAnimatedStyle } from 'react-native-reanimated';

import {
  DEFAULT_SORTABLE_FLEX_PROPS,
  EMPTY_OBJECT,
  IS_WEB
} from '../constants';
import { useDragEndHandler } from '../hooks';
import {
  FlexProvider,
  useCommonValuesContext,
  useMeasurementsContext
} from '../providers';
import type { DropIndicatorSettings, SortableFlexProps } from '../types';
import { getPropsWithDefaults, orderItems, validateChildren } from '../utils';
import { DraggableView, SortableContainer } from './shared';

const CONTROLLED_ITEM_DIMENSIONS = {
  height: false,
  width: false
};

function SortableFlex(props: SortableFlexProps) {
  const {
    rest: { children, onDragEnd: _onDragEnd, strategy, ...styleProps },
    sharedProps: {
      debug,
      dimensionsAnimationType,
      DropIndicatorComponent,
      dropIndicatorStyle,
      itemEntering,
      itemExiting,
      overflow,
      showDropIndicator,
      ...sharedProps
    }
  } = getPropsWithDefaults(props, DEFAULT_SORTABLE_FLEX_PROPS);

  const childrenArray = validateChildren(children);
  const itemKeys = childrenArray.map(([key]) => key);

  const { flexDirection, flexWrap, height, width, ...restStyle } = styleProps;
  const isColumn = flexDirection.startsWith('column');

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
        return orderItems(data, itemKeys, params, true);
      }
  });

  const containerStyle = [
    restStyle,
    {
      flexDirection,
      flexWrap,
      height: height === 'fill' ? undefined : height,
      width: width === 'fill' ? undefined : width
    }
  ];

  return (
    <FlexProvider
      {...sharedProps}
      controlledContainerDimensions={controlledContainerDimensions}
      controlledItemDimensions={CONTROLLED_ITEM_DIMENSIONS}
      debug={debug}
      itemKeys={itemKeys}
      strategy={strategy}
      styleProps={styleProps}
      onDragEnd={onDragEnd}>
      <SortableFlexInner
        childrenArray={childrenArray}
        debug={debug}
        dimensionsAnimationType={dimensionsAnimationType}
        DropIndicatorComponent={DropIndicatorComponent}
        dropIndicatorStyle={dropIndicatorStyle}
        itemEntering={itemEntering}
        itemExiting={itemExiting}
        overflow={overflow}
        showDropIndicator={showDropIndicator}
        style={containerStyle}
      />
    </FlexProvider>
  );
}

type SortableFlexInnerProps = DropIndicatorSettings &
  Required<
    Pick<
      SortableFlexProps,
      | 'debug'
      | 'dimensionsAnimationType'
      | 'itemEntering'
      | 'itemExiting'
      | 'overflow'
    >
  > & {
    childrenArray: Array<[string, ReactElement]>;
    style: StyleProp<ViewStyle>;
  };

function SortableFlexInner({
  childrenArray,
  itemEntering,
  itemExiting,
  style,
  ...containerProps
}: SortableFlexInnerProps) {
  const { usesAbsoluteLayout } = useCommonValuesContext();
  const { handleContainerMeasurement } = useMeasurementsContext();

  let relativeLayoutStyle: ViewStyle = EMPTY_OBJECT;
  let baseContainerStyle = style;
  // On web reanimated animated style might not override the plan js style
  // so we have to filter out flex properties
  if (IS_WEB) {
    const {
      alignItems,
      flexDirection,
      flexWrap,
      justifyContent,
      ...restStyle
    } = StyleSheet.flatten(style);

    baseContainerStyle = restStyle;
    relativeLayoutStyle = {
      alignItems,
      flexDirection,
      flexWrap,
      justifyContent
    };
  }

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
      : relativeLayoutStyle
  );

  return (
    <SortableContainer
      {...containerProps}
      style={[baseContainerStyle, animatedContainerStyle]}
      onLayout={runOnUI((width, height) => {
        handleContainerMeasurement(width, height);
      })}>
      {childrenArray.map(([key, child]) => (
        <DraggableView
          itemEntering={itemEntering}
          itemExiting={itemExiting}
          itemKey={key}
          key={key}
          style={styles.styleOverride}>
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
