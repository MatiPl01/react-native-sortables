/* eslint-disable react-hooks/rules-of-hooks */
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
  ItemsLayoutTransitionMode,
  PartialBy,
  SortableCallbacks
} from '../types';
import {
  ActiveItemValuesProvider,
  AutoScrollProvider,
  CommonValuesProvider,
  CustomHandleProvider,
  DragProvider,
  InterDragInnerProvider,
  LayerProvider,
  MeasurementsProvider,
  useInterDragContext
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
    itemsLayoutTransitionMode: ItemsLayoutTransitionMode;
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
  autoScrollDirection,
  autoScrollEnabled,
  autoScrollSpeed,
  children,
  customHandle,
  debug,
  hapticsEnabled,
  itemKeys,
  onDragEnd,
  onDragMove,
  onDragStart,
  onOrderChange,
  overDrag,
  reorderTriggerOrigin,
  scrollableRef,
  ...rest
}: SharedProviderProps) {
  const hasInterDragProvider = !!useInterDragContext();

  if (__DEV__) {
    useWarnOnPropChange('debug', debug);
    useWarnOnPropChange('customHandle', customHandle);
    useWarnOnPropChange('scrollableRef', scrollableRef);
  }

  const providers = [
    // Provider used for proper zIndex management
    <LayerProvider />,
    // Provider used for layout debugging (can be used only in dev mode)
    __DEV__ && debug && <DebugProvider />,
    // Provider used for active item values
    // (if inter drag provider is present, we don't need to provide active
    // item values as they will be provided by the inter drag provider)
    !hasInterDragProvider && <ActiveItemValuesProvider />,
    // Provider used for shared values between all providers below
    <CommonValuesProvider
      customHandle={customHandle}
      itemKeys={itemKeys}
      {...rest}
    />,
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
    // Provider used for custom handle component related values
    customHandle && <CustomHandleProvider />,
    // Provider used for dragging and item swapping logic
    <DragProvider
      hapticsEnabled={hapticsEnabled}
      overDrag={overDrag}
      triggerOrigin={reorderTriggerOrigin}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
      onDragStart={onDragStart}
      onOrderChange={onOrderChange}
    />,
    // Provider used for inter drag logic (like changing the active item
    // residence container)
    hasInterDragProvider && <InterDragInnerProvider />
  ];

  return (
    <ContextProviderComposer providers={providers}>
      <LayoutAnimationConfig skipEntering skipExiting>
        {children}
      </LayoutAnimationConfig>
    </ContextProviderComposer>
  );
}
