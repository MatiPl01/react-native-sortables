import { type PropsWithChildren, useCallback } from 'react';
import type {
  GestureTouchEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload
} from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import { useSharedValue, withTiming } from 'react-native-reanimated';

import { TIME_TO_ACTIVATE_PAN } from '../../../constants';
import {
  useAnimatableValue,
  useHaptics,
  useJSStableCallback
} from '../../../hooks';
import type {
  ActiveItemDecorationSettings,
  AnimatedValues,
  SortableCallbacks,
  Vector
} from '../../../types';
import { createEnhancedContext } from '../../utils';
import { LayerState, useLayerContext } from './LayerProvider';
import { usePositionsContext } from './PositionsProvider';

type DragContextType = {
  enabled: boolean;
  activeItemKey: SharedValue<null | string>;
  touchedItemKey: SharedValue<null | string>;
  activationProgress: SharedValue<number>;
  inactiveAnimationProgress: SharedValue<number>;
  activeItemTranslation: SharedValue<Vector | null>;
  activeItemDropped: SharedValue<boolean>;
  handleTouchStart: (e: GestureTouchEvent, key: string) => void;
  handleDragStart: (key: string) => void;
  handleDragUpdate: (
    e: GestureUpdateEvent<PanGestureHandlerEventPayload>,
    reverseXAxis?: boolean
  ) => void;
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
    dragEnabled: boolean;
    hapticsEnabled: boolean;
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
  dragEnabled,
  hapticsEnabled,
  inactiveItemOpacity: inactiveItemOpacityProp,
  inactiveItemScale: inactiveItemScaleProp,
  onDragEnd,
  onDragStart,
  onOrderChange
}) => {
  const {
    indexToKey,
    itemPositions,
    keyToIndex,
    relativeTouchPosition,
    touchStartPosition
  } = usePositionsContext();
  const { updateLayer } = useLayerContext() ?? {};

  const activeItemScale = useAnimatableValue(activeItemScaleProp);
  const activeItemOpacity = useAnimatableValue(activeItemOpacityProp);
  const activeItemShadowOpacity = useAnimatableValue(
    activeItemShadowOpacityProp
  );
  const inactiveItemScale = useAnimatableValue(inactiveItemScaleProp);
  const inactiveItemOpacity = useAnimatableValue(inactiveItemOpacityProp);
  const activeItemTranslation = useSharedValue<Vector | null>(null);

  const activeItemKey = useSharedValue<null | string>(null);
  const touchedItemKey = useSharedValue<null | string>(null);
  const activationProgress = useSharedValue(0);
  const inactiveAnimationProgress = useSharedValue(0);
  const activeItemDropped = useSharedValue(true);
  const dragStartIndex = useSharedValue(-1);

  // Create stable callbacks to avoid re-rendering when the callback
  // function is not memoized
  const stableOnDragStart = useJSStableCallback(onDragStart);
  const stableOnDragEnd = useJSStableCallback(onDragEnd);
  const stableOnOrderChange = useJSStableCallback(onOrderChange);

  const haptics = useHaptics(hapticsEnabled);

  const handleTouchStart = useCallback(
    (e: GestureTouchEvent, key: string) => {
      'worklet';
      touchedItemKey.value = key;
      activationProgress.value = 0;
      updateLayer?.(LayerState.Focused);

      const itemPosition = itemPositions.value[key];
      if (itemPosition) {
        touchStartPosition.value = itemPosition;
        const touch = e.allTouches[0];
        relativeTouchPosition.value = touch
          ? {
              x: touch.x,
              y: touch.y
            }
          : null;
      }
    },
    [
      touchedItemKey,
      activationProgress,
      touchStartPosition,
      itemPositions,
      relativeTouchPosition,
      updateLayer
    ]
  );

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
      touchStartPosition.value = null;
      relativeTouchPosition.value = null;
      activeItemTranslation.value = null;

      inactiveAnimationProgress.value = delayed();
      activationProgress.value = delayed(finished => {
        if (finished) {
          activeItemDropped.value = true;
          updateLayer?.(LayerState.Idle);
        }
      });

      if (activeItemKey.value !== null) {
        activeItemKey.value = null;
        updateLayer?.(LayerState.Intermediate);
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
      touchedItemKey,
      touchStartPosition,
      relativeTouchPosition,
      activeItemTranslation,
      activeItemDropped,
      activeItemKey,
      activationProgress,
      inactiveAnimationProgress,
      dragStartIndex,
      keyToIndex,
      stableOnDragEnd,
      updateLayer,
      haptics
    ]
  );

  const handleDragUpdate = useCallback(
    (
      e: GestureUpdateEvent<PanGestureHandlerEventPayload>,
      reverseXAxis?: boolean
    ) => {
      'worklet';
      activeItemTranslation.value = {
        x: (reverseXAxis ? -1 : 1) * e.translationX,
        y: e.translationY
      };
    },
    [activeItemTranslation]
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
      activeItemScale,
      activeItemShadowOpacity,
      activeItemTranslation,
      enabled: dragEnabled,
      handleDragEnd,
      handleDragStart,
      handleDragUpdate,
      handleOrderChange,
      handleTouchStart,
      inactiveAnimationProgress,
      inactiveItemOpacity,
      inactiveItemScale,
      touchedItemKey
    }
  };
});

export { DragProvider, useDragContext };
