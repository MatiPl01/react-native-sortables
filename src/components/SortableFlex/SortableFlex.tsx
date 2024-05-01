import type { ReactElement } from 'react';
import { View, type ViewProps } from 'react-native';

import { MeasurementsProvider } from '../../contexts/shared';
import { validateChildren } from '../../utils';
import { DraggableView } from '../shared';

export type SortableFlexProps = {
  enableDrag?: boolean;
} & ViewProps;

function SortableFlex({ children, ...viewProps }: SortableFlexProps) {
  const childrenArray = validateChildren(children);

  return (
    <MeasurementsProvider itemsCount={childrenArray.length}>
      <View {...viewProps}>
        <SortableFlexInner childrenArray={childrenArray} />
      </View>
    </MeasurementsProvider>
  );
}

type SortableFlexInnerProps = {
  childrenArray: Array<[string, ReactElement]>;
};

function SortableFlexInner({ childrenArray }: SortableFlexInnerProps) {
  return childrenArray.map(([key, child]) => (
    <DraggableView id={key} key={key}>
      {child}
    </DraggableView>
  ));
}

export default SortableFlex;
