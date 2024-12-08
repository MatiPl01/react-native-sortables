import { type ReactElement } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

import { DEFAULT_SORTABLE_FLEX_PROPS } from '../constants';
import {
  FlexLayoutProvider,
  SharedProvider,
  useCommonValuesContext,
  useContainerOverflow,
  useFlexLayoutContext,
  useFlexOrderUpdater
} from '../providers';
import type { Dimensions, SortableFlexProps } from '../types';
import {
  extractFlexContainerProps,
  getPropsWithDefaults,
  validateChildren
} from '../utils';
import { DraggableView } from './shared';

function SortableFlex(props: SortableFlexProps) {
  const {
    rest: viewProps,
    sharedProps: { itemEntering, itemExiting, ...sharedProps }
  } = getPropsWithDefaults(props, DEFAULT_SORTABLE_FLEX_PROPS);
  const parentDimensions = useSharedValue<Dimensions | null>(null);

  const childrenArray = validateChildren(viewProps.children);
  const itemKeys = childrenArray.map(([key]) => key);

  const [flexStyle, restStyle] = extractFlexContainerProps(viewProps.style);

  return (
    <View
      style={restStyle}
      onLayout={({ nativeEvent: { layout } }) => {
        parentDimensions.value = {
          height: layout.height,
          width: layout.width
        };
      }}>
      <View style={styles.container}>
        <SharedProvider
          {...sharedProps}
          itemKeys={itemKeys}
          parentDimensions={parentDimensions}>
          <FlexLayoutProvider {...viewProps.style} itemsCount={itemKeys.length}>
            <SortableFlexInner
              childrenArray={childrenArray}
              flexStyle={flexStyle}
              itemEntering={itemEntering}
              itemExiting={itemExiting}
            />
          </FlexLayoutProvider>
        </SharedProvider>
      </View>
    </View>
  );
}

type SortableFlexInnerProps = {
  childrenArray: Array<[string, ReactElement]>;
  flexStyle: ViewStyle;
} & Required<Pick<SortableFlexProps, 'itemEntering' | 'itemExiting'>>;

function SortableFlexInner({
  childrenArray,
  flexStyle,
  itemEntering,
  itemExiting
}: SortableFlexInnerProps) {
  const { canSwitchToAbsoluteLayout, containerHeight } =
    useCommonValuesContext();
  const { flexDirection } = useFlexLayoutContext();
  const overflow = useContainerOverflow();

  useFlexOrderUpdater();

  const animatedContainerStyle = useAnimatedStyle(() =>
    canSwitchToAbsoluteLayout.value
      ? {
          alignContent: 'flex-start',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          minHeight: containerHeight.value,
          overflow: overflow.value
        }
      : {}
  );

  return (
    <Animated.View style={[flexStyle, animatedContainerStyle]}>
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexGrow: 1
  }
});

export default SortableFlex;
