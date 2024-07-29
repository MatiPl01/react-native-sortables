import type { PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';

import { LayerProvider } from '../../contexts';

type SortableLayerProps = PropsWithChildren<{ disabled?: boolean } & ViewProps>;

export default function SortableLayer({
  children,
  disabled = false
}: SortableLayerProps) {
  return <LayerProvider disabled={disabled}>{children}</LayerProvider>;
}
