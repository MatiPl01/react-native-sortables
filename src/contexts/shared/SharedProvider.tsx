import type { PropsWithChildren } from 'react';

import { DragProvider } from './DragProvider';
import { MeasurementsProvider } from './MeasurementsProvider';
import { PositionsProvider } from './PositionsProvider';

type SharedProviderProps = PropsWithChildren<{
  itemKeys: Array<string>;
  enabled: boolean;
}>;

export default function SharedProvider({
  children,
  enabled,
  itemKeys
}: SharedProviderProps) {
  return (
    <MeasurementsProvider itemsCount={itemKeys.length}>
      <PositionsProvider itemKeys={itemKeys}>
        <DragProvider enabled={enabled}>{children}</DragProvider>
      </PositionsProvider>
    </MeasurementsProvider>
  );
}
