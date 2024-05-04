import { type ReactElement, useRef } from 'react';
import type { ViewProps, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import type { FlexProps } from '../../contexts';
import {
  FlexLayoutProvider,
  SharedProvider,
  useFlexLayoutContext
} from '../../contexts';
import { areArraysDifferent, validateChildren } from '../../utils';
import SortableFlexItem from './SortableFlexItem';

export type SortableFlexProps = {
  dragEnabled?: boolean;
} & ViewProps;

function SortableFlex({
  children,
  dragEnabled = true,
  ...viewProps
}: SortableFlexProps) {
  const childrenArray = validateChildren(children);
  const itemKeysRef = useRef<Array<string>>([]);

  const newItemKeys = childrenArray.map(([key]) => key);
  if (areArraysDifferent(itemKeysRef.current, newItemKeys)) {
    itemKeysRef.current = newItemKeys;
  }

  return (
    <SharedProvider enabled={dragEnabled} itemKeys={itemKeysRef.current}>
      <FlexLayoutProvider {...((viewProps.style as FlexProps) ?? {})}>
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
  const { containerHeight } = useFlexLayoutContext();

  const animatedContainerHeightStyle = useAnimatedStyle(() => ({
    height:
      containerHeight.value === -1
        ? (viewProps?.style as ViewStyle)?.height
        : containerHeight.value
  }));

  return (
    <Animated.View
      {...viewProps}
      style={[viewProps.style, animatedContainerHeightStyle]}>
      {childrenArray.map(([key, child]) => (
        <SortableFlexItem itemKey={key} key={key}>
          {child}
        </SortableFlexItem>
      ))}
    </Animated.View>
  );
}

export default SortableFlex;
