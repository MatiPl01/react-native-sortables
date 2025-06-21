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
  LayerProvider,
  MeasurementsProvider
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
      initialCanMeasureItems?: boolean;
      dropIndicatorStyle?: ViewStyle;
    }
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
  initialCanMeasureItems,
  itemKeys,
  onActiveItemDropped,
  onDragEnd,
  onDragMove,
  onDragStart,
  onOrderChange,
  overDrag,
  scrollableRef,
  ...rest
}: SharedProviderProps) {
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
    <ActiveItemValuesProvider />,
    // Provider used for shared values between all providers below
    <CommonValuesProvider
      customHandle={customHandle}
      itemKeys={itemKeys}
      {...rest}
    />,
    // Provider used for measurements of items and the container
    <MeasurementsProvider
      initialCanMeasureItems={initialCanMeasureItems ?? false}
      itemsCount={itemKeys.length}
    />,
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
