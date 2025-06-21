import { type PropsWithChildren, useEffect, useMemo, useRef } from 'react';
import type { View, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import {
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue
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
import {
  areArraysDifferent,
  getKeyToIndex,
  useMutableValue
} from '../../utils';
import { createProvider } from '../utils';
import { useActiveItemValuesContext } from './ActiveItemValuesProvider';

let nextId = 0;

type CommonValuesProviderProps = PropsWithChildren<
  ActiveItemDecorationSettings &
    ActiveItemSnapSettings &
    Omit<ItemDragSettings, 'overDrag' | 'reorderTriggerOrigin'> & {
      sortEnabled: Animatable<boolean>;
      customHandle: boolean;
      itemKeys: Array<string>;
      controlledContainerDimensions: SharedValue<ControlledContainerDimensions>;
      itemsLayoutTransitionMode: ItemsLayoutTransitionMode;
      initialItemsStyleOverride?: ViewStyle;
    }
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
    const containerId = useMemo(() => nextId++, []);
    const prevKeysRef = useRef<Array<string>>([]);

    // ORDER
    const indexToKey = useMutableValue<Array<string>>(itemKeys);
    const keyToIndex = useDerivedValue(() => getKeyToIndex(indexToKey.value));

    // POSITIONS
    const itemPositions = useMutableValue<Record<string, Vector>>({});

    // DIMENSIONS
    // measured dimensions via onLayout used to calculate containerWidth and containerHeight
    // (should be used for layout calculations and to determine if calculated
    // container dimensions have been applied)
    const measuredContainerWidth = useMutableValue<null | number>(null);
    const measuredContainerHeight = useMutableValue<null | number>(null);
    // calculated based on measuredContainerWidth and measuredContainerHeight and current layout
    // (containerWidth and containerHeight should be used in most cases)
    const containerWidth = useMutableValue<null | number>(null);
    const containerHeight = useMutableValue<null | number>(null);
    const itemDimensions = useMutableValue<Record<string, Dimensions>>({});
    const itemsStyleOverride = useMutableValue<Maybe<ViewStyle>>(
      initialItemsStyleOverride
    );

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
    const usesAbsoluteLayout = useMutableValue(false);
    const shouldAnimateLayout = useMutableValue(true);
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
        ...useActiveItemValuesContext(),
        activationAnimationDuration,
        activeItemOpacity,
        activeItemScale,
        activeItemShadowOpacity,
        animateLayoutOnReorderOnly,
        containerHeight,
        containerId,
        containerRef,
        containerWidth,
        controlledContainerDimensions,
        customHandle,
        dragActivationDelay,
        dragActivationFailOffset,
        dropAnimationDuration,
        enableActiveItemSnap,
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
        shouldAnimateLayout,
        snapOffsetX,
        snapOffsetY,
        sortEnabled,
        usesAbsoluteLayout
      }
    };
  });

export { CommonValuesContext, CommonValuesProvider, useCommonValuesContext };
