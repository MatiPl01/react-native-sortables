import { cloneElement, type ReactElement, useRef } from 'react';
import { View, type ViewProps } from 'react-native';

import type { FlexProps } from '../../contexts';
import {
  FlexLayoutProvider,
  SharedProvider,
  useFlexLayoutContext,
  useFlexOrderUpdater
} from '../../contexts';
import type { ReorderStrategy, SharedProps } from '../../types';
import {
  areArraysDifferent,
  getPropsWithDefaults,
  validateChildren
} from '../../utils';
import { DraggableView } from '../shared';

export type SortableFlexProps = SharedProps & ViewProps;

function SortableFlex(props: SortableFlexProps) {
  const {
    rest: viewProps,
    sharedProps: { reorderStrategy, ...providerProps }
  } = getPropsWithDefaults(props);

  const childrenArray = validateChildren(viewProps.children);
  const itemKeysRef = useRef<Array<string>>([]);

  const newItemKeys = childrenArray.map(([key]) => key);
  if (areArraysDifferent(itemKeysRef.current, newItemKeys)) {
    itemKeysRef.current = newItemKeys;
  }

  return (
    <SharedProvider {...providerProps} itemKeys={itemKeysRef.current}>
      <FlexLayoutProvider {...((viewProps.style as FlexProps) ?? {})}>
        <SortableFlexInner
          childrenArray={childrenArray}
          reorderStrategy={reorderStrategy}
          viewProps={viewProps}
        />
      </FlexLayoutProvider>
    </SharedProvider>
  );
}

type SortableFlexInnerProps = {
  childrenArray: Array<[string, ReactElement]>;
  viewProps: ViewProps;
  reorderStrategy: ReorderStrategy;
};

function SortableFlexInner({
  childrenArray,
  reorderStrategy,
  viewProps
}: SortableFlexInnerProps) {
  const { flexDirection, stretch } = useFlexLayoutContext();

  useFlexOrderUpdater(reorderStrategy);

  return (
    <View {...viewProps} style={viewProps.style}>
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
    </View>
  );
}

export default SortableFlex;
