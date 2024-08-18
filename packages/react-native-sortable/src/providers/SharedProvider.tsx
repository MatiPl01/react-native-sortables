/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';
import type { ViewStyle } from 'react-native';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import DropIndicator from '../components/shared/DropIndicator';
import type {
  ActiveItemDecorationSettings,
  ActiveItemSnapSettings,
  AnimatableValues,
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
    enableHaptics: boolean;
    dropIndicatorStyle?: ViewStyle;
  } & ActiveItemDecorationSettings &
    ActiveItemSnapSettings &
    AnimatableValues<{
      enableSort: boolean;
      reorderStrategy: ReorderStrategy;
      animateContainerHeight: boolean;
    }> &
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
  enableHaptics,
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
      enableHaptics={enableHaptics}
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
      <LayoutAnimationConfig>{children}</LayoutAnimationConfig>
    </ContextProviderComposer>
  );
}
