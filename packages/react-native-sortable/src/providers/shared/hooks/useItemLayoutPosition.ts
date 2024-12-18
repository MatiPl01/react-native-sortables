import {
  type SharedValue,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated';

import type { AnimatedVector } from '../../../types';
import { useCommonValuesContext } from '../CommonValuesProvider';

export default function useItemLayoutPosition(
  key: string,
  pressProgress: SharedValue<number>
): AnimatedVector {
  const { canSwitchToAbsoluteLayout, itemPositions } = useCommonValuesContext();

  const x = useSharedValue<null | number>(null);
  const y = useSharedValue<null | number>(null);
  const dx = useSharedValue<null | number>(null);
  const dy = useSharedValue<null | number>(null);

  useAnimatedReaction(
    () => ({
      position: key !== null ? itemPositions.value[key] : null
    }),
    ({ position }) => {
      if (!position) {
        return;
      }

      if (
        (x.value === null || y.value === null) &&
        dx.value !== null &&
        dy.value !== null
      ) {
        x.value = 0;
        y.value = 0;
      }

      if (pressProgress?.value) {
        // If the progress of the item press animation is greater than 0, that means
        // the item is being dragged or was dropped and haven't reached the final
        // position yet. In this case, we just update deltas to properly position
        // the item considering the current translation.
        dx.value = position.x - (x.value ?? 0);
        dy.value = position.y - (y.value ?? 0);
      } else if (
        !canSwitchToAbsoluteLayout.value ||
        (dx.value !== null && dy.value !== null)
      ) {
        // If transitioning from the relative layout (!canSwitchToAbsoluteLayout.value)
        // or if deltas are already set (so the item is already in the correct position),
        // we can react to the position changes and set the position values directly.
        if (dx.value === null || dy.value === null) {
          dx.value = 0;
          dy.value = 0;
        }
        x.value = position.x - dx.value;
        y.value = position.y - dy.value;
      } else {
        // If the absolute layout is already applied, the item will be rendered
        // in the top-left corner by default (so its position is 0, 0). In this
        // case we can't set x, y position values because they will be animated
        // from 0, 0 by the layout animation. In such a case, we apply transform
        // to the item to make it appear in the correct position and set deltas
        // to make future updates via the layout animation.
        dx.value = position.x;
        dy.value = position.y;
      }
    }
  );

  return { x, y };
}
