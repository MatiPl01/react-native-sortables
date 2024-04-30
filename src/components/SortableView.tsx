import { View, type ViewProps } from 'react-native';
import { MeasurementsProvider } from '../contexts';
import { validateChildren } from '../utils';
import { ReactNode } from 'react';
import { DraggableItem } from './shared';

export type SortableViewProps = {
  enableDrag?: boolean;
} & ViewProps;

export default function SortableView({ children, ...viewProps }: SortableViewProps) {
  return (
    <MeasurementsProvider>
      <View {...viewProps}>
        <SortableViewInner>{children}</SortableViewInner>
      </View>
    </MeasurementsProvider>
  );
}

function SortableViewInner({ children }: { children: ReactNode }) {
  return validateChildren(children).map(([key, child]) => (
    <DraggableItem key={key} id={key}>{child}</DraggableItem>
  ))
}
