import type { ReactElement } from 'react';
import { View, type ViewProps } from 'react-native';

import { MeasurementsProvider } from '../../contexts';
import { validateChildren } from '../../utils';
import { DraggableView } from '../shared';

export type SortableViewProps = {
  enableDrag?: boolean;
} & ViewProps;

function SortableView({ children, ...viewProps }: SortableViewProps) {
  const childrenArray = validateChildren(children);

  return (
    <MeasurementsProvider itemsCount={childrenArray.length}>
      <View {...viewProps}>
        <SortableViewInner childrenArray={childrenArray} />
      </View>
    </MeasurementsProvider>
  );
}

type SortableViewInnerProps = {
  childrenArray: Array<[string, ReactElement]>;
};

function SortableViewInner({ childrenArray }: SortableViewInnerProps) {
  return childrenArray.map(([key, child]) => (
    <DraggableView id={key} key={key}>
      {child}
    </DraggableView>
  ));
}

export default SortableView;
