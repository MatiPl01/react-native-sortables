/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';

import type {
  ActiveItemDecorationSettings,
  AutoScrollSettings,
  DropIndicatorSettings,
  PartialBy
} from '../../types';
import { ContextProviderComposer } from '../utils';
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
  // The order of the providers is important (they are dependent on each other)
  const providers = [
    // Provides information about currently dragged item
    <DragProvider {...activeItemDecorationSettings} enabled={dragEnabled} />,
    // Provides measurements of items
    <MeasurementsProvider itemKeys={itemKeys} />,
    // Automatically scrolls the scrollable container (if the reference to
    // the scrollable container is provided)
    scrollableRef && (
      <AutoScrollProvider
        autoScrollActivationOffset={autoScrollActivationOffset}
        autoScrollEnabled={autoScrollEnabled}
        autoScrollSpeed={autoScrollSpeed}
        scrollableRef={scrollableRef}
      />
    ),
    // Provides the current and target positions of items, updates the position
    // of the active item
    <PositionsProvider itemKeys={itemKeys} />
  ];

  return (
    <ContextProviderComposer providers={providers}>
      {/* TODO - show drop indicator */}
      {/* {showDropIndicator && (
        <DropIndicator DropIndicatorComponent={DropIndicatorComponent} />
      )} */}
      {children}
    </ContextProviderComposer>
  );
}
