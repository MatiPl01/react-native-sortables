import { View, type ViewProps } from 'react-native';

export type SortableViewProps = {
  enableDrag?: boolean;
} & ViewProps;

export default function SortableView({ children, ...viewProps }: SortableViewProps) {
  return <View {...viewProps}>{children}</View>;
}
