import { type ReactElement } from 'react';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

import {
  DEFAULT_SORTABLE_FLEX_PROPS,
  EMPTY_OBJECT,
  IS_WEB
} from '../constants';
import { useDragEndHandler } from '../hooks';
import {
  FLEX_STRATEGIES,
  FlexLayoutProvider,
  OrderUpdaterComponent,
  SharedProvider,
  useCommonValuesContext,
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
      debug,
      dimensionsAnimationType,
      DropIndicatorComponent,
      dropIndicatorStyle,
      itemEntering,
      itemExiting,
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

  const onDragEnd = useDragEndHandler(_onDragEnd, {
    order: params =>
      function <I>(data: Array<I>) {
        return orderItems(data, itemKeys, params, true);
      }
  });

  return (
    <SharedProvider
      {...sharedProps}
      controlledContainerDimensions={controlledContainerDimensions}
      debug={debug}
      itemKeys={itemKeys}
      initialCanMeasureItems
      onDragEnd={onDragEnd}>
      <FlexLayoutProvider {...styleProps} itemsCount={itemKeys.length}>
        <OrderUpdaterComponent
          key={useStrategyKey(strategy)}
          predefinedStrategies={FLEX_STRATEGIES}
          strategy={strategy}
          triggerOrigin={reorderTriggerOrigin}
        />
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
      style={[baseContainerStyle, animatedContainerStyle]}>
      {childrenArray.map(([key, child]) => (
        <DraggableView
          entering={itemEntering ?? undefined}
          exiting={itemExiting ?? undefined}
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
