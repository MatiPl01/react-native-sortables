import { type ReactElement, useMemo } from 'react';
import { View, type ViewStyle } from 'react-native';
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
import type { SortableFlexProps } from '../types';
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

  const childrenArray = validateChildren(viewProps.children);

  const itemKeys = childrenArray.map(([key]) => key);
  const { style: viewStyle, ...restProps } = viewProps;

  const initialStyleOverrides = useMemo(
    () =>
      Object.fromEntries(
        itemKeys.map(key => [
          key,
          {
            alignContent: viewStyle.alignContent,
            alignItems: viewStyle.alignItems,
            flexDirection: viewStyle.flexDirection
          }
        ])
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const itemStyleOverrides = useSharedValue<Record<string, ViewStyle>>(
    initialStyleOverrides
  );

  const [flexStyles, restStyles] = extractFlexContainerProps(viewStyle);

  return (
    <View {...restProps} style={restStyles}>
      <SharedProvider
        {...sharedProps}
        itemKeys={itemKeys}
        itemStyleOverrides={itemStyleOverrides}
        measureParent>
        <FlexLayoutProvider {...viewStyle} itemsCount={itemKeys.length}>
          <SortableFlexInner
            childrenArray={childrenArray}
            itemEntering={itemEntering}
            itemExiting={itemExiting}
            style={flexStyles}
          />
        </FlexLayoutProvider>
      </SharedProvider>
    </View>
  );
}

type SortableFlexInnerProps = {
  childrenArray: Array<[string, ReactElement]>;
  style: ViewStyle;
} & Required<Pick<SortableFlexProps, 'itemEntering' | 'itemExiting'>>;

function SortableFlexInner({
  childrenArray,
  itemEntering,
  itemExiting,
  style
}: SortableFlexInnerProps) {
  const { canSwitchToAbsoluteLayout, containerHeight } =
    useCommonValuesContext();
  const { flexDirection } = useFlexLayoutContext();

  useFlexOrderUpdater();

  const animatedContainerStyle = useAnimatedStyle(() =>
    canSwitchToAbsoluteLayout.value
      ? {
          alignItems: 'flex-start',
          height: containerHeight.value,
          justifyContent: 'flex-start'
        }
      : {}
  );

  return (
    <Animated.View style={[style, animatedContainerStyle]}>
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

export default SortableFlex;
