import { type PropsWithChildren, useEffect, useRef } from 'react';
import type { ViewStyle } from 'react-native';
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
  Animatable,
  CommonValuesContextType,
  Dimensions,
  ItemActivationSettings,
  Maybe,
  Vector
} from '../../types';
import { DragActivationState } from '../../types';
import { areArraysDifferent } from '../../utils';
import { createProvider } from '../utils';

type CommonValuesProviderProps = PropsWithChildren<
  {
    sortEnabled: Animatable<boolean>;
    customHandle: boolean;
    itemKeys: Array<string>;
    initialItemsStyleOverride?: ViewStyle;
  } & ActiveItemDecorationSettings &
    ActiveItemSnapSettings &
    ItemActivationSettings
>;

const { CommonValuesProvider, useCommonValuesContext } = createProvider(
  'CommonValues'
)<CommonValuesProviderProps, CommonValuesContextType>(({
  activeAnimationDuration: _activeAnimationDuration,
  activeItemOpacity: _activeItemOpacity,
  activeItemScale: _activeItemScale,
  activeItemShadowOpacity: _activeItemShadowOpacity,
  customHandle,
  dragActivationDelay: _dragActivationDelay,
  dragActivationFailOffset: _dragActivationFailOffset,
  dropAnimationDuration: _dropAnimationDuration,
  enableActiveItemSnap: _enableActiveItemSnap,
  inactiveItemOpacity: _inactiveItemOpacity,
  inactiveItemScale: _inactiveItemScale,
  initialItemsStyleOverride,
  itemKeys,
  snapOffsetX: _snapOffsetX,
  snapOffsetY: _snapOffsetY,
  sortEnabled: _sortEnabled
}) => {
  const prevKeysRef = useRef<Array<string>>([]);

  // ORDER
  const indexToKey = useSharedValue<Array<string>>(itemKeys);
  const keyToIndex = useDerivedValue(() =>
    Object.fromEntries(indexToKey.value.map((key, index) => [key, index]))
  );

  // POSITIONS
  const itemPositions = useSharedValue<Record<string, Vector>>({});
  const touchPosition = useSharedValue<Vector | null>(null);
  const activeItemPosition = useSharedValue<Vector | null>(null);

  // DIMENSIONS
  const containerWidth = useSharedValue(-1);
  const containerHeight = useSharedValue(-1);
  const snapItemDimensions = useSharedValue<Dimensions | null>(null);
  const itemDimensions = useSharedValue<Record<string, Dimensions>>({});
  const itemsStyleOverride = useSharedValue<Maybe<ViewStyle>>(
    initialItemsStyleOverride
  );

  // DRAG STATE
  const activeItemKey = useSharedValue<null | string>(null);
  const prevActiveItemKey = useSharedValue<null | string>(null);
  const activationState = useSharedValue(DragActivationState.INACTIVE);
  const activeAnimationProgress = useSharedValue(0);
  const inactiveAnimationProgress = useSharedValue(0);
  const activeItemDropped = useSharedValue(true);

  // ITEM ACTIVATION SETTINGS
  const dragActivationDelay = useAnimatableValue(_dragActivationDelay);
  const activeAnimationDuration = useAnimatableValue(_activeAnimationDuration);
  const dragActivationFailOffset = useAnimatableValue(
    _dragActivationFailOffset
  );
  const dropAnimationDuration = useAnimatableValue(_dropAnimationDuration);

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
  const sortEnabled = useAnimatableValue(_sortEnabled);
  const canSwitchToAbsoluteLayout = useSharedValue(false);
  const shouldAnimateLayout = useSharedValue(true);

  useEffect(() => {
    if (areArraysDifferent(itemKeys, prevKeysRef.current)) {
      indexToKey.value = itemKeys;
      prevKeysRef.current = itemKeys;
    }
  }, [itemKeys, indexToKey]);

  return {
    value: {
      activationState,
      activeAnimationDuration,
      activeAnimationProgress,
      activeItemDropped,
      activeItemKey,
      activeItemOpacity,
      activeItemPosition,
      activeItemScale,
      activeItemShadowOpacity,
      canSwitchToAbsoluteLayout,
      containerHeight,
      containerRef,
      containerWidth,
      customHandle,
      dragActivationDelay,
      dragActivationFailOffset,
      dropAnimationDuration,
      enableActiveItemSnap,
      inactiveAnimationProgress,
      inactiveItemOpacity,
      inactiveItemScale,
      indexToKey,
      itemDimensions,
      itemPositions,
      itemsStyleOverride,
      keyToIndex,
      prevActiveItemKey,
      shouldAnimateLayout,
      snapItemDimensions,
      snapOffsetX,
      snapOffsetY,
      sortEnabled,
      touchPosition
    }
  };
});

export { CommonValuesProvider, useCommonValuesContext };
