import { type ReactElement } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_FLEX_PROPS } from '../constants';
import { useStableCallback } from '../hooks';
import {
  FlexLayoutProvider,
  LayerProvider,
  SharedProvider,
  useCommonValuesContext,
  useFlexLayoutContext
} from '../providers';
import type {
  Dimensions,
  DragEndCallback,
  DropIndicatorSettings,
  SortableFlexProps
} from '../types';
import {
  extractFlexContainerProps,
  getPropsWithDefaults,
  isInternalFunction,
  orderItems,
  validateChildren
} from '../utils';
import { DraggableView, SortableContainer } from './shared';

function SortableFlex(props: SortableFlexProps) {
  const {
    rest: { children, onLayout, strategy, style, ...viewProps },
    sharedProps: {
      DropIndicatorComponent,
      animateHeight,
      dropIndicatorStyle,
      itemEntering,
      itemExiting,
      onDragEnd: _onDragEnd,
      showDropIndicator,
      ...sharedProps
    }
  } = getPropsWithDefaults(props, DEFAULT_SORTABLE_FLEX_PROPS);
  const parentDimensions = useSharedValue<Dimensions | null>(null);

  const childrenArray = validateChildren(children);
  const itemKeys = childrenArray.map(([key]) => key);

  const [flexStyle, restStyle] = extractFlexContainerProps(style);

  const onDragEnd = useStableCallback<DragEndCallback>(params => {
    if (!_onDragEnd) {
      return;
    }
    const updatedParams = {
      ...params,
      order<I>(data: Array<I>) {
        return orderItems(data, itemKeys, params, true);
      }
    };
    // For cases when user provides onOrderChange created via a helper
    // useOrderChangeHandler hook
    if (isInternalFunction(_onDragEnd, 'DragEndCallback')) {
      return _onDragEnd(updatedParams);
    }
    // Add the data property for the sortable grid if a custom user callback is provided
    _onDragEnd(updatedParams);
  });

  return (
    <LayerProvider>
      <View
        {...viewProps}
        style={restStyle}
        onLayout={event => {
          onLayout?.(event);
          const layout = event.nativeEvent.layout;
          parentDimensions.value = {
            height: layout.height,
            width: layout.width
          };
        }}>
        <View style={styles.container}>
          <SharedProvider
            {...sharedProps}
            itemKeys={itemKeys}
            parentDimensions={parentDimensions}
            onDragEnd={onDragEnd}>
            <FlexLayoutProvider
              {...style}
              itemsCount={itemKeys.length}
              strategy={strategy}>
              <SortableFlexInner
                animateHeight={animateHeight}
                childrenArray={childrenArray}
                DropIndicatorComponent={DropIndicatorComponent}
                dropIndicatorStyle={dropIndicatorStyle}
                flexStyle={flexStyle}
                itemEntering={itemEntering}
                itemExiting={itemExiting}
                showDropIndicator={showDropIndicator}
              />
            </FlexLayoutProvider>
          </SharedProvider>
        </View>
      </View>
    </LayerProvider>
  );
}

type SortableFlexInnerProps = {
  childrenArray: Array<[string, ReactElement]>;
  flexStyle: ViewStyle;
} & DropIndicatorSettings &
  Required<
    Pick<SortableFlexProps, 'animateHeight' | 'itemEntering' | 'itemExiting'>
  >;

function SortableFlexInner({
  childrenArray,
  flexStyle,
  itemEntering,
  itemExiting,
  ...containerProps
}: SortableFlexInnerProps) {
  const { canSwitchToAbsoluteLayout } = useCommonValuesContext();
  const { flexDirection } = useFlexLayoutContext();

  const animatedFlexStyle = useAnimatedStyle(() =>
    canSwitchToAbsoluteLayout.value
      ? {
          alignContent: 'flex-start',
          alignItems: 'flex-start',
          justifyContent: 'flex-start'
        }
      : {}
  );

  return (
    <SortableContainer
      {...containerProps}
      innerStyle={[flexStyle, animatedFlexStyle]}>
      {childrenArray.map(([key, child]) => (
        <DraggableView
          entering={itemEntering}
          exiting={itemExiting}
          itemKey={key}
          key={key}
          // When flexDirection is row-reverse, we need to reverse the x-axis
          // because right offset in absolute position is calculated from the right edge
          reverseXAxis={flexDirection === 'row-reverse'}>
          {child}
        </DraggableView>
      ))}
    </SortableContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexGrow: 1
  }
});

export default SortableFlex;
