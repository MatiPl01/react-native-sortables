import { useMemo } from 'react';
import type { EasingFunction, SharedValue } from 'react-native-reanimated';
import {
  Easing,
  useAnimatedReaction,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { useAnimatableValue } from '../../../hooks';
import type { Animatable } from '../../../types';
import { useCommonValuesContext } from '../CommonValuesProvider';

type UseItemPositionOptions = {
  ignoreActive?: boolean;
  easing?: EasingFunction;
  duration?: number;
};

export default function useItemPosition(
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
  const { itemPositions, touchedItemKey, touchedItemPosition } =
    useCommonValuesContext();

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
      isActive: touchedItemKey.value === itemKey.value,
      position: touchedItemPosition.value
    }),
    ({ isActive, position }) => {
      if (!ignoreActive && isActive && position) {
        x.value = position.x;
        y.value = position.y;
      }
    },
    [ignoreActive]
  );

  return { x, y };
}
