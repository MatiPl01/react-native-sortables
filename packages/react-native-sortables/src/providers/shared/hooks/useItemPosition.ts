import { useRef } from 'react';
import {
  interpolate,
  makeMutable,
  type SharedValue,
  useAnimatedReaction,
  withTiming
} from 'react-native-reanimated';

import { useMutableValue } from '../../../integrations/reanimated';
import type { Vector } from '../../../types';
import { areVectorsDifferent } from '../../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';

export default function useItemPosition(
  key: string,
  isActive: SharedValue<boolean>,
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
    isActive.value
      ? activeItemPosition.value
      : (itemPositions.value[key] ?? null)
  );

  const result = positionRef.current;

  // Inactive item updater
  useAnimatedReaction(
    () => ({
      activationProgress: activationAnimationProgress.value,
      active: isActive.value,
      itemPosition: itemPositions.value[key]
    }),
    ({ activationProgress, active, itemPosition }, prev) => {
      if (!itemPosition || active) {
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
      else if (dropStartValues.value ? positionChanged : prev?.active) {
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
      active: isActive.value,
      position: activeItemPosition.value
    }),
    ({ active, position }) => {
      if (active && position) {
        result.value = position;
      }
    }
  );

  return result;
}
