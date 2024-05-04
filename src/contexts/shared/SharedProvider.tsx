import type { PropsWithChildren } from 'react';

import { DragProvider } from './DragProvider';
import { MeasurementsProvider } from './MeasurementsProvider';
import { PositionsProvider } from './PositionsProvider';

type SharedProviderProps = PropsWithChildren<{
  itemKeys: Array<string>;
  dragEnabled: boolean;
}>;

export default function SharedProvider({
  children,
  dragEnabled,
  itemKeys
}: SharedProviderProps) {
  return (
    <MeasurementsProvider itemsCount={itemKeys.length}>
      <PositionsProvider itemKeys={itemKeys}>
        <DragProvider enabled={dragEnabled}>{children}</DragProvider>
      </PositionsProvider>
    </MeasurementsProvider>
  );
}
