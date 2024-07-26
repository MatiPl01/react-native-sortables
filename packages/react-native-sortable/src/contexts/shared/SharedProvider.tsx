/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';

import { DropIndicator } from '../../components';
import type {
  ActiveItemDecorationSettings,
  AutoScrollSettings,
  DropIndicatorSettings,
  PartialBy
} from '../../types';
import { ContextProviderComposer } from '../utils';
import { PositionsUpdater } from './helpers';
import {
  AutoScrollProvider,
  DragProvider,
  MeasurementsProvider,
  PositionsProvider
} from './providers';

type SharedProviderProps = PropsWithChildren<
  {
    itemKeys: Array<string>;
    dragEnabled: boolean;
  } & ActiveItemDecorationSettings &
    DropIndicatorSettings &
    PartialBy<AutoScrollSettings, 'scrollableRef'>
>;

export default function SharedProvider({
  DropIndicatorComponent,
  autoScrollActivationOffset,
  autoScrollEnabled,
  autoScrollSpeed,
  children,
  dragEnabled,
  itemKeys,
  scrollableRef,
  showDropIndicator,
  ...activeItemDecorationSettings
}: SharedProviderProps) {
  const providers = [
    <PositionsProvider itemKeys={itemKeys} />,
    <DragProvider {...activeItemDecorationSettings} enabled={dragEnabled} />,
    <MeasurementsProvider itemKeys={itemKeys} />
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
      <PositionsUpdater />
      {showDropIndicator && (
        <DropIndicator DropIndicatorComponent={DropIndicatorComponent} />
      )}
      {children}
    </ContextProviderComposer>
  );
}
