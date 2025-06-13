import type { PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';

import { LayerProvider } from '../../providers';

/** Props for the Sortable Layer component */
export type SortableLayerProps = PropsWithChildren<
  ViewProps & {
    /** When true, disables automatic zIndex management during drag operations
     * @default false
     */
    disabled?: boolean;
  }
>;

export default function SortableLayer({
  children,
  disabled = false
}: SortableLayerProps) {
  return <LayerProvider disabled={disabled}>{children}</LayerProvider>;
}
