import { type PropsWithChildren, useCallback } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useSharedValue, withTiming } from 'react-native-reanimated';

import { TIME_TO_ACTIVATE_PAN } from '../../constants';
import {
  useAnimatableValue,
  useHaptics,
  useJSStableCallback
} from '../../hooks';
import type {
  ActiveItemDecorationSettings,
  AnimatedValues,
  Position,
  SortableCallbacks
} from '../../types';
import { createEnhancedContext } from '../utils';
import { usePositionsContext } from './PositionsProvider';

type DragContextType = {
  disabled: boolean;
  activeItemKey: SharedValue<null | string>;
  touchedItemKey: SharedValue<null | string>;
  activationProgress: SharedValue<number>;
  inactiveAnimationProgress: SharedValue<number>;
  activeItemPosition: SharedValue<Position>;
  activeItemDropped: SharedValue<boolean>;
  handleDragStart: (key: string) => void;
  handleDragEnd: (key: string) => void;
  handleOrderChange: (
    key: string,
    fromIndex: number,
    toIndex: number,
    newOrder: Array<string>
  ) => void;
} & AnimatedValues<ActiveItemDecorationSettings>;

type DragProviderProps = PropsWithChildren<
  {
    dragDisabled: boolean;
    hapticsDisabled: boolean;
  } & ActiveItemDecorationSettings &
    SortableCallbacks
>;

const { DragProvider, useDragContext } = createEnhancedContext('Drag')<
  DragContextType,
  DragProviderProps
>(({
  activeItemOpacity: activeItemOpacityProp,
  activeItemScale: activeItemScaleProp,
  activeItemShadowOpacity: activeItemShadowOpacityProp,
  dragDisabled,
  hapticsDisabled,
  inactiveItemOpacity: inactiveItemOpacityProp,
  inactiveItemScale: inactiveItemScaleProp,
  onDragEnd,
  onDragStart,
  onOrderChange
}) => {
  const { indexToKey, keyToIndex } = usePositionsContext();

  const activeItemScale = useAnimatableValue(activeItemScaleProp);
  const activeItemOpacity = useAnimatableValue(activeItemOpacityProp);
  const activeItemShadowOpacity = useAnimatableValue(
    activeItemShadowOpacityProp
  );
  const inactiveItemScale = useAnimatableValue(inactiveItemScaleProp);
  const inactiveItemOpacity = useAnimatableValue(inactiveItemOpacityProp);

  const activeItemKey = useSharedValue<null | string>(null);
  const touchedItemKey = useSharedValue<null | string>(null);
  const activationProgress = useSharedValue(0);
  const inactiveAnimationProgress = useSharedValue(0);
  const activeItemPosition = useSharedValue<Position>({ x: 0, y: 0 });
  const activeItemDropped = useSharedValue(true);
  const dragStartIndex = useSharedValue(-1);

  // Create stable callbacks to avoid re-rendering when the callback
  // function is not memoized
  const stableOnDragStart = useJSStableCallback(onDragStart);
  const stableOnDragEnd = useJSStableCallback(onDragEnd);
  const stableOnOrderChange = useJSStableCallback(onOrderChange);

  const haptics = useHaptics(!hapticsDisabled);

  const handleDragStart = useCallback(
    (key: string) => {
      'worklet';
      activeItemKey.value = key;
      activeItemDropped.value = false;
      dragStartIndex.value = keyToIndex.value[key]!;

      haptics.medium();
      stableOnDragStart({
        fromIndex: dragStartIndex.value,
        key
      });
    },
    [
      stableOnDragStart,
      activeItemDropped,
      activeItemKey,
      dragStartIndex,
      keyToIndex,
      haptics
    ]
  );

  const handleDragEnd = useCallback(
    (key: string) => {
      'worklet';
      const delayed = (callback?: (finished: boolean | undefined) => void) =>
        withTiming(0, { duration: TIME_TO_ACTIVATE_PAN }, callback);

      touchedItemKey.value = null;
      inactiveAnimationProgress.value = delayed();
      activationProgress.value = delayed(finished => {
        if (finished) activeItemDropped.value = true;
      });

      if (activeItemKey.value !== null) {
        haptics.medium();
        activeItemKey.value = null;

        stableOnDragEnd({
          fromIndex: dragStartIndex.value,
          key,
          toIndex: keyToIndex.value[key]!
        });
      }
    },
    [
      activeItemDropped,
      touchedItemKey,
      activeItemKey,
      activationProgress,
      inactiveAnimationProgress,
      dragStartIndex,
      keyToIndex,
      stableOnDragEnd,
      haptics
    ]
  );

  const handleOrderChange = useCallback(
    (
      key: string,
      fromIndex: number,
      toIndex: number,
      newOrder: Array<string>
    ) => {
      'worklet';
      indexToKey.value = newOrder;

      haptics.light();
      stableOnOrderChange({
        fromIndex,
        key,
        newOrder,
        toIndex
      });
    },
    [indexToKey, stableOnOrderChange, haptics]
  );

  return {
    value: {
      activationProgress,
      activeItemDropped,
      activeItemKey,
      activeItemOpacity,
      activeItemPosition,
      activeItemScale,
      activeItemShadowOpacity,
      disabled: dragDisabled,
      handleDragEnd,
      handleDragStart,
      handleOrderChange,
      inactiveAnimationProgress,
      inactiveItemOpacity,
      inactiveItemScale,
      touchedItemKey
    }
  };
});

export { DragProvider, useDragContext };
