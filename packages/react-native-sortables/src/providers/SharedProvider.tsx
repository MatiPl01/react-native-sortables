/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';
import type { ViewStyle } from 'react-native';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import { DebugProvider } from '../debug';
import { useWarnOnPropChange } from '../hooks';
import type {
  ActiveItemDecorationSettings,
  ActiveItemSnapSettings,
  Animatable,
  AutoScrollSettings,
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
    initialItemsStyleOverride?: ViewStyle;
    dropIndicatorStyle?: ViewStyle;
  } & ActiveItemDecorationSettings &
    ActiveItemSnapSettings &
    PartialBy<AutoScrollSettings, 'scrollableRef'> &
    Required<ItemDragSettings> &
    Required<SortableCallbacks>
>;

export default function SharedProvider({
  allowOverDrag,
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
        autoScrollEnabled={autoScrollEnabled}
        autoScrollSpeed={autoScrollSpeed}
        scrollableRef={scrollableRef}
      />
    ),
    // Provider used for dragging and item swapping logic
    <DragProvider
      allowOverDrag={allowOverDrag}
      hapticsEnabled={hapticsEnabled}
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
