import type { SharedValue } from 'react-native-reanimated';
import {
  interpolate,
  measure,
  useAnimatedReaction,
  useDerivedValue
} from 'react-native-reanimated';

import type { Vector } from '../../../types';
import { useMutableValue } from '../../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { usePortalContext } from '../PortalProvider';

export default function useTeleportedItemPosition(
  key: string,
  isActive: SharedValue<boolean>,
  activationAnimationProgress: SharedValue<number>
) {
  const { activeItemAbsolutePosition } = usePortalContext() ?? {};
  const { activeItemKey, containerRef, itemPositions } =
    useCommonValuesContext();

  const dropStartValues = useMutableValue<null | {
    fromAbsolute: Vector;
    progress: number;
    toRelative: Vector;
  }>(null);

  // Drop start values calculation reaction
  useAnimatedReaction(
    () => ({
      active: activeItemKey.value === key
    }),
    ({ active }) => {
      if (active) {
        dropStartValues.value = null;
      } else if (
        activeItemAbsolutePosition?.value &&
        itemPositions.value[key]
      ) {
        dropStartValues.value = {
          fromAbsolute: activeItemAbsolutePosition.value,
          progress: activationAnimationProgress.value,
          toRelative: itemPositions.value[key]
        };
      }
    }
  );

  const absoluteItemPosition = useDerivedValue(() => {
    if (isActive.value) {
      return activeItemAbsolutePosition?.value ?? null;
    }

    if (dropStartValues.value) {
      const measurements = measure(containerRef);
      if (!measurements) {
        return null;
      }

      const { fromAbsolute, progress, toRelative } = dropStartValues.value;

      const animate = (source: number, target: number) =>
        interpolate(
          activationAnimationProgress.value,
          [progress, 0],
          [source, target]
        );

      return {
        x: animate(fromAbsolute.x, measurements.pageX + toRelative.x),
        y: animate(fromAbsolute.y, measurements.pageY + toRelative.y)
      };
    }

    return null;
  });

  // Drop start values updater on target position change
  useAnimatedReaction(
    () => itemPositions.value[key],
    position => {
      if (
        isActive.value ||
        activationAnimationProgress.value === 0 ||
        !position ||
        !absoluteItemPosition.value
      ) {
        return;
      }

      dropStartValues.value = {
        fromAbsolute: absoluteItemPosition.value,
        progress: activationAnimationProgress.value,
        toRelative: position
      };
    }
  );

  return absoluteItemPosition;
}
