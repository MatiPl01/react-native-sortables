/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';

import { DropIndicator } from '../../components';
import type {
  ActiveItemDecorationSettings,
  AutoScrollSettings,
  DropIndicatorSettings,
  PartialBy,
  SortableCallbacks
} from '../../types';
import { ContextProviderComposer } from '../utils';
import { AutoScrollProvider } from './AutoScrollProvider';
import { DragProvider } from './DragProvider';
import { MeasurementsProvider } from './MeasurementsProvider';
import { PositionsProvider } from './PositionsProvider';

type SharedProviderProps = PropsWithChildren<
  {
    itemKeys: Array<string>;
    dragDisabled: boolean;
    hapticsDisabled: boolean;
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
  itemKeys,
  scrollableRef,
  showDropIndicator,
  ...dragProviderProps
}: SharedProviderProps) {
  const providers = [
    <PositionsProvider itemKeys={itemKeys} />,
    <DragProvider {...dragProviderProps} />,
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
