/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/jsx-key */
import type { PropsWithChildren } from 'react';
import type { ViewStyle } from 'react-native';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import { DebugProvider } from '../../debug';
import type { PartialBy } from '../../helperTypes';
import { useWarnOnPropChange } from '../../hooks';
import type { Animatable } from '../../integrations/reanimated';
import type {
  ActiveItemDecorationSettings,
  ActiveItemSnapSettings,
  AutoScrollSettings,
  ControlledDimensions,
  ItemDragSettings,
  ItemsLayoutTransitionMode,
  SortableCallbacks
} from '../../types';
import { ContextProviderComposer } from '../utils';
import { AutoScrollProvider } from './AutoScrollProvider';
import { CommonValuesProvider } from './CommonValuesProvider';
import { CustomHandleProvider } from './CustomHandleProvider';
import { DragProvider } from './DragProvider';
import { LayerProvider } from './LayerProvider';
import { MeasurementsProvider } from './MeasurementsProvider';
import { useMultiZoneContext } from './MultiZoneProvider';

export type SharedProviderProps = PropsWithChildren<
  ActiveItemDecorationSettings &
    ActiveItemSnapSettings &
    PartialBy<Required<AutoScrollSettings>, 'scrollableRef'> &
    Required<ItemDragSettings> &
    Required<SortableCallbacks> & {
      sortEnabled: Animatable<boolean>;
      hapticsEnabled: boolean;
      customHandle: boolean;
      debug: boolean;
      controlledContainerDimensions: ControlledDimensions;
      controlledItemDimensions: ControlledDimensions;
      itemsLayoutTransitionMode: ItemsLayoutTransitionMode;
      bringToFrontWhenActive: boolean;
      dropIndicatorStyle?: ViewStyle;
    }
>;

export default function SharedProvider({
  animateScrollTo,
  autoScrollActivationOffset,
  autoScrollDirection,
  autoScrollEnabled,
  autoScrollExtrapolation,
  autoScrollInterval,
  autoScrollMaxOverscroll,
  autoScrollMaxVelocity,
  bringToFrontWhenActive,
  children,
  customHandle,
  debug,
  hapticsEnabled,
  onActiveItemDropped,
  onDragEnd,
  onDragMove,
  onDragStart,
  onOrderChange,
  overDrag,
  reorderTriggerOrigin,
  scrollableRef,
  sortEnabled,
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
      sortEnabled={sortEnabled}
      {...rest}
    />,
    // Provider used for measurements of items and the container
    <MeasurementsProvider />,
    // Provider used for auto-scrolling when dragging an item near the
    // edge of the container
    scrollableRef && (
      <AutoScrollProvider
        animateScrollTo={animateScrollTo}
        autoScrollActivationOffset={autoScrollActivationOffset}
        autoScrollDirection={autoScrollDirection}
        autoScrollEnabled={autoScrollEnabled}
        autoScrollExtrapolation={autoScrollExtrapolation}
        autoScrollInterval={autoScrollInterval}
        autoScrollMaxOverscroll={autoScrollMaxOverscroll}
        autoScrollMaxVelocity={autoScrollMaxVelocity}
        scrollableRef={scrollableRef}
      />
    ),
    // Provider used for custom handle component related values
    customHandle && <CustomHandleProvider />,
    // Provider used for dragging and item swapping logic
    <DragProvider
      hapticsEnabled={hapticsEnabled}
      overDrag={overDrag}
      reorderTriggerOrigin={reorderTriggerOrigin}
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
