import { cloneElement, type ReactElement, useRef } from 'react';
import type { ViewProps, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { DEFAULT_SORTABLE_FLEX_PROPS } from '../../constants';
import {
  FlexLayoutProvider,
  SharedProvider,
  useCommonValuesContext,
  useFlexLayoutContext,
  useFlexOrderUpdater
} from '../../providers';
import type { SortableFlexProps } from '../../types';
import {
  areArraysDifferent,
  getPropsWithDefaults,
  validateChildren
} from '../../utils';
import { DraggableView } from '../shared';

function SortableFlex(props: SortableFlexProps) {
  const { rest: viewProps, sharedProps } = getPropsWithDefaults(
    props,
    DEFAULT_SORTABLE_FLEX_PROPS
  );

  const childrenArray = validateChildren(viewProps.children);
  const itemKeysRef = useRef<Array<string>>([]);

  const newItemKeys = childrenArray.map(([key]) => key);
  if (areArraysDifferent(itemKeysRef.current, newItemKeys)) {
    itemKeysRef.current = newItemKeys;
  }

  return (
    <SharedProvider {...sharedProps} itemKeys={itemKeysRef.current}>
      <FlexLayoutProvider {...((viewProps.style as ViewStyle) ?? {})}>
        <SortableFlexInner
          childrenArray={childrenArray}
          viewProps={viewProps}
        />
      </FlexLayoutProvider>
    </SharedProvider>
  );
}

type SortableFlexInnerProps = {
  childrenArray: Array<[string, ReactElement]>;
  viewProps: ViewProps;
};

function SortableFlexInner({
  childrenArray,
  viewProps
}: SortableFlexInnerProps) {
  const { canSwitchToAbsoluteLayout, containerHeight } =
    useCommonValuesContext();
  const { flexDirection, stretch } = useFlexLayoutContext();

  useFlexOrderUpdater();

  const animatedContainerStyle = useAnimatedStyle(() => {
    if (containerHeight.value === null) {
      return {};
    }
    const style: ViewStyle = { height: containerHeight.value };
    if (canSwitchToAbsoluteLayout) {
      style.justifyContent = 'flex-start';
      style.alignItems = 'flex-start';
    }
    return style;
  });

  return (
    <Animated.View
      {...viewProps}
      style={[viewProps.style, animatedContainerStyle]}>
      {childrenArray.map(([key, child]) => (
        <DraggableView
          itemKey={key}
          key={key}
          // When flexDirection is row-reverse, we need to reverse the x-axis
          // because right offset in absolute position is calculated from the right edge
          reverseXAxis={flexDirection === 'row-reverse'}>
          {cloneElement(child, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            style: [child.props?.style, stretch && { flexGrow: 1 }]
          })}
        </DraggableView>
      ))}
    </Animated.View>
  );
}

export default SortableFlex;
