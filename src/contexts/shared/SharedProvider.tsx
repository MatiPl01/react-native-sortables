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
    <PositionsProvider itemKeys={itemKeys}>
      <DragProvider enabled={dragEnabled}>
        <MeasurementsProvider itemsCount={itemKeys.length}>
          {children}
        </MeasurementsProvider>
      </DragProvider>
    </PositionsProvider>
  );
}
