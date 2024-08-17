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
  ReorderStrategy,
  SortableCallbacks
} from '../types';
import {
  AutoScrollProvider,
  CommonValuesProvider,
  DragProvider,
  LayerProvider,
  MeasurementsProvider
} from './shared';
import { ContextProviderComposer } from './utils';

type SharedProviderProps = PropsWithChildren<
  {
    itemKeys: Array<string>;
    sortEnabled: boolean;
    hapticsEnabled: boolean;
    reorderStrategy: ReorderStrategy;
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
  hapticsEnabled,
  itemKeys,
  onDragEnd,
  onDragStart,
  onOrderChange,
  scrollableRef,
  showDropIndicator,
  ...rest
}: SharedProviderProps) {
  const providers = [
    <LayerProvider />,
    <CommonValuesProvider itemKeys={itemKeys} {...rest} />,
    <MeasurementsProvider itemsCount={itemKeys.length} />,
    scrollableRef && (
      <AutoScrollProvider
        autoScrollActivationOffset={autoScrollActivationOffset}
        autoScrollEnabled={autoScrollEnabled}
        autoScrollSpeed={autoScrollSpeed}
        scrollableRef={scrollableRef}
      />
    ),
    <DragProvider
      hapticsEnabled={hapticsEnabled}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onOrderChange={onOrderChange}
    />
  ];

  return (
    <ContextProviderComposer providers={providers}>
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
