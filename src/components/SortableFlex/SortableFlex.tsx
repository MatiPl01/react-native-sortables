import { type ReactElement, useRef } from 'react';
import type { ViewProps, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import type { FlexProps } from '../../contexts';
import { FlexLayoutProvider, useFlexLayoutContext } from '../../contexts';
import { MeasurementsProvider, PositionsProvider } from '../../contexts/shared';
import { areArraysDifferent, validateChildren } from '../../utils';
import { DraggableView } from '../shared';

export type SortableFlexProps = ViewProps;

function SortableFlex({ children, ...viewProps }: SortableFlexProps) {
  const childrenArray = validateChildren(children);
  const itemKeysRef = useRef<Array<string>>([]);

  const newItemKeys = childrenArray.map(([key]) => key);
  if (areArraysDifferent(itemKeysRef.current, newItemKeys)) {
    itemKeysRef.current = newItemKeys;
  }

  return (
    <MeasurementsProvider itemsCount={childrenArray.length}>
      <PositionsProvider itemKeys={itemKeysRef.current}>
        <FlexLayoutProvider {...((viewProps.style as FlexProps) ?? {})}>
          <SortableFlexInner
            childrenArray={childrenArray}
            viewProps={viewProps}
          />
        </FlexLayoutProvider>
      </PositionsProvider>
    </MeasurementsProvider>
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
        <DraggableView itemKey={key} key={key}>
          {child}
        </DraggableView>
      ))}
    </Animated.View>
  );
}

export default SortableFlex;
