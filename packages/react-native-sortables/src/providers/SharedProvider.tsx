/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';
import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import { DebugProvider } from '../debug';
import { useWarnOnPropChange } from '../hooks';
import type {
  ActiveItemDecorationSettings,
  ActiveItemSnapSettings,
  Animatable,
  AutoScrollSettings,
  ControlledContainerDimensions,
  ItemDragSettings,
  PartialBy,
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
    sortEnabled: Animatable<boolean>;
    hapticsEnabled: boolean;
    customHandle: boolean;
    debug: boolean;
    controlledContainerDimensions: SharedValue<ControlledContainerDimensions>;
    initialItemsStyleOverride?: ViewStyle;
    dropIndicatorStyle?: ViewStyle;
  } & ActiveItemDecorationSettings &
    ActiveItemSnapSettings &
    PartialBy<AutoScrollSettings, 'scrollableRef'> &
    Required<ItemDragSettings> &
    Required<SortableCallbacks>
>;

export default function SharedProvider({
  autoScrollActivationOffset,
  autoScrollEnabled,
  autoScrollSpeed,
  children,
  debug,
  hapticsEnabled,
  itemKeys,
  onDragEnd,
  onDragStart,
  onOrderChange,
  overDrag,
  autoScrollDirection,
  scrollableRef,
  ...rest
}: SharedProviderProps) {
  useWarnOnPropChange('debug', debug);
  useWarnOnPropChange('scrollableRef', scrollableRef);

  const providers = [
    // Provider used for proper zIndex management
    <LayerProvider />,
    // Provider used for layout debugging
    debug && <DebugProvider />,
    // Provider used for shared values between all providers below
    <CommonValuesProvider itemKeys={itemKeys} {...rest} />,
    // Provider used for measurements of items and the container
    <MeasurementsProvider itemsCount={itemKeys.length} />,
    // Provider used for auto-scrolling when dragging an item near the
    // edge of the container
    scrollableRef && (
      <AutoScrollProvider
        autoScrollActivationOffset={autoScrollActivationOffset}
        autoScrollDirection={autoScrollDirection}
        autoScrollEnabled={autoScrollEnabled}
        autoScrollSpeed={autoScrollSpeed}
        scrollableRef={scrollableRef}
      />
    ),
    // Provider used for dragging and item swapping logic
    <DragProvider
      hapticsEnabled={hapticsEnabled}
      overDrag={overDrag}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onOrderChange={onOrderChange}
    />
  ];

  return (
    <ContextProviderComposer providers={providers}>
      <LayoutAnimationConfig skipEntering skipExiting>
        {children}
      </LayoutAnimationConfig>
    </ContextProviderComposer>
  );
}
