import { type ReactElement } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_FLEX_PROPS } from '../constants';
import {
  FlexLayoutProvider,
  SharedProvider,
  useCommonValuesContext,
  useFlexLayoutContext,
  useFlexOrderUpdater
} from '../providers';
import type {
  Dimensions,
  DropIndicatorSettings,
  SortableFlexProps
} from '../types';
import {
  extractFlexContainerProps,
  getPropsWithDefaults,
  validateChildren
} from '../utils';
import { DraggableView, SortableContainer } from './shared';

function SortableFlex(props: SortableFlexProps) {
  const {
    rest: viewProps,
    sharedProps: {
      DropIndicatorComponent,
      animateHeight,
      dropIndicatorStyle,
      itemEntering,
      itemExiting,
      showDropIndicator,
      ...sharedProps
    }
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
  useFlexOrderUpdater();

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
