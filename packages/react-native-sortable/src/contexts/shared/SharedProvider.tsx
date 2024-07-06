/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';

import type {
  ActiveItemDecorationSettings,
  AutoScrollProps
} from '../../types';
import ContextProviderComposer from '../utils/ContextProviderComposer';
import { AutoScrollProvider } from './AutoScrollProvider';
import { DragProvider } from './DragProvider';
import { MeasurementsProvider } from './MeasurementsProvider';
import { PositionsProvider } from './PositionsProvider';

type SharedProviderProps = PropsWithChildren<
  {
    itemKeys: Array<string>;
    dragEnabled: boolean;
  } & ActiveItemDecorationSettings &
    Partial<AutoScrollProps>
>;

export default function SharedProvider({
  activationOffset,
  children,
  dragEnabled,
  itemKeys,
  offsetFromTop,
  scrollableRef,
  ...activeItemDecorationSettings
}: SharedProviderProps) {
  const providers = [
    <PositionsProvider itemKeys={itemKeys} />,
    <DragProvider {...activeItemDecorationSettings} enabled={dragEnabled} />,
    <MeasurementsProvider itemsCount={itemKeys.length} />
  ];

  if (scrollableRef) {
    providers.push(
      <AutoScrollProvider
        activationOffset={activationOffset}
        offsetFromTop={offsetFromTop}
        scrollableRef={scrollableRef}
      />
    );
  }
  return (
    <ContextProviderComposer providers={providers}>
      {children}
    </ContextProviderComposer>
  );
}
