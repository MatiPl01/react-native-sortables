/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';

import DropIndicator from '../components/shared/DropIndicator';
import type {
  ActiveItemDecorationSettings,
  AutoScrollSettings,
  DropIndicatorSettings,
  PartialBy,
  SortableCallbacks
} from '../types';
import {
  AutoScrollProvider,
  DragProvider,
  LayerProvider,
  MeasurementsProvider,
  PositionsProvider
} from './shared';
import { ContextProviderComposer } from './utils';

type SharedProviderProps = PropsWithChildren<
  {
    itemKeys: Array<string>;
    dragEnabled: boolean;
    hapticsEnabled: boolean;
  } & ActiveItemDecorationSettings &
    DropIndicatorSettings &
    PartialBy<AutoScrollSettings, 'scrollableRef'> &
    SortableCallbacks
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
  ...dragProviderProps
}: SharedProviderProps) {
  const providers = [
    <LayerProvider />,
    <PositionsProvider itemKeys={itemKeys} />,
    <DragProvider dragEnabled={dragEnabled} {...dragProviderProps} />,
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
      {showDropIndicator && (
        <DropIndicator DropIndicatorComponent={DropIndicatorComponent} />
      )}
      {children}
    </ContextProviderComposer>
  );
}
