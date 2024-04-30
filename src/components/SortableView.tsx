import { View, type ViewProps } from 'react-native';
import { MeasurementsProvider } from '../contexts';
import { validateChildren } from '../utils';
import { ReactNode } from 'react';

export type SortableViewProps = {
  enableDrag?: boolean;
} & ViewProps;

export default function SortableView({ children, ...viewProps }: SortableViewProps) {
  return (
    <MeasurementsProvider>
      <View {...viewProps}>
        <SortableGridInner>{children}</SortableGridInner>
      </View>
    </MeasurementsProvider>
  );
}

function SortableGridInner({ children }: { children: ReactNode }) {
  return validateChildren(children).map(([key, child]) => (
    <View key={key}>{child}</View>
  ))
}
