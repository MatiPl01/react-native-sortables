import { type PropsWithChildren, useEffect, useRef } from 'react';
import type { View, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import {
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { useAnimatableValue } from '../../hooks';
import type {
  ActiveItemDecorationSettings,
  ActiveItemSnapSettings,
  Animatable,
  CommonValuesContextType,
  ControlledContainerDimensions,
  Dimensions,
  ItemDragSettings,
  ItemsLayoutTransitionMode,
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
    controlledContainerDimensions: SharedValue<ControlledContainerDimensions>;
    itemsLayoutTransitionMode: ItemsLayoutTransitionMode;
    initialItemsStyleOverride?: ViewStyle;
  } & ActiveItemDecorationSettings &
    ActiveItemSnapSettings &
    Omit<ItemDragSettings, 'overDrag' | 'reorderTriggerOrigin'>
>;

const { CommonValuesContext, CommonValuesProvider, useCommonValuesContext } =
  createProvider('CommonValues')<
    CommonValuesProviderProps,
    CommonValuesContextType
  >(({
    activationAnimationDuration: _activationAnimationDuration,
    activeItemOpacity: _activeItemOpacity,
    activeItemScale: _activeItemScale,
    activeItemShadowOpacity: _activeItemShadowOpacity,
    controlledContainerDimensions,
    customHandle,
    dragActivationDelay: _dragActivationDelay,
    dragActivationFailOffset: _dragActivationFailOffset,
    dropAnimationDuration: _dropAnimationDuration,
    enableActiveItemSnap: _enableActiveItemSnap,
    inactiveItemOpacity: _inactiveItemOpacity,
    inactiveItemScale: _inactiveItemScale,
    initialItemsStyleOverride,
    itemKeys,
    itemsLayoutTransitionMode,
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
    const snapItemOffset = useSharedValue<Vector | null>(null);

    // DIMENSIONS
    // measured dimensions via onLayout used to calculate containerWidth and containerHeight
    // (should be used for layout calculations and to determine if calculated
    // container dimensions have been applied)
    const measuredContainerWidth = useSharedValue<null | number>(null);
    const measuredContainerHeight = useSharedValue<null | number>(null);
    // calculated based on measuredContainerWidth and measuredContainerHeight and current layout
    // (containerWidth and containerHeight should be used in most cases)
    const containerWidth = useSharedValue<null | number>(null);
    const containerHeight = useSharedValue<null | number>(null);
    const activeItemDimensions = useSharedValue<Dimensions | null>(null);
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
    const activationAnimationDuration = useAnimatableValue(
      _activationAnimationDuration
    );
    const dragActivationFailOffset = useAnimatableValue(
      _dragActivationFailOffset
    );
    const dropAnimationDuration = useAnimatableValue(_dropAnimationDuration);

    // ACTIVE ITEM DECORATION
    const activeItemOpacity = useAnimatableValue(_activeItemOpacity);
    const activeItemScale = useAnimatableValue(_activeItemScale);
    const activeItemShadowOpacity = useAnimatableValue(
      _activeItemShadowOpacity
    );
    const inactiveItemOpacity = useAnimatableValue(_inactiveItemOpacity);
    const inactiveItemScale = useAnimatableValue(_inactiveItemScale);

    // ACTIVE ITEM SNAP
    const enableActiveItemSnap = useAnimatableValue(_enableActiveItemSnap);
    const snapOffsetX = useAnimatableValue(_snapOffsetX);
    const snapOffsetY = useAnimatableValue(_snapOffsetY);

    // OTHER
    const containerRef = useAnimatedRef<View>();
    const sortEnabled = useAnimatableValue(_sortEnabled);
    const canSwitchToAbsoluteLayout = useSharedValue(false);
    const shouldAnimateLayout = useSharedValue(true);
    const animateLayoutOnReorderOnly = useDerivedValue(
      () => itemsLayoutTransitionMode === 'reorder',
      [itemsLayoutTransitionMode]
    );

    useEffect(() => {
      if (areArraysDifferent(itemKeys, prevKeysRef.current)) {
        indexToKey.value = itemKeys;
        prevKeysRef.current = itemKeys;
      }
    }, [itemKeys, indexToKey]);

    const itemsOverridesStyle = useAnimatedStyle(() => ({
      ...itemsStyleOverride.value
    }));

    return {
      value: {
        activationAnimationDuration,
        activationState,
        activeAnimationProgress,
        activeItemDimensions,
        activeItemDropped,
        activeItemKey,
        activeItemOpacity,
        activeItemPosition,
        activeItemScale,
        activeItemShadowOpacity,
        animateLayoutOnReorderOnly,
        canSwitchToAbsoluteLayout,
        containerHeight,
        containerRef,
        containerWidth,
        controlledContainerDimensions,
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
        itemsLayoutTransitionMode,
        itemsOverridesStyle,
        itemsStyleOverride,
        keyToIndex,
        measuredContainerHeight,
        measuredContainerWidth,
        prevActiveItemKey,
        shouldAnimateLayout,
        snapItemDimensions,
        snapItemOffset,
        snapOffsetX,
        snapOffsetY,
        sortEnabled,
        touchPosition
      }
    };
  });

export { CommonValuesContext, CommonValuesProvider, useCommonValuesContext };
