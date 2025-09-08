import { type PropsWithChildren, useEffect, useMemo } from 'react';
import type { View } from 'react-native';
import { useAnimatedRef, useDerivedValue } from 'react-native-reanimated';

import type { Animatable } from '../../integrations/reanimated';
import {
  useAnimatableValue,
  useMutableValue
} from '../../integrations/reanimated';
import type {
  ActiveItemDecorationSettings,
  ActiveItemSnapSettings,
  CommonValuesContextType,
  ControlledDimensions,
  Dimensions,
  ItemDragSettings,
  ItemSizes,
  ItemsLayoutTransitionMode,
  Vector
} from '../../types';
import { DragActivationState } from '../../types';
import { getKeyToIndex } from '../../utils';
import { createProvider } from '../utils';
import { useItemsContext } from './ItemsProvider';

let nextId = 0;

type CommonValuesProviderProps = PropsWithChildren<
  ActiveItemDecorationSettings &
    ActiveItemSnapSettings &
    Omit<ItemDragSettings, 'overDrag' | 'reorderTriggerOrigin'> & {
      sortEnabled: Animatable<boolean>;
      customHandle: boolean;
      controlledContainerDimensions: ControlledDimensions;
      controlledItemDimensions: ControlledDimensions;
      itemsLayoutTransitionMode: ItemsLayoutTransitionMode;
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
    controlledItemDimensions,
    customHandle,
    dragActivationDelay: _dragActivationDelay,
    dragActivationFailOffset: _dragActivationFailOffset,
    dropAnimationDuration: _dropAnimationDuration,
    enableActiveItemSnap: _enableActiveItemSnap,
    inactiveItemOpacity: _inactiveItemOpacity,
    inactiveItemScale: _inactiveItemScale,
    itemsLayoutTransitionMode,
    snapOffsetX: _snapOffsetX,
    snapOffsetY: _snapOffsetY,
    sortEnabled: _sortEnabled
  }) => {
    const { getKeys, subscribeKeys } = useItemsContext();

    const containerId = useMemo(() => nextId++, []);

    // ORDER
    const indexToKey = useMutableValue<Array<string>>(getKeys());
    const keyToIndex = useDerivedValue(() => getKeyToIndex(indexToKey.value));

    // POSITIONS
    const touchPosition = useMutableValue<null | Vector>(null);
    const activeItemPosition = useMutableValue<null | Vector>(null);
    const itemPositions = useMutableValue<Record<string, Vector>>({});

    // DIMENSIONS
    const containerWidth = useMutableValue<null | number>(null);
    const containerHeight = useMutableValue<null | number>(null);
    const itemWidths = useMutableValue<ItemSizes>(
      controlledItemDimensions.width ? null : {}
    );
    const itemHeights = useMutableValue<ItemSizes>(
      controlledItemDimensions.height ? null : {}
    );
    const activeItemDimensions = useMutableValue<Dimensions | null>(null);

    // DRAG STATE
    const activeItemKey = useMutableValue<null | string>(null);
    const prevActiveItemKey = useMutableValue<null | string>(null);
    const activationState = useMutableValue(DragActivationState.INACTIVE);
    const activeAnimationProgress = useMutableValue(0);
    const inactiveAnimationProgress = useMutableValue(0);
    const activeItemDropped = useMutableValue(true);

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

    useEffect(
      () =>
        subscribeKeys(() => {
          indexToKey.value = getKeys();
        }),
      [getKeys, subscribeKeys, indexToKey]
    );

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
        containerHeight,
        containerId,
        containerRef,
        containerWidth,
        controlledContainerDimensions,
        controlledItemDimensions,
        customHandle,
        dragActivationDelay,
        dragActivationFailOffset,
        dropAnimationDuration,
        enableActiveItemSnap,
        inactiveAnimationProgress,
        inactiveItemOpacity,
        inactiveItemScale,
        indexToKey,
        itemHeights,
        itemPositions,
        itemsLayoutTransitionMode,
        itemWidths,
        keyToIndex,
        prevActiveItemKey,
        shouldAnimateLayout,
        snapOffsetX,
        snapOffsetY,
        sortEnabled,
        touchPosition,
        usesAbsoluteLayout
      }
    };
  });

export { CommonValuesContext, CommonValuesProvider, useCommonValuesContext };
