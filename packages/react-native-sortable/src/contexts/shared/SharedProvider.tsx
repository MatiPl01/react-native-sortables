/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';

import type {
  ActiveItemDecorationSettings,
  AutoScrollProps,
  PartialBy
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
    PartialBy<AutoScrollProps, 'scrollableRef'>
>;

export default function SharedProvider({
  autoScrollActivationOffset,
  autoScrollEnabled,
  autoScrollSpeed,
  children,
  dragEnabled,
  itemKeys,
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
        autoScrollActivationOffset={autoScrollActivationOffset}
        autoScrollEnabled={autoScrollEnabled}
        autoScrollSpeed={autoScrollSpeed}
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
