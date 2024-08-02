import { useMemo } from 'react';
import type { EasingFunction, SharedValue } from 'react-native-reanimated';
import {
  Easing,
  useAnimatedReaction,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { useAnimatableValue } from '../../hooks';
import type { Animatable, Dimensions, Maybe, Vector } from '../../types';
import {
  useDragContext,
  useMeasurementsContext,
  usePositionsContext
} from './providers';

type UseItemPositionOptions = {
  ignoreActive?: boolean;
  easing?: EasingFunction;
  duration?: number;
};

export function useItemPosition(
  key: Animatable<null | string>,
  {
    duration = 300,
    easing = Easing.inOut(Easing.ease),
    ignoreActive = false
  }: UseItemPositionOptions = {}
): {
  x: SharedValue<null | number>;
  y: SharedValue<null | number>;
} {
  const { itemPositions, touchedItemPosition } = usePositionsContext();
  const { touchedItemKey } = useDragContext();

  const itemKey = useAnimatableValue(key);
  const x = useSharedValue<null | number>(null);
  const y = useSharedValue<null | number>(null);

  const animationConfig = useMemo(
    () => ({
      duration,
      easing
    }),
    [duration, easing]
  );

  useAnimatedReaction(
    () => itemKey.value,
    k => {
      // Reset the position if the new key is provided (don't reset if the key is null,
      // in order to finish the animation when the item is dropped)
      if (k !== null) {
        x.value = null;
        y.value = null;
      }
    }
  );

  useAnimatedReaction(
    () => ({
      isActive: touchedItemKey.value === itemKey.value,
      position:
        itemKey.value !== null ? itemPositions.value[itemKey.value] : null
    }),
    ({ isActive, position }) => {
      if (!position || (!ignoreActive && isActive)) {
        return;
      }
      x.value =
        x.value === null ? position.x : withTiming(position.x, animationConfig);
      y.value =
        y.value === null ? position.y : withTiming(position.y, animationConfig);
    },
    [ignoreActive, animationConfig]
  );

  useAnimatedReaction(
    () => ({
      position: touchedItemPosition.value
    }),
    ({ position }) => {
      if (!ignoreActive && touchedItemKey.value === itemKey.value && position) {
        x.value = position.x;
        y.value = position.y;
      }
    },
    [ignoreActive]
  );

  return { x, y };
}

export function useItemDimensions(key: Animatable<null | string>): {
  width: SharedValue<number>;
  height: SharedValue<number>;
} {
  const { itemDimensions, overrideItemDimensions } = useMeasurementsContext();

  const itemKey = useAnimatableValue(key);
  const width = useSharedValue(0);
  const height = useSharedValue(0);

  useAnimatedReaction(
    () => ({
      dimensions: itemDimensions.value,
      k: itemKey.value,
      overrideDimensions: overrideItemDimensions.value
    }),
    ({ dimensions, k, overrideDimensions }) => {
      if (k === null) {
        return;
      }

      const override = overrideDimensions[k];
      const dims = dimensions[k];

      width.value = override?.width ?? dims?.width ?? 0;
      height.value = override?.height ?? dims?.height ?? 0;
    }
  );

  return { height, width };
}

export function useItemZIndex(
  key: string,
  pressProgress: SharedValue<number>,
  position: {
    x: SharedValue<null | number>;
    y: SharedValue<null | number>;
  }
): SharedValue<number> {
  const { itemPositions } = usePositionsContext();
  const { touchedItemKey } = useDragContext();

  const zIndex = useSharedValue(0);

  useAnimatedReaction(
    () => ({
      isTouched: touchedItemKey.value === key,
      progress: pressProgress.value,
      targetPosition: itemPositions.value[key]
    }),
    ({ isTouched, progress, targetPosition }) => {
      if (isTouched) {
        zIndex.value = 3;
      } else if (progress > 0) {
        zIndex.value = 2;
      } else if (
        targetPosition &&
        (position.x.value !== targetPosition.x ||
          position.y.value !== targetPosition.y)
      ) {
        zIndex.value = 1;
      } else {
        zIndex.value = 0;
      }
    }
  );

  return zIndex;
}

export function useOrderUpdater(
  callback: (props: {
    activeKey: string;
    activeIndex: number;
    dimensions: Dimensions;
    position: Vector;
    centerPosition: Vector;
  }) => Maybe<Array<string>>,
  deps?: Array<unknown>
) {
  const { keyToIndex, touchedItemPosition } = usePositionsContext();
  const { itemDimensions } = useMeasurementsContext();
  const { activeItemKey, handleOrderChange } = useDragContext();

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      activePosition: touchedItemPosition.value
    }),
    ({ activeKey, activePosition }) => {
      if (activeKey === null || activePosition === null) {
        return;
      }
      const dimensions = itemDimensions.value[activeKey];
      if (!dimensions) {
        return;
      }

      const centerY = activePosition.y + dimensions.height / 2;
      const centerX = activePosition.x + dimensions.width / 2;
      const activeIndex = keyToIndex.value[activeKey];

      if (activeIndex === undefined) {
        return;
      }

      const centerPosition = {
        x: centerX,
        y: centerY
      };

      const newOrder = callback({
        activeIndex,
        activeKey,
        centerPosition,
        dimensions,
        position: activePosition
      });

      if (newOrder) {
        handleOrderChange(
          activeKey,
          activeIndex,
          newOrder.indexOf(activeKey),
          newOrder
        );
      }
    },
    deps
  );
}
