/* eslint-disable import/no-unused-modules */
import { useMemo } from 'react';
import type { EasingFunction, SharedValue } from 'react-native-reanimated';
import {
  Easing,
  isSharedValue,
  useAnimatedReaction,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { useAnimatedSelect } from '../../hooks';
import type {
  Animatable,
  AnimatedOptionalPosition,
  Dimensions,
  Position
} from '../../types';
import {
  useDragContext,
  useMeasurementsContext,
  usePositionsContext
} from '../shared';

type UseItemPositionOptions = {
  ignoreActive?: boolean;
  easing?: EasingFunction;
  duration?: number;
};

export function useItemPosition(
  animatableKey: Animatable<null | string>,
  isActive: Animatable<boolean>,
  {
    duration = 300,
    easing = Easing.inOut(Easing.ease)
  }: UseItemPositionOptions = {}
): { current: AnimatedOptionalPosition | null } {
  const { currentItemPositions, targetItemPositions } = usePositionsContext();

  const currentPosition = useAnimatedSelect(k => {
    'worklet';
    return k !== null ? currentItemPositions.get(k) ?? null : null;
  }, animatableKey);
  const targetPosition = useAnimatedSelect(k => {
    'worklet';
    return k !== null ? targetItemPositions.get(k) ?? null : null;
  }, animatableKey);
  const animationConfig = useMemo(
    () => ({
      duration,
      easing
    }),
    [duration, easing]
  );

  // Animate to the target position oly when the item is not active
  // The drag provider will animate the position of the currently active item
  useAnimatedReaction(
    () => ({
      active: isSharedValue(isActive) ? isActive.value : isActive,
      targetX: targetPosition.current?.x.value ?? null,
      targetY: targetPosition.current?.y.value ?? null
    }),
    ({ active, targetX, targetY }) => {
      if (
        targetX === null ||
        targetY === null ||
        !currentPosition.current ||
        active !== null
      ) {
        return;
      }
      currentPosition.current.x.value =
        currentPosition.current.x.value === null
          ? targetX
          : withTiming(targetX, animationConfig);
      currentPosition.current.y.value =
        currentPosition.current.y.value === null
          ? targetY
          : withTiming(targetY, animationConfig);
    },
    [animationConfig, isActive]
  );

  return currentPosition;
}

export function useItemDimensions(animatableKey: Animatable<null | string>): {
  width: SharedValue<number>;
  height: SharedValue<number>;
} {
  const { itemDimensions, overrideItemDimensions } = useMeasurementsContext();

  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const overrideDimensions = useAnimatedSelect(k => {
    'worklet';
    return k !== null ? overrideItemDimensions.get(k) ?? null : null;
  }, animatableKey);

  useAnimatedReaction(
    () => {
      const key = isSharedValue(animatableKey)
        ? animatableKey.value
        : animatableKey;
      return (
        key && {
          h:
            overrideDimensions.current?.value?.height ??
            itemDimensions.value[key]?.height ??
            0,
          w:
            overrideDimensions.current?.value?.width ??
            itemDimensions.value[key]?.width ??
            0
        }
      );
    },
    dimensions => {
      if (dimensions) {
        width.value = dimensions.w;
        height.value = dimensions.h;
      }
    }
  );

  return { height, width };
}

export function useActiveItemReaction(
  callback: (props: {
    activeKey: string;
    activeIndex: number;
    dimensions: Dimensions;
    position: Position;
    centerPosition: Position;
  }) => void,
  deps?: Array<unknown>
) {
  const { keyToIndex } = usePositionsContext();
  const { itemDimensions } = useMeasurementsContext();
  const { activeItemKey, activeItemPosition } = useDragContext();

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      activePosition: activeItemPosition.value
    }),
    ({ activeKey, activePosition }) => {
      if (activeKey === null) {
        return;
      }
      const dimensions = itemDimensions.value[activeKey];
      if (!dimensions) {
        return;
      }

      const centerY = activePosition.y + dimensions.height / 2;
      const centerX = activePosition.x + dimensions.width / 2;
      const activeIndex = keyToIndex.get(activeKey)?.value;

      if (activeIndex === undefined) {
        return;
      }

      const centerPosition = {
        x: centerX,
        y: centerY
      };

      callback({
        activeIndex,
        activeKey,
        centerPosition,
        dimensions,
        position: activePosition
      });
    },
    deps
  );
}

export function useItemZIndex(
  key: string,
  pressProgress: SharedValue<number>
): SharedValue<number> {
  const { activeItemKey } = useDragContext();
  const { currentItemPositions, targetItemPositions } = usePositionsContext();

  const zIndex = useSharedValue(0);
  const { x: currentX, y: currentY } = currentItemPositions.get(key, true);
  const { x: targetX, y: targetY } = targetItemPositions.get(key, true);

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      currentPosition: { x: currentX.value, y: currentY.value },
      isPressed: pressProgress.value > 0,
      targetPosition: { x: targetX.value, y: targetY.value }
    }),
    ({ activeKey, currentPosition, isPressed, targetPosition }) => {
      if (activeKey === key) {
        // is active
        zIndex.value = 3;
      } else if (isPressed) {
        // is being activated (is pressed)
        zIndex.value = 2;
      } else if (
        // is being re-ordered in reaction to active item movement
        currentPosition.x !== targetPosition.x ||
        currentPosition.y !== targetPosition.y
      ) {
        zIndex.value = 1;
      } else {
        // neither changes its position nor is active
        zIndex.value = 0;
      }
    }
  );

  return zIndex;
}
