import { useRef } from 'react';
import {
  interpolate,
  makeMutable,
  type SharedValue,
  useAnimatedReaction,
  withTiming
} from 'react-native-reanimated';

import type { Vector } from '../../../types';
import { areVectorsDifferent, useMutableValue } from '../../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';

export default function useItemPosition(
  key: string,
  activationAnimationProgress: SharedValue<number>
): SharedValue<null | Vector> {
  const {
    activeItemKey,
    activeItemPosition,
    animateLayoutOnReorderOnly,
    itemPositions,
    shouldAnimateLayout
  } = useCommonValuesContext();

  const positionRef = useRef<SharedValue<null | Vector>>(null);
  const dropStartValues = useMutableValue<null | {
    position: Vector;
    progress: number;
  }>(null);

  positionRef.current ??= makeMutable(
    activeItemKey.value === key
      ? activeItemPosition.value
      : (itemPositions.value[key] ?? null)
  );

  const result = positionRef.current;

  // Inactive item updater
  useAnimatedReaction(
    () => ({
      activationProgress: activationAnimationProgress.value,
      isActive: activeItemKey.value === key,
      itemPosition: itemPositions.value[key]
    }),
    ({ activationProgress, isActive, itemPosition }, prev) => {
      if (!itemPosition || isActive) {
        dropStartValues.value = null;
        return;
      }

      if (!result.value) {
        result.value = itemPosition;
        return;
      }

      const positionChanged =
        prev?.itemPosition &&
        areVectorsDifferent(prev.itemPosition, itemPosition);

      if (activationProgress === 0) {
        dropStartValues.value = null;
      }
      // Set dropStartValues only if the item was previously active or if is
      // already during the drop animation and the target position changed
      else if (dropStartValues.value ? positionChanged : prev?.isActive) {
        dropStartValues.value = {
          position: result.value,
          progress: activationProgress
        };
      }

      if (dropStartValues.value) {
        const {
          position: { x, y },
          progress
        } = dropStartValues.value;
        const animate = (from: number, to: number) =>
          interpolate(activationProgress, [progress, 0], [from, to]);

        result.value = {
          x: animate(x, itemPosition.x),
          y: animate(y, itemPosition.y)
        };
        return;
      }

      if (!positionChanged) {
        return;
      }

      if (
        shouldAnimateLayout.value &&
        (!animateLayoutOnReorderOnly.value || activeItemKey.value !== null)
      ) {
        result.value = withTiming(itemPosition);
      } else {
        result.value = itemPosition;
      }
    }
  );

  // Active item updater
  useAnimatedReaction(
    () => ({
      isActive: activeItemKey.value === key,
      position: activeItemPosition.value
    }),
    ({ isActive, position }) => {
      if (isActive && position) {
        result.value = position;
      }
    }
  );

  return result;
}
