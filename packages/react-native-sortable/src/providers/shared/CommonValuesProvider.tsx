import { type PropsWithChildren, useEffect, useRef } from 'react';
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
  AnimatableValues,
  AnimatedValues,
  Dimensions,
  ReorderStrategy,
  Vector
} from '../../types';
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
  enableSort: SharedValue<boolean>;

  // POSITIONs
  itemPositions: SharedValue<Record<string, Vector>>;
  touchStartPosition: SharedValue<Vector | null>;
  relativeTouchPosition: SharedValue<Vector | null>;
  touchedItemPosition: SharedValue<Vector | null>;

  // DIMENSIONS
  containerWidth: SharedValue<null | number>;
  containerHeight: SharedValue<null | number>;
  targetContainerHeight: SharedValue<null | number>;
  touchedItemDimensions: SharedValue<Dimensions | null>;
  itemDimensions: SharedValue<Record<string, Dimensions>>;
  overrideItemDimensions: SharedValue<Record<string, Partial<Dimensions>>>;

  // DRAG STATE
  touchedItemKey: SharedValue<null | string>;
  activeItemKey: SharedValue<null | string>;
  activationProgress: SharedValue<number>;
  inactiveAnimationProgress: SharedValue<number>;
  activeItemTranslation: SharedValue<Vector | null>;
  activeItemDropped: SharedValue<boolean>;

  // OTHER
  containerRef: AnimatedRef<Animated.View>;
  animateContainerHeight: SharedValue<boolean>;
  canSwitchToAbsoluteLayout: SharedValue<boolean>;
} & AnimatedValues<ActiveItemDecorationSettings> &
  AnimatedValues<ActiveItemSnapSettings>;

type CommonValuesProviderProps = PropsWithChildren<
  {
    itemKeys: Array<string>;
  } & ActiveItemDecorationSettings &
    ActiveItemSnapSettings &
    AnimatableValues<{
      enableSort: boolean;
      reorderStrategy: ReorderStrategy;
      animateContainerHeight: boolean;
    }>
>;

const { CommonValuesProvider, useCommonValuesContext } = createProvider(
  'CommonValues'
)<CommonValuesProviderProps, CommonValuesContextType>(({
  activeItemOpacity: _activeItemOpacity,
  activeItemScale: _activeItemScale,
  activeItemShadowOpacity: _activeItemShadowOpacity,
  animateContainerHeight: _animateContainerHeight,
  enableActiveItemSnap: _enableActiveItemSnap,
  enableSort: _enableSort,
  inactiveItemOpacity: _inactiveItemOpacity,
  inactiveItemScale: _inactiveItemScale,
  itemKeys,
  reorderStrategy: _reorderStrategy,
  snapOffsetX: _snapOffsetX,
  snapOffsetY: _snapOffsetY
}) => {
  const prevKeysRef = useRef<Array<string>>([]);

  // ORDER
  const indexToKey = useSharedValue<Array<string>>(itemKeys);
  const keyToIndex = useDerivedValue(() =>
    Object.fromEntries(indexToKey.value.map((key, index) => [key, index]))
  );
  const reorderStrategy = useAnimatableValue(_reorderStrategy);
  const enableSort = useAnimatableValue(_enableSort);

  // POSITIONs
  const itemPositions = useSharedValue<Record<string, Vector>>({});
  const touchStartPosition = useSharedValue<Vector | null>(null);
  const relativeTouchPosition = useSharedValue<Vector | null>(null);
  const touchedItemPosition = useSharedValue<Vector | null>(null);

  // DIMENSIONS
  const containerWidth = useSharedValue<null | number>(null);
  const containerHeight = useSharedValue<null | number>(null);
  const targetContainerHeight = useSharedValue<null | number>(null);
  const touchedItemDimensions = useSharedValue<Dimensions | null>(null);
  const itemDimensions = useSharedValue<Record<string, Dimensions>>({});
  const overrideItemDimensions = useSharedValue<
    Record<string, Partial<Dimensions>>
  >({});

  // DRAG STATE
  const touchedItemKey = useSharedValue<null | string>(null);
  const activeItemKey = useSharedValue<null | string>(null);
  const activationProgress = useSharedValue(0);
  const inactiveAnimationProgress = useSharedValue(0);
  const activeItemTranslation = useSharedValue<Vector | null>(null);
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
  const animateContainerHeight = useAnimatableValue(_animateContainerHeight);
  const canSwitchToAbsoluteLayout = useSharedValue(false);

  useEffect(() => {
    if (areArraysDifferent(itemKeys, prevKeysRef.current)) {
      indexToKey.value = itemKeys;
      prevKeysRef.current = itemKeys;
    }
  }, [itemKeys, indexToKey]);

  return {
    value: {
      activationProgress,
      activeItemDropped,
      activeItemKey,
      activeItemOpacity,
      activeItemScale,
      activeItemShadowOpacity,
      activeItemTranslation,
      animateContainerHeight,
      canSwitchToAbsoluteLayout,
      containerHeight,
      containerRef,
      containerWidth,
      enableActiveItemSnap,
      enableSort,
      inactiveAnimationProgress,
      inactiveItemOpacity,
      inactiveItemScale,
      indexToKey,
      itemDimensions,
      itemPositions,
      keyToIndex,
      overrideItemDimensions,
      relativeTouchPosition,
      reorderStrategy,
      snapOffsetX,
      snapOffsetY,
      targetContainerHeight,
      touchStartPosition,
      touchedItemDimensions,
      touchedItemKey,
      touchedItemPosition
    }
  };
});

export { CommonValuesProvider, useCommonValuesContext };
