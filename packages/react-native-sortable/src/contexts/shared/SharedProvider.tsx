import type { PropsWithChildren } from 'react';

import type { ActiveItemDecorationSettings } from '@/types';

import { DragProvider } from './DragProvider';
import { MeasurementsProvider } from './MeasurementsProvider';
import { PositionsProvider } from './PositionsProvider';

type SharedProviderProps = PropsWithChildren<
  {
    itemKeys: Array<string>;
    dragEnabled: boolean;
  } & ActiveItemDecorationSettings
>;

export default function SharedProvider({
  children,
  dragEnabled,
  itemKeys,
  ...activeItemDecorationSettings
}: SharedProviderProps) {
  return (
    <PositionsProvider itemKeys={itemKeys}>
      <DragProvider {...activeItemDecorationSettings} enabled={dragEnabled}>
        <MeasurementsProvider itemsCount={itemKeys.length}>
          {children}
        </MeasurementsProvider>
      </DragProvider>
    </PositionsProvider>
  );
}
