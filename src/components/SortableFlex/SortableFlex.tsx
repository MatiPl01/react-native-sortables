import { cloneElement, type ReactElement, useRef } from 'react';
import type { ViewProps, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import type { FlexProps } from '../../contexts';
import {
  FlexLayoutProvider,
  SharedProvider,
  useFlexLayoutContext
} from '../../contexts';
import type { SharedProps } from '../../types';
import {
  areArraysDifferent,
  getPropsWithDefaults,
  validateChildren
} from '../../utils';
import { DraggableView } from '../shared';

export type SortableFlexProps = SharedProps & ViewProps;

function SortableFlex(props: SortableFlexProps) {
  const { rest: viewProps, sharedProps } = getPropsWithDefaults(props);

  const childrenArray = validateChildren(viewProps.children);
  const itemKeysRef = useRef<Array<string>>([]);

  const newItemKeys = childrenArray.map(([key]) => key);
  if (areArraysDifferent(itemKeysRef.current, newItemKeys)) {
    itemKeysRef.current = newItemKeys;
  }

  return (
    <SharedProvider {...sharedProps} itemKeys={itemKeysRef.current}>
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
  const { containerHeight, reverseXAxis, stretch } = useFlexLayoutContext();

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
        <DraggableView itemKey={key} key={key} reverseXAxis={reverseXAxis}>
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
