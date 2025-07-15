/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';
import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import { DebugProvider } from '../debug';
import type { PartialBy } from '../helperTypes';
import { useWarnOnPropChange } from '../hooks';
import type { Animatable } from '../integrations/reanimated';
import type {
  ActiveItemDecorationSettings,
  ActiveItemSnapSettings,
  AutoScrollSettings,
  ControlledContainerDimensions,
  ItemDragSettings,
  ItemsLayoutTransitionMode,
  SortableCallbacks
} from '../types';
import {
  AutoScrollProvider,
  CommonValuesProvider,
  CustomHandleProvider,
  DragProvider,
  LayerProvider,
  MeasurementsProvider,
  useMultiZoneContext
} from './shared';
import { ContextProviderComposer } from './utils';

type SharedProviderProps = PropsWithChildren<
  ActiveItemDecorationSettings &
    ActiveItemSnapSettings &
    PartialBy<AutoScrollSettings, 'scrollableRef'> &
    Required<Omit<ItemDragSettings, 'reorderTriggerOrigin'>> &
    Required<SortableCallbacks> & {
      itemKeys: Array<string>;
      sortEnabled: Animatable<boolean>;
      hapticsEnabled: boolean;
      customHandle: boolean;
      debug: boolean;
      controlledContainerDimensions: SharedValue<ControlledContainerDimensions>;
      itemsLayoutTransitionMode: ItemsLayoutTransitionMode;
      bringToFrontWhenActive: boolean;
      dropIndicatorStyle?: ViewStyle;
    }
>;

export default function SharedProvider({
  autoScrollActivationOffset,
  autoScrollDirection,
  autoScrollEnabled,
  autoScrollSpeed,
  bringToFrontWhenActive,
  children,
  customHandle,
  debug,
  hapticsEnabled,
  itemKeys,
  maxScrollToOverflowOffset,
  onActiveItemDropped,
  onDragEnd,
  onDragMove,
  onDragStart,
  onOrderChange,
  overDrag,
  scrollableRef,
  ...rest
}: SharedProviderProps) {
  const inMultiZone = !!useMultiZoneContext();

  if (__DEV__) {
    useWarnOnPropChange('debug', debug);
    useWarnOnPropChange('customHandle', customHandle);
    useWarnOnPropChange('scrollableRef', scrollableRef);
  }

  const providers = [
    // Provider used for proper zIndex management
    bringToFrontWhenActive && !inMultiZone && <LayerProvider />,
    // Provider used for layout debugging (can be used only in dev mode)
    __DEV__ && debug && <DebugProvider />,
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
        maxScrollToOverflowOffset={maxScrollToOverflowOffset}
        scrollableRef={scrollableRef}
      />
    ),
    // Provider used for custom handle component related values
    customHandle && <CustomHandleProvider />,
    // Provider used for dragging and item swapping logic
    <DragProvider
      hapticsEnabled={hapticsEnabled}
      overDrag={overDrag}
      onActiveItemDropped={onActiveItemDropped}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
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
