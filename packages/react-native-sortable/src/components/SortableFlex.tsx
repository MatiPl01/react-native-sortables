import { type ReactElement, useMemo } from 'react';
import type { ViewProps, ViewStyle } from 'react-native';
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
import { getPropsWithDefaults, validateChildren } from '../utils';
import { DraggableView } from './shared';

function SortableFlex(props: SortableFlexProps) {
  const {
    rest: viewProps,
    sharedProps: { itemEntering, itemExiting, ...sharedProps }
  } = getPropsWithDefaults(props, DEFAULT_SORTABLE_FLEX_PROPS);

  const childrenArray = validateChildren(viewProps.children);

  const itemKeys = childrenArray.map(([key]) => key);
  const viewStyle = viewProps.style ?? {};

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

  return (
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
          viewProps={viewProps}
        />
      </FlexLayoutProvider>
    </SharedProvider>
  );
}

type SortableFlexInnerProps = {
  childrenArray: Array<[string, ReactElement]>;
  viewProps: ViewProps;
} & Required<Pick<SortableFlexProps, 'itemEntering' | 'itemExiting'>>;

function SortableFlexInner({
  childrenArray,
  itemEntering,
  itemExiting,
  viewProps
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
    <Animated.View
      {...viewProps}
      style={[viewProps.style, animatedContainerStyle]}>
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
