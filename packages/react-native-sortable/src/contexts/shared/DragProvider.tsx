import { type PropsWithChildren, useCallback } from 'react';
import type {
  GestureUpdateEvent,
  PanGestureHandlerEventPayload
} from 'react-native-gesture-handler';
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
  Dimensions,
  Position,
  SortableCallbacks
} from '../../types';
import { createEnhancedContext } from '../utils';
import { usePositionsContext } from './PositionsProvider';

type DragContextType = {
  disabled: boolean;
  activeItemKey: SharedValue<null | string>;
  touchedItemKey: SharedValue<null | string>;
  touchedItemDimensions: SharedValue<Dimensions | null>;
  activationProgress: SharedValue<number>;
  activeItemPosition: SharedValue<Position>;
  activeItemDropped: SharedValue<boolean>;
  dragStartPosition: SharedValue<Position>;
  handleDragStart: (key: string) => void;
  handleDragEnd: (key: string) => void;
  handleOrderChange: (
    key: string,
    fromIndex: number,
    toIndex: number,
    newOrder: Array<string>
  ) => void;
  handleDragUpdate: (
    e: GestureUpdateEvent<PanGestureHandlerEventPayload>,
    reverseXAxis?: boolean
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
  const { indexToKey, itemPositions, keyToIndex } = usePositionsContext();

  const activeItemScale = useAnimatableValue(activeItemScaleProp);
  const activeItemOpacity = useAnimatableValue(activeItemOpacityProp);
  const activeItemShadowOpacity = useAnimatableValue(
    activeItemShadowOpacityProp
  );
  const inactiveItemScale = useAnimatableValue(inactiveItemScaleProp);
  const inactiveItemOpacity = useAnimatableValue(inactiveItemOpacityProp);

  const activeItemKey = useSharedValue<null | string>(null);
  const touchedItemKey = useSharedValue<null | string>(null);
  const touchedItemDimensions = useSharedValue<Dimensions | null>(null);
  const activationProgress = useSharedValue(0);
  const activeItemPosition = useSharedValue<Position>({ x: 0, y: 0 });
  const activeItemDropped = useSharedValue(true);
  const dragStartPosition = useSharedValue<Position>({ x: 0, y: 0 });
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
      const startPosition = itemPositions.value[key] ?? { x: 0, y: 0 };

      dragStartPosition.value = activeItemPosition.value = startPosition;
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
      dragStartPosition,
      activeItemPosition,
      itemPositions,
      keyToIndex,
      haptics
    ]
  );

  const handleDragEnd = useCallback(
    (key: string) => {
      'worklet';
      touchedItemKey.value = null;
      activationProgress.value = withTiming(
        0,
        { duration: TIME_TO_ACTIVATE_PAN },
        () => {
          activeItemDropped.value = true;
        }
      );

      if (activeItemKey.value !== null) {
        activeItemKey.value = null;

        haptics.medium();
        stableOnDragEnd({
          fromIndex: dragStartIndex.value,
          key,
          toIndex: keyToIndex.value[key]!
        });
        dragStartIndex.value = -1;
      }
    },
    [
      activeItemDropped,
      touchedItemKey,
      activeItemKey,
      activationProgress,
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

  const handleDragUpdate = useCallback(
    (
      e: GestureUpdateEvent<PanGestureHandlerEventPayload>,
      reverseXAxis?: boolean
    ) => {
      'worklet';
      activeItemPosition.value = {
        x: dragStartPosition.value.x + (reverseXAxis ? -1 : 1) * e.translationX,
        y: dragStartPosition.value.y + e.translationY
      };
    },
    [activeItemPosition, dragStartPosition]
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
      dragStartPosition,
      handleDragEnd,
      handleDragStart,
      handleDragUpdate,
      handleOrderChange,
      inactiveItemOpacity,
      inactiveItemScale,
      touchedItemDimensions,
      touchedItemKey
    }
  };
});

export { DragProvider, useDragContext };
