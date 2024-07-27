import { type PropsWithChildren } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { runOnJS, useSharedValue, withTiming } from 'react-native-reanimated';

import { TIME_TO_ACTIVATE_PAN } from '../../constants';
import { useAnimatableValue, useStableCallback } from '../../hooks';
import type {
  ActiveItemDecorationSettings,
  AnimatedValues,
  Position,
  SortableCallbacks
} from '../../types';
import { createEnhancedContext } from '../utils';
import { usePositionsContext } from './PositionsProvider';

type DragContextType = {
  enabled: boolean;
  activeItemKey: SharedValue<null | string>;
  touchedItemKey: SharedValue<null | string>;
  activationProgress: SharedValue<number>;
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
    enabled: boolean;
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
  enabled,
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
  const activeItemPosition = useSharedValue<Position>({ x: 0, y: 0 });
  const activeItemDropped = useSharedValue(true);
  const dragStartIndex = useSharedValue(-1);

  const handleDragStart = useStableCallback((key: string) => {
    'worklet';
    activeItemKey.value = key;
    activeItemDropped.value = false;
    dragStartIndex.value = keyToIndex.value[key]!;

    if (onDragStart) {
      runOnJS(onDragStart)({
        fromIndex: dragStartIndex.value,
        key
      });
    }
  });

  const handleDragEnd = useStableCallback((key: string) => {
    'worklet';
    touchedItemKey.value = null;
    activeItemKey.value = null;
    activationProgress.value = withTiming(
      0,
      { duration: TIME_TO_ACTIVATE_PAN },
      () => {
        activeItemDropped.value = true;
      }
    );

    if (onDragEnd) {
      runOnJS(onDragEnd)({
        fromIndex: dragStartIndex.value,
        key,
        toIndex: keyToIndex.value[key]!
      });
    }
  });

  const handleOrderChange = useStableCallback(
    (
      key: string,
      fromIndex: number,
      toIndex: number,
      newOrder: Array<string>
    ) => {
      'worklet';
      indexToKey.value = newOrder;

      if (onOrderChange) {
        runOnJS(onOrderChange)({
          fromIndex,
          key,
          newOrder,
          toIndex
        });
      }
    }
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
      enabled,
      handleDragEnd,
      handleDragStart,
      handleOrderChange,
      inactiveItemOpacity,
      inactiveItemScale,
      touchedItemKey
    }
  };
});

export { DragProvider, useDragContext };
