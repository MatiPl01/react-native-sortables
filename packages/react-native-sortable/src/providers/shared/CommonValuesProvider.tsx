import { type PropsWithChildren, useEffect, useRef } from 'react';
import type { ViewStyle } from 'react-native';
import type { AnimatedRef, SharedValue } from 'react-native-reanimated';
import type Animated from 'react-native-reanimated';
import {
  useAnimatedRef,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { useAnimatableValue } from '../../hooks';
import type {
  ActiveItemDecorationSettings,
  ActiveItemSnapSettings,
  AnimatedValues,
  Dimensions,
  Maybe,
  ReorderStrategy,
  Vector
} from '../../types';
import { DragActivationState } from '../../types';
import { areArraysDifferent } from '../../utils';
import { createProvider } from '../utils';

/**
 * Context values shared between all providers.
 * (they are stored in a single context to make the access to them easier
 * between different providers)
 */

type CommonValuesContextType = {
  // ORDER
  indexToKey: SharedValue<Array<string>>;
  keyToIndex: SharedValue<Record<string, number>>;
  reorderStrategy: SharedValue<ReorderStrategy>;

  // POSITIONs
  itemPositions: SharedValue<Record<string, Vector>>;
  touchPosition: SharedValue<Vector | null>;
  touchedItemPosition: SharedValue<Vector | null>;

  // DIMENSIONS
  containerWidth: SharedValue<number>;
  containerHeight: SharedValue<number>;
  touchedItemWidth: SharedValue<number>;
  touchedItemHeight: SharedValue<number>;
  itemDimensions: SharedValue<Record<string, Dimensions>>;
  itemsStyleOverride: SharedValue<Maybe<ViewStyle>>;
  parentDimensions?: SharedValue<Dimensions | null>;

  // DRAG STATE
  touchedItemKey: SharedValue<null | string>;
  activeItemKey: SharedValue<null | string>;
  activationState: SharedValue<DragActivationState>;
  activationProgress: SharedValue<number>;
  inactiveAnimationProgress: SharedValue<number>;
  activeItemDropped: SharedValue<boolean>;

  // OTHER
  containerRef: AnimatedRef<Animated.View>;
  sortEnabled: SharedValue<boolean>;
  canSwitchToAbsoluteLayout: SharedValue<boolean>;
} & AnimatedValues<ActiveItemDecorationSettings> &
  AnimatedValues<ActiveItemSnapSettings>;

type CommonValuesProviderProps = PropsWithChildren<
  {
    sortEnabled: boolean;
    itemKeys: Array<string>;
    reorderStrategy: ReorderStrategy;
    initialItemsStyleOverride?: ViewStyle;
    parentDimensions?: SharedValue<Dimensions | null>;
  } & ActiveItemDecorationSettings &
    ActiveItemSnapSettings
>;

const { CommonValuesProvider, useCommonValuesContext } = createProvider(
  'CommonValues'
)<CommonValuesProviderProps, CommonValuesContextType>(({
  activeItemOpacity: _activeItemOpacity,
  activeItemScale: _activeItemScale,
  activeItemShadowOpacity: _activeItemShadowOpacity,
  enableActiveItemSnap: _enableActiveItemSnap,
  inactiveItemOpacity: _inactiveItemOpacity,
  inactiveItemScale: _inactiveItemScale,
  itemKeys,
  parentDimensions,
  reorderStrategy: _reorderStrategy,
  snapOffsetX: _snapOffsetX,
  snapOffsetY: _snapOffsetY,
  initialItemsStyleOverride,
  sortEnabled: _sortEnabled
}) => {
  const prevKeysRef = useRef<Array<string>>([]);

  // ORDER
  const indexToKey = useSharedValue<Array<string>>(itemKeys);
  const keyToIndex = useDerivedValue(() =>
    Object.fromEntries(indexToKey.value.map((key, index) => [key, index]))
  );
  const reorderStrategy = useDerivedValue(() => _reorderStrategy);

  // POSITIONs
  const itemPositions = useSharedValue<Record<string, Vector>>({});
  const touchPosition = useSharedValue<Vector | null>(null);
  const touchedItemPosition = useSharedValue<Vector | null>(null);

  // DIMENSIONS
  const containerWidth = useSharedValue(-1);
  const containerHeight = useSharedValue(-1);
  const touchedItemWidth = useSharedValue(-1);
  const touchedItemHeight = useSharedValue(-1);
  const itemDimensions = useSharedValue<Record<string, Dimensions>>({});
  const itemsStyleOverride = useSharedValue<Maybe<ViewStyle>>(
    initialItemsStyleOverride
  );

  // DRAG STATE
  const touchedItemKey = useSharedValue<null | string>(null);
  const activeItemKey = useSharedValue<null | string>(null);
  const activationState = useSharedValue(DragActivationState.INACTIVE);
  const activationProgress = useSharedValue(0);
  const inactiveAnimationProgress = useSharedValue(0);
  const activeItemDropped = useSharedValue(true);

  // ACTIVE ITEM DECORATION
  const activeItemOpacity = useAnimatableValue(_activeItemOpacity);
  const activeItemScale = useAnimatableValue(_activeItemScale);
  const activeItemShadowOpacity = useAnimatableValue(_activeItemShadowOpacity);
  const inactiveItemOpacity = useAnimatableValue(_inactiveItemOpacity);
  const inactiveItemScale = useAnimatableValue(_inactiveItemScale);

  // ACTIVE ITEM SNAP
  const enableActiveItemSnap = useAnimatableValue(_enableActiveItemSnap);
  const snapOffsetX = useAnimatableValue(_snapOffsetX);
  const snapOffsetY = useAnimatableValue(_snapOffsetY);

  // OTHER
  const containerRef = useAnimatedRef<Animated.View>();
  const sortEnabled = useDerivedValue(() => _sortEnabled);
  const canSwitchToAbsoluteLayout = useSharedValue(false);

  useEffect(() => {
    if (areArraysDifferent(itemKeys, prevKeysRef.current)) {
      indexToKey.value = itemKeys;
      prevKeysRef.current = itemKeys;
    }
  }, [itemKeys, indexToKey]);

  return {
    value: {
      touchedItemKey,
      activationProgress,
      activationState,
      activeItemDropped,
      activeItemKey,
      activeItemOpacity,
      activeItemScale,
      activeItemShadowOpacity,
      canSwitchToAbsoluteLayout,
      containerHeight,
      containerRef,
      containerWidth,
      enableActiveItemSnap,
      inactiveAnimationProgress,
      inactiveItemOpacity,
      inactiveItemScale,
      indexToKey,
      parentDimensions,
      itemDimensions,
      itemPositions,
      itemsStyleOverride,
      keyToIndex,
      reorderStrategy,
      snapOffsetX,
      snapOffsetY,
      sortEnabled,
      touchPosition,
      touchedItemHeight,
      touchedItemPosition,
      touchedItemWidth
    }
  };
});

export { CommonValuesProvider, useCommonValuesContext };
