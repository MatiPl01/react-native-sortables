import { type PropsWithChildren, useCallback } from 'react';
import type {
  GestureTouchEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload
} from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import {
  useAnimatedReaction,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

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
  SortableCallbacks,
  Vector
} from '../../types';
import { createEnhancedContext } from '../utils';
import { usePositionsContext } from './PositionsProvider';

type DragContextType = {
  disabled: boolean;
  activeItemKey: SharedValue<null | string>;
  touchedItemKey: SharedValue<null | string>;
  touchedItemDimensions: SharedValue<Dimensions | null>;
  activationProgress: SharedValue<number>;
  touchedItemPosition: SharedValue<Vector | null>;
  activeItemDropped: SharedValue<boolean | null>;
  handleTouchStart: (e: GestureTouchEvent, key: string) => void;
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
  const touchStartPosition = useSharedValue<Vector | null>(null);
  const relativeTouchPosition = useSharedValue<Vector | null>(null);
  const activeItemTranslation = useSharedValue<Vector | null>(null);
  const touchedItemPosition = useSharedValue<Vector | null>(null);
  const activationProgress = useSharedValue(0);
  const activeItemDropped = useSharedValue(true);
  const dragStartIndex = useSharedValue(-1);

  // Create stable callbacks to avoid re-rendering when the callback
  // function is not memoized
  const stableOnDragStart = useJSStableCallback(onDragStart);
  const stableOnDragEnd = useJSStableCallback(onDragEnd);
  const stableOnOrderChange = useJSStableCallback(onOrderChange);

  const haptics = useHaptics(!hapticsDisabled);

  useAnimatedReaction(
    () => ({
      dimensions: touchedItemDimensions.value,
      progress: activationProgress.value,
      startPosition: touchStartPosition.value,
      touchPosition: relativeTouchPosition.value,
      translation: activeItemTranslation.value
    }),
    ({ dimensions, progress, startPosition, touchPosition, translation }) => {
      if (!dimensions || !startPosition) {
        touchedItemPosition.value = null;
        return;
      }
      const dx = touchPosition ? dimensions.width / 2 - touchPosition.x : 0;
      const dy = touchPosition ? dimensions.height / 2 - touchPosition.y : 0;

      touchedItemPosition.value = {
        x: startPosition.x + (translation?.x ?? 0) - dx * progress,
        y: startPosition.y + (translation?.y ?? 0) - dy * progress
      };
    }
  );

  const handleTouchStart = useCallback(
    (e: GestureTouchEvent, key: string) => {
      'worklet';
      touchedItemKey.value = key;
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
    [touchedItemKey, touchStartPosition, itemPositions, relativeTouchPosition]
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
      touchedItemKey.value = null;
      touchStartPosition.value = null;
      relativeTouchPosition.value = null;
      activeItemTranslation.value = null;

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
      touchStartPosition,
      relativeTouchPosition,
      activeItemTranslation,
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
      activeItemTranslation.value = {
        x: (reverseXAxis ? -1 : 1) * e.translationX,
        y: e.translationY
      };
    },
    [activeItemTranslation]
  );

  return {
    value: {
      activationProgress,
      activeItemDropped,
      activeItemKey,
      activeItemOpacity,
      activeItemScale,
      activeItemShadowOpacity,
      disabled: dragDisabled,
      handleDragEnd,
      handleDragStart,
      handleDragUpdate,
      handleOrderChange,
      handleTouchStart,
      inactiveItemOpacity,
      inactiveItemScale,
      touchedItemDimensions,
      touchedItemKey,
      touchedItemPosition
    }
  };
});

export { DragProvider, useDragContext };
