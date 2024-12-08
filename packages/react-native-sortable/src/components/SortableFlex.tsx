import { type ReactElement } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

import { DEFAULT_SORTABLE_FLEX_PROPS } from '../constants';
import {
  FlexLayoutProvider,
  SharedProvider,
  useCommonValuesContext,
  useFlexLayoutContext,
  useFlexOrderUpdater
} from '../providers';
import { Dimensions, type SortableFlexProps } from '../types';
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
              itemEntering={itemEntering}
              itemExiting={itemExiting}
              flexStyle={flexStyle}
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
  itemEntering,
  itemExiting,
  flexStyle
}: SortableFlexInnerProps) {
  const { canSwitchToAbsoluteLayout, containerHeight } =
    useCommonValuesContext();
  const { flexDirection } = useFlexLayoutContext();

  useFlexOrderUpdater();

  const animatedContainerStyle = useAnimatedStyle(() =>
    canSwitchToAbsoluteLayout.value
      ? {
          alignItems: 'flex-start',
          minHeight: containerHeight.value,
          justifyContent: 'flex-start',
          alignContent: 'flex-start'
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
    flexGrow: 1,
    flexDirection: 'row'
  }
});

export default SortableFlex;
