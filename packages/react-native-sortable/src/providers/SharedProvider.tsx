/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';
import type { ViewStyle } from 'react-native';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import DropIndicator from '../components/shared/DropIndicator';
import { DebugOutlet, DebugProvider } from '../debug';
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
    debug: boolean;
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
  debug,
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
    // Provider used for layout debugging
    debug && <DebugProvider />,
    // Provider used for zIndex management when item is pressed or dragged
    <LayerProvider />,
    // Provider used for shared values between all providers below
    <CommonValuesProvider itemKeys={itemKeys} {...rest} />,
    // Provider used for measurements of items and the container
    <MeasurementsProvider itemsCount={itemKeys.length} />,
    // Provider used for auto-scrolling when dragging an item near the
    // edge of the container
    scrollableRef && (
      <AutoScrollProvider
        autoScrollActivationOffset={autoScrollActivationOffset}
        autoScrollEnabled={autoScrollEnabled}
        autoScrollSpeed={autoScrollSpeed}
        scrollableRef={scrollableRef}
      />
    ),
    // Provider used for dragging and item swapping logic
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
      <LayoutAnimationConfig skipEntering skipExiting>
        {children}
        {debug && <DebugOutlet />}
      </LayoutAnimationConfig>
    </ContextProviderComposer>
  );
}
