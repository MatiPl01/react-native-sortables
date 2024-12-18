import {
  type SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import type { AnimatedVector } from '../../../types';
import { useCommonValuesContext } from '../CommonValuesProvider';

export default function useItemTranslation(
  key: string,
  layoutPosition: AnimatedVector,
  pressProgress: SharedValue<number>
) {
  const { itemPositions, touchedItemKey, touchedItemPosition } =
    useCommonValuesContext();

  const hasPressProgress = useDerivedValue(() => pressProgress.value > 0);
  const x = useSharedValue<null | number>(null);
  const y = useSharedValue<null | number>(null);

  useAnimatedReaction(
    () => {
      const isTouched = touchedItemKey.value === key;
      return {
        hasProgress: hasPressProgress.value,
        isTouched,
        position: isTouched
          ? touchedItemPosition.value
          : itemPositions.value[key]
      };
    },
    ({ hasProgress, isTouched, position }) => {
      if (!position) {
        return;
      }

      const layoutX = layoutPosition.x.value;
      const layoutY = layoutPosition.y.value;
      const newX = position.x - (layoutX ?? 0);
      const newY = position.y - (layoutY ?? 0);

      if (isTouched || layoutX === null || layoutY === null) {
        // Apply the translation immediately if the item is being dragged or
        // the item was mounted with the absolute position and we cannot set
        // its top, left values because they will be animated from 0, 0 by the
        // layout animation.
        x.value = newX;
        y.value = newY;
      } else if (hasProgress) {
        // If the was dropped (has press progress but is no longer touched),
        // we animate the translation to the target position.
        x.value = withTiming(newX);
        y.value = withTiming(newY);
      } else if (x.value === null || y.value === null) {
        // If the item was mounted with the relative position, we set the
        // translation to 0, 0. This just indicates that transformation values
        // are set to proper values and the absolute position can be applied.
        x.value = 0;
        y.value = 0;
      }
    }
  );

  return { x, y };
}
