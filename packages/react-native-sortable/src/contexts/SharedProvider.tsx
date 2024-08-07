/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';
import type { ViewStyle } from 'react-native';

import DropIndicator from '../components/shared/DropIndicator';
import type {
  ActiveItemDecorationSettings,
  ActiveItemSnapSettings,
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
  PositionsProvider,
  TouchedItemPositionUpdater
} from './shared';
import { ContextProviderComposer } from './utils';

type SharedProviderProps = PropsWithChildren<
  {
    itemKeys: Array<string>;
    dragEnabled: boolean;
    hapticsEnabled: boolean;
    itemWrapperStyle?: ViewStyle;
    dropIndicatorStyle?: ViewStyle;
  } & ActiveItemDecorationSettings &
    ActiveItemSnapSettings &
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
  dropIndicatorStyle,
  enableActiveItemSnap,
  itemKeys,
  scrollableRef,
  showDropIndicator,
  snapOffsetX,
  snapOffsetY,
  ...dragProviderProps
}: SharedProviderProps) {
  const providers = [
    <LayerProvider />,
    <PositionsProvider itemKeys={itemKeys} />,
    <DragProvider {...dragProviderProps} />,
    <MeasurementsProvider itemsCount={itemKeys.length} />,
    scrollableRef && (
      <AutoScrollProvider
        autoScrollActivationOffset={autoScrollActivationOffset}
        autoScrollEnabled={autoScrollEnabled}
        autoScrollSpeed={autoScrollSpeed}
        scrollableRef={scrollableRef}
      />
    )
  ];

  return (
    <ContextProviderComposer providers={providers}>
      <TouchedItemPositionUpdater
        enableActiveItemSnap={enableActiveItemSnap}
        snapOffsetX={snapOffsetX}
        snapOffsetY={snapOffsetY}
      />
      {showDropIndicator && (
        <DropIndicator
          DropIndicatorComponent={DropIndicatorComponent}
          style={dropIndicatorStyle}
        />
      )}
      {children}
    </ContextProviderComposer>
  );
}
